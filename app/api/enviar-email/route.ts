
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

type Evento =
  | "abertura"
  | "atualizacao"
  | "troca_prestador"
  | "em_analise"
  | "resolvido"
  | "devolvido";

type Destinatario = "sindico" | "subsindico" | "morador" | "prestador";

const EMAIL_TESTE_PRESTADORES = "xiko57@gmail.com";

const REMETENTE =
  "Nova Suíça 02 <nao-responda@mail.sostoyota.com.br>";

function escaparHtml(valor: string) {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { erro: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    // 2. Perfil do usuário
    const { data: perfilUsuario, error: perfilError } = await supabase
      .from("profiles")
      .select("id, nome, email, role")
      .eq("id", user.id)
      .single();

    if (perfilError || !perfilUsuario) {
      return NextResponse.json(
        { erro: "Perfil do usuário não encontrado." },
        { status: 400 }
      );
    }

    const isAdmin =
      perfilUsuario.role === "sindico" ||
      perfilUsuario.role === "subsindico";

    // 3. Dados recebidos
    const body = await request.json();

    const chamadoId = body.chamadoId;
    const evento = body.evento as Evento;
    const comentario = String(body.comentario || "");

    const prestadorAnteriorId = body.prestadorAnteriorId
      ? Number(body.prestadorAnteriorId)
      : null;

    const eventosPermitidos: Evento[] = [
      "abertura",
      "atualizacao",
      "troca_prestador",
      "em_analise",
      "resolvido",
      "devolvido",
    ];

    if (
      !chamadoId ||
      !eventosPermitidos.includes(evento)
    ) {
      return NextResponse.json(
        { erro: "Dados do envio inválidos." },
        { status: 400 }
      );
    }

    // 4. Busca o chamado
    const { data: chamado, error: chamadoError } = await supabase
      .from("chamados")
      .select(`
        id,
        autor_id,
        titulo,
        descricao,
        localizacao,
        status,
        sla,
        prestador_id
      `)
      .eq("id", chamadoId)
      .single();

    if (chamadoError || !chamado) {
      return NextResponse.json(
        { erro: "Chamado não encontrado." },
        { status: 404 }
      );
    }

    // 5. Validação das permissões por evento

    if (evento === "abertura" && chamado.autor_id !== user.id) {
      return NextResponse.json(
        { erro: "Você não pode notificar a abertura deste chamado." },
        { status: 403 }
      );
    }

    if (
      ["atualizacao", "troca_prestador"].includes(evento) &&
      !isAdmin
    ) {
      return NextResponse.json(
        { erro: "Apenas síndicos ou subsíndicos podem realizar esta ação." },
        { status: 403 }
      );
    }

    if (evento === "troca_prestador") {
      if (
        !prestadorAnteriorId ||
        !Number.isFinite(prestadorAnteriorId)
      ) {
        return NextResponse.json(
          { erro: "Prestador anterior não informado." },
          { status: 400 }
        );
      }

      if (prestadorAnteriorId === chamado.prestador_id) {
        return NextResponse.json(
          { erro: "O prestador anterior e o atual são iguais." },
          { status: 400 }
        );
      }
    }

    if (evento === "em_analise") {
      if (chamado.status !== "em_analise" || !chamado.prestador_id) {
        return NextResponse.json(
          { erro: "O chamado não está aguardando análise." },
          { status: 400 }
        );
      }

      const { data: prestadorVinculado, error: vinculoError } =
        await supabase
          .from("prestadores")
          .select("id")
          .eq("id", chamado.prestador_id)
          .eq("usuario_id", user.id)
          .maybeSingle();

      if (vinculoError || !prestadorVinculado) {
        return NextResponse.json(
          { erro: "Somente o prestador responsável pode registrar esta conclusão." },
          { status: 403 }
        );
      }
    }

    if (evento === "resolvido") {
      if (
        chamado.status !== "resolvido" ||
        (chamado.autor_id !== user.id && !isAdmin)
      ) {
        return NextResponse.json(
          { erro: "Você não tem permissão para notificar esta resolução." },
          { status: 403 }
        );
      }
    }

    if (evento === "devolvido") {
      if (
        chamado.status !== "em_andamento" ||
        (chamado.autor_id !== user.id && !isAdmin)
      ) {
        return NextResponse.json(
          { erro: "Você não tem permissão para devolver este chamado." },
          { status: 403 }
        );
      }
    }

    // 6. Consulta as configurações de notificação
    const { data: configuracoes, error: configError } = await supabase
      .from("config_notificacoes")
      .select("destinatario, ativo")
      .eq("evento", evento);

    if (configError) {
      console.error("Erro ao consultar configurações:", configError);

      return NextResponse.json(
        { erro: "Não foi possível consultar as configurações de notificações." },
        { status: 500 }
      );
    }

    const destinatariosAtivos = new Set<Destinatario>(
      (configuracoes || [])
        .filter((config) => config.ativo)
        .map((config) => config.destinatario as Destinatario)
    );

    // Se todos os destinatários estiverem desativados,
    // a operação principal do chamado não será prejudicada.
    if (destinatariosAtivos.size === 0) {
      return NextResponse.json({
        sucesso: true,
        mensagem: "Notificações desativadas para este evento.",
        quantidadeDestinatarios: 0,
      });
    }

    // 7. Busca o morador
    const { data: morador, error: moradorError } = await supabase
      .from("profiles")
      .select("nome, email")
      .eq("id", chamado.autor_id)
      .single();

    if (moradorError || !morador) {
      return NextResponse.json(
        { erro: "Não foi possível localizar o morador." },
        { status: 400 }
      );
    }

    // 8. Busca síndicos e subsíndicos conforme configuração
    let administradores: { nome: string | null; email: string | null }[] = [];

    if (
      destinatariosAtivos.has("sindico") ||
      destinatariosAtivos.has("subsindico")
    ) {
      const roles = [];

      if (destinatariosAtivos.has("sindico")) {
        roles.push("sindico");
      }

      if (destinatariosAtivos.has("subsindico")) {
        roles.push("subsindico");
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("nome, email")
        .in("role", roles);

      if (error) {
        return NextResponse.json(
          { erro: "Não foi possível localizar os administradores." },
          { status: 500 }
        );
      }

      administradores = data || [];
    }

    // 9. Busca prestadores envolvidos
    async function buscarPrestador(id: number | null) {
      if (!id) return null;

      const { data, error } = await supabase
        .from("prestadores")
        .select("id, nome, usuario_id")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new Error("Erro ao consultar prestador: " + error.message);
      }

      return data;
    }

    const prestadorAtual = await buscarPrestador(chamado.prestador_id);

    const prestadorAnterior =
      evento === "troca_prestador"
        ? await buscarPrestador(prestadorAnteriorId)
        : null;

    if (evento === "troca_prestador" && !prestadorAnterior) {
      return NextResponse.json(
        { erro: "O prestador anterior não foi encontrado." },
        { status: 400 }
      );
    }

    // 10. Monta destinatários respeitando as configurações
    const destinatarios = new Set<string>();

    if (destinatariosAtivos.has("morador") && morador.email) {
      destinatarios.add(morador.email.trim().toLowerCase());
    }

    for (const administrador of administradores) {
      if (administrador.email) {
        destinatarios.add(administrador.email.trim().toLowerCase());
      }
    }

    // E-mail provisório dos prestadores durante os testes
    if (
      destinatariosAtivos.has("prestador") &&
      (prestadorAtual || prestadorAnterior)
    ) {
      destinatarios.add(EMAIL_TESTE_PRESTADORES);
    }

    if (destinatarios.size === 0) {
      return NextResponse.json({
        sucesso: true,
        mensagem: "Nenhum destinatário ativo com e-mail válido.",
        quantidadeDestinatarios: 0,
      });
    }

    // 11. Assunto e conteúdo
    const assuntos: Record<Evento, string> = {
      abertura: `Novo chamado: ${chamado.titulo}`,
      atualizacao: `Atualização de chamado: ${chamado.titulo}`,
      troca_prestador: `Alteração de prestador: ${chamado.titulo}`,
      em_analise: `Atendimento concluído: ${chamado.titulo}`,
      resolvido: `Chamado resolvido: ${chamado.titulo}`,
      devolvido: `Chamado devolvido para atendimento: ${chamado.titulo}`,
    };

    const mensagens: Record<Evento, string> = {
      abertura: "Um novo chamado foi registrado no condomínio.",
      atualizacao: "O chamado recebeu uma atualização.",
      troca_prestador: "Houve uma alteração no prestador responsável pelo chamado.",
      em_analise: "O prestador registrou a conclusão do atendimento. O chamado aguarda validação.",
      resolvido: "O chamado foi confirmado como resolvido.",
      devolvido: "O chamado foi devolvido para continuidade do atendimento.",
    };

    const nomesPrestadores = [
      prestadorAnterior
        ? `Anterior: ${prestadorAnterior.nome}`
        : "",
      prestadorAtual
        ? `Atual: ${prestadorAtual.nome}`
        : "",
    ].filter(Boolean);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto;">
        <h2 style="color: #1e40af;">Condomínio Nova Suíça 02</h2>

        <p>${mensagens[evento]}</p>

        <hr />

        <h3>${escaparHtml(chamado.titulo || "")}</h3>

        <p><strong>Descrição:</strong><br />
        ${escaparHtml(chamado.descricao || "Não informada")}</p>

        <p><strong>Localização:</strong><br />
        ${escaparHtml(chamado.localizacao || "Não informada")}</p>

        <p><strong>Status:</strong> ${escaparHtml(chamado.status || "")}</p>

        <p><strong>Morador:</strong>
        ${escaparHtml(morador.nome || "Não informado")}</p>

        ${
          nomesPrestadores.length
            ? `<p><strong>Prestadores:</strong><br />${nomesPrestadores.map(escaparHtml).join("<br />")}</p>`
            : ""
        }

        ${
          comentario.trim()
            ? `<hr /><p><strong>Nova anotação:</strong><br />${escaparHtml(comentario)}</p>`
            : ""
        }

        <hr />

        <p style="font-size: 12px; color: #666;">
          Mensagem automática do sistema do Condomínio Nova Suíça 02.
        </p>
      </div>
    `;

    // 12. Envio pelo Resend
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { erro: "RESEND_API_KEY não configurada." },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: REMETENTE,
      to: Array.from(destinatarios),
      subject: assuntos[evento],
      html,
    });

    if (error) {
      console.error("Erro no envio pelo Resend:", error);

      return NextResponse.json(
        { erro: error.message },
        { status: 502 }
      );
    }

    console.log("Notificação enviada:", {
      chamadoId,
      evento,
      destinatarios: Array.from(destinatarios),
      emailId: data?.id,
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: "Notificações enviadas com sucesso.",
      id: data?.id,
      quantidadeDestinatarios: destinatarios.size,
    });

  } catch (error) {
    console.error("Erro ao processar notificação:", error);

    return NextResponse.json(
      {
        erro:
          error instanceof Error
            ? error.message
            : "Falha inesperada no envio.",
      },
      { status: 500 }
    );
  }
}
