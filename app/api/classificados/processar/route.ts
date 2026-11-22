
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "midia-classificados";
const REMETENTE = "Nova Suíça 02 <nao-responda@mail.sostoyota.com.br>";

function escaparHtml(valor: string) {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatarData(data: string) {
  return new Date(data).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { erro: "CRON_SECRET não configurado." },
      { status: 500 }
    );
  }

  const autorizacao = request.headers.get("authorization");

  if (autorizacao !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { erro: "Não autorizado." },
      { status: 401 }
    );
  }

  const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

  const resultado = {
    expiracoes_processadas: 0,
    notificacoes_criadas: 0,
    emails_enviados: 0,
    exclusoes_concluidas: 0,
    erros: [] as string[],
  };

  try {
    // 1. Identifica e expira os anúncios vencidos.
    const { error: erroExpiracao } =
      await supabaseAdmin.rpc("expirar_classificados");

    if (erroExpiracao) {
      throw erroExpiracao;
    }

    // 2. Busca os anúncios expirados que possuem exclusão programada.
    const { data: anuncios, error: erroAnuncios } =
      await supabaseAdmin
        .from("classificados")
        .select(`
          id,
          titulo,
          morador_id,
          condominio_id,
          validade_ate,
          exclusao_programada_em
        `)
        .eq("status", "expirado")
        .not("exclusao_programada_em", "is", null);

    if (erroAnuncios) {
      throw erroAnuncios;
    }

    resultado.expiracoes_processadas = anuncios?.length ?? 0;

    // 3. Cria a notificação e envia o e-mail.
    for (const anuncio of anuncios ?? []) {
      try {
        const eventoChave =
          `classificado_expirado:${anuncio.id}:${anuncio.validade_ate}`;

        const dataExclusao = formatarData(
          anuncio.exclusao_programada_em!
        );

        const titulo = "Seu anúncio expirou";

        const mensagem =
          `O anúncio "${anuncio.titulo}" expirou e será excluído automaticamente em ${dataExclusao}. Você pode renová-lo antes dessa data.`;

        let notificacao: {
          id: number;
          email_enviado_em: string | null;
        } | null = null;

        const { data: novaNotificacao, error: erroInsercao } =
          await supabaseAdmin
            .from("notificacoes_morador")
            .insert({
              condominio_id: anuncio.condominio_id,
              morador_id: anuncio.morador_id,
              tipo: "classificado_expirado",
              titulo,
              mensagem,
              classificado_id: anuncio.id,
              evento_chave: eventoChave,
            })
            .select("id,email_enviado_em")
            .single();

        if (erroInsercao) {
          if (erroInsercao.code !== "23505") {
            throw erroInsercao;
          }

          // A notificação já existe: recupera para evitar duplicidade.
          const { data: existente, error: erroBusca } =
            await supabaseAdmin
              .from("notificacoes_morador")
              .select("id,email_enviado_em")
              .eq("evento_chave", eventoChave)
              .maybeSingle();

          if (erroBusca) throw erroBusca;
          notificacao = existente;
        } else {
          notificacao = novaNotificacao;
          resultado.notificacoes_criadas++;
        }

        // 4. Envia o e-mail somente se ainda não foi enviado.
        if (
          notificacao &&
          !notificacao.email_enviado_em &&
          resend
        ) {
          const { data: morador, error: erroMorador } =
            await supabaseAdmin
              .from("profiles")
              .select("nome,email")
              .eq("id", anuncio.morador_id)
              .maybeSingle();

          if (erroMorador) throw erroMorador;

          if (morador?.email) {
            const nome = escaparHtml(morador.nome || "Morador");
            const nomeAnuncio = escaparHtml(anuncio.titulo);

            const { error: erroEmail } = await resend.emails.send({
              from: REMETENTE,
              to: morador.email,
              subject: "Seu anúncio nos Classificados expirou",
              html: `
                <div style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:auto">
                  <h2>Olá, ${nome}!</h2>
                  <p>O prazo de validade do seu anúncio expirou.</p>
                  <p><strong>Anúncio:</strong> ${nomeAnuncio}</p>
                  <p>Ele será excluído automaticamente em <strong>${dataExclusao}</strong>.</p>
                  <p>Se desejar continuar anunciando, você poderá renovar o anúncio antes dessa data.</p>
                  <p>Atenciosamente,<br>Equipe Nova Suíça 02</p>
                </div>
              `,
            });

            if (erroEmail) throw erroEmail;

            const { error: erroAtualizacao } =
              await supabaseAdmin
                .from("notificacoes_morador")
                .update({ email_enviado_em: new Date().toISOString() })
                .eq("id", notificacao.id);

            if (erroAtualizacao) throw erroAtualizacao;

            resultado.emails_enviados++;
          }
        }
      } catch (erro) {
        console.error(
          `Erro no anúncio ${anuncio.id}:`,
          erro
        );

        resultado.erros.push(
          `Anúncio ${anuncio.id}: ${
            erro instanceof Error ? erro.message : "Erro desconhecido"
          }`
        );
      }
    }

    // 5. Busca anúncios cujo prazo de exclusão já terminou.
    const { data: vencidos, error: erroVencidos } =
      await supabaseAdmin
        .from("classificados")
        .select("id")
        .eq("status", "expirado")
        .lte("exclusao_programada_em", new Date().toISOString())
        .eq("exclusao_em_processamento", false);

    if (erroVencidos) throw erroVencidos;

    // 6. Exclui fotos e, depois, o anúncio.
    for (const anuncio of vencidos ?? []) {
      try {
        const { data: iniciou, error: erroInicio } =
          await supabaseAdmin.rpc(
            "iniciar_exclusao_classificado",
            { p_classificado_id: anuncio.id }
          );

        if (erroInicio) throw erroInicio;

        if (!iniciou) continue;

        const { data: fotos, error: erroFotos } =
          await supabaseAdmin
            .from("classificados_fotos")
            .select("arquivo_path")
            .eq("classificado_id", anuncio.id);

        if (erroFotos) throw erroFotos;

        const caminhos = (fotos ?? [])
          .map((foto) => foto.arquivo_path)
          .filter(Boolean);

        if (caminhos.length > 0) {
          const { error: erroStorage } =
            await supabaseAdmin.storage
              .from(BUCKET)
              .remove(caminhos);

          if (erroStorage) throw erroStorage;
        }

        const { data: removido, error: erroDelete } =
          await supabaseAdmin
            .from("classificados")
            .delete()
            .eq("id", anuncio.id)
            .eq("status", "expirado")
            .eq("exclusao_em_processamento", true)
            .select("id");

        if (erroDelete) throw erroDelete;

        if (removido && removido.length > 0) {
          resultado.exclusoes_concluidas++;
        } else {
          throw new Error(
            "O anúncio não foi removido do banco de dados."
          );
        }
      } catch (erro) {
        console.error(
          `Erro na exclusão do anúncio ${anuncio.id}:`,
          erro
        );

        // Libera a trava para permitir nova tentativa amanhã.
        const { error: erroLiberacao } =
          await supabaseAdmin.rpc(
            "cancelar_processamento_exclusao",
            { p_classificado_id: anuncio.id }
          );

        if (erroLiberacao) {
          console.error(
            "Erro ao liberar trava:",
            erroLiberacao
          );
        }

        resultado.erros.push(
          `Exclusão ${anuncio.id}: ${
            erro instanceof Error ? erro.message : "Erro desconhecido"
          }`
        );
      }
    }

    return NextResponse.json({
      sucesso: true,
      resultado,
    });
  } catch (erro) {
    console.error("Erro no processamento dos classificados:", erro);

    return NextResponse.json(
      {
        sucesso: false,
        erro:
          erro instanceof Error
            ? erro.message
            : "Erro interno no processamento.",
        resultado,
      },
      { status: 500 }
    );
  }
}
