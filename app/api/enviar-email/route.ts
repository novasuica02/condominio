import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

type Evento = "abertura" | "atualizacao" | "troca_prestador";

function escaparHtml(valor: unknown): string {
  return String(valor ?? "").replace(/[&<>"']/g, (char) => {
    const entidades: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entidades[char];
  });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Confirma quem está fazendo a solicitação
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

    const body = await request.json();

    const chamadoId = body.chamadoId;
    const evento = body.evento as Evento;
    const comentario = String(body.comentario ?? "");
    const prestadorAnteriorId = body.prestadorAnteriorId;

    if (!chamadoId || !["abertura", "atualizacao", "troca_prestador"].includes(evento)) {
      return NextResponse.json(
        { erro: "Dados inválidos." },
        { status: 400 }
      );
    }

    // Busca o perfil de quem está solicitando
    const { data: perfilUsuario, error: perfilError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (perfilError || !perfilUsuario) {
      return NextResponse.json(
        { erro: "Perfil do usuário não encontrado." },
        { status: 403 }
      );
    }

    // Busca o chamado atualizado
    const { data: chamado, error: chamadoError } = await supabase
      .from("chamados")
      .select("*")
      .eq("id", chamadoId)
      .single();

    if (chamadoError || !chamado) {
      return NextResponse.json(
        { erro: "Chamado não encontrado." },
        { status: 404 }
      );
    }

    // Valida as permissões conforme o evento
    if (evento === "abertura" && chamado.autor_id !== user.id) {
      return NextResponse.json(
        { erro: "Você não pode enviar aviso de abertura deste chamado." },
        { status: 403 }
      );
    }

    if (
      (evento === "atualizacao" || evento === "troca_prestador") &&
      perfilUsuario.role !== "sindico"
    ) {
      return NextResponse.json(
        { erro: "Somente o síndico pode enviar este aviso." },
        { status: 403 }
      );
    }

    if (
      evento === "troca_prestador" &&
      (!prestadorAnteriorId ||
        String(prestadorAnteriorId) === String(chamado.prestador_id))
    ) {
      return NextResponse.json(
        { erro: "Dados da troca de prestador inválidos." },
        { status: 400 }
      );
    }

    // Busca os dados do morador que abriu o chamado
    const { data: morador } = await supabase
      .from("profiles")
      .select("nome, unidade, email")
      .eq("id", chamado.autor_id)
      .single();

    // Busca todos os síndicos
    const { data: sindicos } = await supabase
      .from("profiles")
      .select("email")
      .eq("role", "sindico");

    // Busca o prestador atualmente responsável
    let prestadorAtual = null;

    if (chamado.prestador_id) {
      const { data } = await supabase
        .from("prestadores")
        .select("nome, email")
        .eq("id", chamado.prestador_id)
        .maybeSingle();

      prestadorAtual = data;
    }

    // Na troca, busca também o prestador anterior
    let prestadorAnterior = null;

    if (evento === "troca_prestador") {
      const { data } = await supabase
        .from("prestadores")
        .select("nome, email")
        .eq("id", prestadorAnteriorId)
        .maybeSingle();

      prestadorAnterior = data;
    }

    // Monta a lista de destinatários
    const destinatarios = new Set<string>();

    const adicionarEmail = (email?: string | null) => {
      const valor = email?.trim().toLowerCase();

      if (valor && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
        destinatarios.add(valor);
      }
    };

    adicionarEmail(morador?.email);

    sindicos?.forEach((sindico) => adicionarEmail(sindico.email));

    if (evento === "troca_prestador") {
      adicionarEmail(prestadorAnterior?.email);
      adicionarEmail(prestadorAtual?.email);
    } else {
      adicionarEmail(prestadorAtual?.email);
    }

    // Se o autor estiver abrindo o chamado, usa também o e-mail da sessão
    if (evento === "abertura") {
      adicionarEmail(user.email);
    }

    if (destinatarios.size === 0) {
      return NextResponse.json(
        { erro: "Nenhum destinatário com e-mail válido foi encontrado." },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { erro: "RESEND_API_KEY não configurada." },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    const tituloEvento = {
      abertura: "Novo chamado aberto",
      atualizacao: "Atualização de chamado",
      troca_prestador: "Alteração de prestador",
    }[evento];

    const assunto = `${tituloEvento} - ${chamado.titulo}`;

    const descricaoTroca =
      evento === "troca_prestador"
        ? `
          <p><strong>Prestador anterior:</strong>
          ${escaparHtml(prestadorAnterior?.nome ?? "Não identificado")}</p>

          <p><strong>Novo prestador:</strong>
          ${escaparHtml(prestadorAtual?.nome ?? "Não definido")}</p>
        `
        : "";

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>${escaparHtml(tituloEvento)}</h2>

        <p><strong>Chamado:</strong> #${escaparHtml(chamado.id)}</p>

        <p><strong>Título:</strong>
        ${escaparHtml(chamado.titulo)}</p>

        <p><strong>Morador:</strong>
        ${escaparHtml(morador?.nome ?? "Não identificado")}</p>

        <p><strong>Unidade:</strong>
        ${escaparHtml(morador?.unidade ?? "Não informada")}</p>

        <p><strong>Descrição:</strong><br/>
        ${escaparHtml(chamado.descricao).replace(/\n/g, "<br/>")}</p>

        <p><strong>Localização:</strong>
        ${escaparHtml(chamado.localizacao ?? "Não informada")}</p>

        <p><strong>Status:</strong>
        ${escaparHtml(chamado.status)}</p>

        <p><strong>Prestador responsável:</strong>
        ${escaparHtml(prestadorAtual?.nome ?? "Não definido")}</p>

        ${descricaoTroca}

        ${
          comentario.trim()
            ? `<p><strong>Comentário:</strong><br/>
               ${escaparHtml(comentario).replace(/\n/g, "<br/>")}</p>`
            : ""
        }

        <hr/>
        <p style="font-size: 12px; color: #777;">
          Condomínio Nova Suíça 02
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: "Nova Suíça 02 <nao-responda@mail.sostoyotas.com.br>",
      to: Array.from(destinatarios),
      subject: assunto,
      html,
    });

    if (error) {
      console.error("Erro Resend:", error);

      return NextResponse.json(
        { erro: "Não foi possível enviar os e-mails.", detalhe: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sucesso: true,
      destinatarios: destinatarios.size,
      id: data?.id,
    });
  } catch (error) {
    console.error("Erro na API de e-mail:", error);

    return NextResponse.json(
      { erro: "Erro interno ao processar o envio de e-mail." },
      { status: 500 }
    );
  }
}