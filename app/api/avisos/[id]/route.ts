
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";

type DistribuicaoAtualizacao = {
  tipo: "todos" | "setores" | "unidades";
  setor_ids?: number[];
  unidade_ids?: number[];
};

type DadosAtualizacao = {
  titulo: string;
  corpo: string;
  arquivo_url?: string | null;
  texto_atualizacao?: string;
  arquivo_atualizacao_url?: string | null;
  notificar: boolean;
  distribuicao?: DistribuicaoAtualizacao;
};

function erro(mensagem: string, status = 400) {
  return NextResponse.json({ error: mensagem }, { status });
}

function idsValidos(ids: unknown): ids is number[] {
  return (
    Array.isArray(ids) &&
    ids.every((id) => Number.isInteger(id) && id > 0)
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const avisoId = Number(id);

    if (!Number.isSafeInteger(avisoId) || avisoId <= 0) {
      return erro("Identificador do aviso inválido.");
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return erro("Usuário não autenticado.", 401);
    }

    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, condominio_id")
      .eq("id", user.id)
      .single();

    if (
      perfilError ||
      !perfil ||
      !["sindico", "subsindico"].includes(perfil.role)
    ) {
      return erro("Você não tem permissão para editar avisos.", 403);
    }

    const condominioId = perfil.condominio_id;

    const { data: aviso, error: avisoBuscaError } = await supabaseAdmin
      .from("avisos")
      .select("id, condominio_id")
      .eq("id", avisoId)
      .eq("condominio_id", condominioId)
      .single();

    if (avisoBuscaError || !aviso) {
      return erro("Aviso não encontrado neste condomínio.", 404);
    }

    const dados = (await request.json()) as DadosAtualizacao;

    const titulo = dados.titulo?.trim();
    const corpo = dados.corpo?.trim();

    if (!titulo || !corpo) {
      return erro("Título e mensagem são obrigatórios.");
    }

    if (titulo.length > 200 || corpo.length > 20000) {
      return erro("O título ou a mensagem ultrapassou o limite permitido.");
    }

    if (typeof dados.notificar !== "boolean") {
      return erro("Informe se deseja enviar notificações.");
    }

    let destinatarios: string[] = [];

    if (dados.notificar) {
      const distribuicao = dados.distribuicao;

      if (
        !distribuicao ||
        !["todos", "setores", "unidades"].includes(distribuicao.tipo)
      ) {
        return erro("Escolha como deseja distribuir a notificação.");
      }

      const setorIds = [...new Set(distribuicao.setor_ids ?? [])];
      const unidadeIds = [...new Set(distribuicao.unidade_ids ?? [])];

      if (!idsValidos(setorIds) || !idsValidos(unidadeIds)) {
        return erro("Existem identificadores inválidos.");
      }

      if (distribuicao.tipo === "todos") {
        if (setorIds.length || unidadeIds.length) {
          return erro("A opção todos não aceita filtros.");
        }

        const { data, error } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("condominio_id", condominioId)
          .eq("role", "morador");

        if (error) throw error;

        destinatarios = (data || []).map((morador) => morador.id);
      }

      if (distribuicao.tipo === "setores") {
        if (!setorIds.length || unidadeIds.length) {
          return erro("Selecione pelo menos um setor.");
        }

        const { data: setores, error: setoresError } = await supabaseAdmin
          .from("setores")
          .select("id")
          .eq("condominio_id", condominioId)
          .eq("ativo", true)
          .in("id", setorIds);

        if (setoresError) throw setoresError;

        if ((setores || []).length !== setorIds.length) {
          return erro("Um ou mais setores são inválidos ou estão inativos.");
        }

        const { data: unidades, error: unidadesError } = await supabaseAdmin
          .from("unidades")
          .select("id")
          .eq("condominio_id", condominioId)
          .eq("ativo", true)
          .in("setor_id", setorIds);

        if (unidadesError) throw unidadesError;

        const unidadeIdsEncontradas = (unidades || []).map(
          (unidade) => unidade.id
        );

        if (unidadeIdsEncontradas.length > 0) {
          const { data: moradores, error: moradoresError } =
            await supabaseAdmin
              .from("profiles")
              .select("id")
              .eq("condominio_id", condominioId)
              .eq("role", "morador")
              .in("unidade_id", unidadeIdsEncontradas);

          if (moradoresError) throw moradoresError;

          destinatarios = (moradores || []).map((morador) => morador.id);
        }
      }

      if (distribuicao.tipo === "unidades") {
        if (!unidadeIds.length || setorIds.length) {
          return erro("Selecione pelo menos uma unidade.");
        }

        const { data: unidades, error: unidadesError } = await supabaseAdmin
          .from("unidades")
          .select("id")
          .eq("condominio_id", condominioId)
          .eq("ativo", true)
          .in("id", unidadeIds);

        if (unidadesError) throw unidadesError;

        if ((unidades || []).length !== unidadeIds.length) {
          return erro("Uma ou mais unidades são inválidas ou estão inativas.");
        }

        const { data: moradores, error: moradoresError } =
          await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("condominio_id", condominioId)
            .eq("role", "morador")
            .in("unidade_id", unidadeIds);

        if (moradoresError) throw moradoresError;

        destinatarios = (moradores || []).map((morador) => morador.id);
      }
    }

    destinatarios = [...new Set(destinatarios)];

    const arquivoUrl = dados.arquivo_url || null;

    // Atualizar o aviso original
    const { error: updateError } = await supabaseAdmin
      .from("avisos")
      .update({
        titulo,
        corpo,
        arquivo_url: arquivoUrl,
      })
      .eq("id", avisoId)
      .eq("condominio_id", condominioId);

    if (updateError) throw updateError;

    // Registrar atualização no histórico, quando houver texto
    const textoAtualizacao = dados.texto_atualizacao?.trim();

    if (textoAtualizacao) {
      const { error: historicoError } = await supabaseAdmin
        .from("avisos_historico")
        .insert({
          aviso_id: avisoId,
          autor_id: user.id,
          texto: textoAtualizacao,
          arquivo_url: dados.arquivo_atualizacao_url || null,
          condominio_id: condominioId,
        });

      if (historicoError) {
        console.error("Erro ao registrar histórico:", historicoError);

        return NextResponse.json(
          {
            sucesso: false,
            aviso_salvo: true,
            error: "Aviso salvo, mas não foi possível registrar a atualização no histórico: " +
              historicoError.message,
          },
          { status: 500 }
        );
      }
    }

    // Criar notificações individuais, somente se solicitado
    let notificacoesCriadas = 0;

    if (dados.notificar && destinatarios.length > 0) {
      const loteId = randomUUID();

      const notificacoes = destinatarios.map((moradorId) => ({
        condominio_id: condominioId,
        morador_id: moradorId,
        tipo: "aviso_atualizado",
        titulo: `Atualização de aviso: ${titulo}`,
        mensagem: textoAtualizacao || corpo,
        modulo: "avisos",
        referencia_id: avisoId,
        url_destino: "/avisos",
        prioridade: "normal",
        evento_chave: `aviso-atualizado:${avisoId}:${loteId}:${moradorId}`,
      }));

      for (let i = 0; i < notificacoes.length; i += 500) {
        const lote = notificacoes.slice(i, i + 500);

        const { error: notificacaoError } = await supabaseAdmin
          .from("notificacoes_morador")
          .insert(lote);

        if (notificacaoError) {
          console.error("Erro ao criar notificações:", notificacaoError);

          return NextResponse.json(
            {
              sucesso: false,
              aviso_salvo: true,
              error: "Aviso salvo, mas houve um erro ao criar as notificações: " +
                notificacaoError.message,
              notificacoes_criadas: notificacoesCriadas,
            },
            { status: 500 }
          );
        }

        notificacoesCriadas += lote.length;
      }
    }

    return NextResponse.json({
      sucesso: true,
      aviso_id: avisoId,
      notificacoes_criadas: notificacoesCriadas,
    });
  } catch (error) {
    console.error("Erro ao editar aviso:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao editar aviso.",
      },
      { status: 500 }
    );
  }
}
