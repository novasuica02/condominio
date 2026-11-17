
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

type Evento = "abertura" | "atualizacao" | "troca_prestador";

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

    // 3. Dados recebidos
    const body = await request.json();

    const chamadoId = body.chamadoId;
    const evento = body.evento as Evento;
    const comentario = String(body.comentario || "");
    const prestadorAnteriorId = body.prestadorAnteriorId
      ? Number(body.prestadorAnteriorId)
      : null;

    if (
      !chamadoId ||
      !["abertura", "atualizacao", "troca_prestador"].includes(evento)
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

    // 5. Permissões
    if (evento === "abertura" && chamado.autor_id !== user.id) {
      return NextResponse.json(
        { erro: "Você não pode notificar a abertura deste chamado." },
        { status: 403 }
      );
    }

    if (
      evento !== "abertura" &&
      perfilUsuario.role !== "sindico"
    ) {
      return NextResponse.json(
        { erro: "Apenas síndicos podem enviar estas notificações." },
        { status: 403 }
      );
    }

    if (
      evento === "troca_prestador" &&
      !prestadorAnteriorId
    ) {
      return NextResponse.json(
        { erro: "Prestador anterior não informado." },
        { status: 400 }
      );
    }

    // 6. Busca o morador que abriu o chamado
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

    // 7. Busca todos os síndicos
    const { data: sindicos, error: sindicosError } = await supabase
      .from("profiles")
      .select("nome, email")
      .eq("role", "sindico");

    if (sindicosError) {
      return NextResponse.json(
        { erro: "Não foi possível localizar os síndicos." },
        { status: 500 }
      );
    }

    // 8. Busca os prestadores envolvidos
    async function buscarPrestador(id: number | null) {
      if (!id) return null;

      const { data, error } = await supabase
        .from("prestadores")
        .select("id, nome")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new Error("Erro ao consultar prestador: " + error.message);
      }

      return data;
    }

    const prestadorAtual = await buscarPrestador(
      chamado.prestador_id
    );

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

    // 9. Monta destinatários sem duplicidade
    const destinatarios = new Set<string>();

    if (morador.email) {
      destinatarios.add(morador.email.trim().toLowerCase());
    }

    for (const sindico of sindicos || []) {
      if (sindico.email) {
        destinatarios.add(sindico.email.trim().toLowerCase());
      }
    }

    // Prestadores usam o e-mail provisório durante os testes
    if (prestadorAtual || prestadorAnterior) {
      destinatarios.add(EMAIL_TESTE_PRESTADORES);
    }

    if (destinatarios.size === 0) {
      return NextResponse.json(
        { erro: "Nenhum destinatário válido foi encontrado." },
        { status: 400 }
      );
    }

    // 10. Identifica o assunto e o conteúdo
    const nomesPrestadores = [
      prestadorAnterior
        ? `Anterior: ${prestadorAnterior.nome}`
        : "",
      prestadorAtual
        ? `Atual: ${prestadorAtual.nome}`
        : "",
    ].filter(Boolean);

    const assuntos: Record<Evento, string> = {
      abertura: `Novo chamado: ${chamado.titulo}`,
      atualizacao: `Atualização de chamado: ${chamado.titulo}`,
      troca_prestador: `Alteração de prestador: ${chamado.titulo}`,
    };

    const mensagens: Record<Evento, string> = {
      abertura: "Um novo chamado foi registrado no condomínio.",
      atualizacao: "O chamado recebeu uma atualização do síndico.",
      troca_prestador: "Houve uma alteração no prestador responsável pelo chamado.",
    };

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

    // 11. Envio pelo Resend
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
