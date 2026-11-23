
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Distribuicao = {
  tipo: "todos" | "selecionados" | "nenhum";
  torre_ids?: number[];
  setor_ids?: number[];
  unidade_ids?: number[];
};

type PublicarAviso = {
  titulo: string;
  corpo: string;
  arquivo_url?: string | null;
  prioridade?: "normal" | "urgente";
  distribuicao: Distribuicao;
};

function idsValidos(ids: unknown): ids is number[] {
  return (
    Array.isArray(ids) &&
    ids.every(
      (id) => Number.isInteger(id) && id > 0
    )
  );
}

function respostaErro(mensagem: string, status = 400) {
  return NextResponse.json(
    { error: mensagem },
    { status }
  );
}

export async function POST(request: Request) {
  let avisoId: number | null = null;

  try {
    // 1. Validar autenticação
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return respostaErro(
        "Usuário não autenticado.",
        401
      );
    }

    // 2. Buscar perfil administrativo
    const { data: perfil, error: perfilError } =
      await supabaseAdmin
        .from("profiles")
        .select("id, role, condominio_id")
        .eq("id", user.id)
        .single();

    if (
      perfilError ||
      !perfil ||
      !["sindico", "subsindico"].includes(perfil.role)
    ) {
      return respostaErro(
        "Você não tem permissão para publicar avisos.",
        403
      );
    }

    const condominioId = perfil.condominio_id;

    if (!condominioId) {
      return respostaErro(
        "Condomínio não identificado."
      );
    }

    // 3. Validar conteúdo recebido
    const dados = (await request.json()) as PublicarAviso;

    const titulo = dados.titulo?.trim();
    const corpo = dados.corpo?.trim();

    if (!titulo || !corpo) {
      return respostaErro(
        "Título e mensagem são obrigatórios."
      );
    }

    if (titulo.length > 200 || corpo.length > 20000) {
      return respostaErro(
        "O título ou a mensagem ultrapassou o limite permitido."
      );
    }

    const arquivo_url = dados.arquivo_url || null;
    const prioridade = dados.prioridade || "normal";

    if (!["normal", "urgente"].includes(prioridade)) {
      return respostaErro("Prioridade inválida.");
    }

    const distribuicao = dados.distribuicao;

    if (
      !distribuicao ||
      !["todos", "selecionados", "nenhum"].includes(
        distribuicao.tipo
      )
    ) {
      return respostaErro("Distribuição inválida.");
    }

    const torreIds = [
      ...new Set(distribuicao.torre_ids ?? []),
    ];

    const setorIds = [
      ...new Set(distribuicao.setor_ids ?? []),
    ];

    const unidadeIds = [
      ...new Set(distribuicao.unidade_ids ?? []),
    ];

    if (
      !idsValidos(torreIds) ||
      !idsValidos(setorIds) ||
      !idsValidos(unidadeIds)
    ) {
      return respostaErro(
        "Existem identificadores inválidos."
      );
    }

    if (
      distribuicao.tipo !== "selecionados" &&
      (torreIds.length || setorIds.length || unidadeIds.length)
    ) {
      return respostaErro(
        "A distribuição escolhida não aceita filtros."
      );
    }

    if (
      distribuicao.tipo === "selecionados" &&
      !torreIds.length &&
      !setorIds.length &&
      !unidadeIds.length
    ) {
      return respostaErro(
        "Selecione pelo menos uma torre, setor ou unidade."
      );
    }

    // 4. Identificar moradores destinatários
    let destinatarios: string[] = [];

    if (distribuicao.tipo === "todos") {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("condominio_id", condominioId)
        .eq("role", "morador");

      if (error) throw error;

      destinatarios = (data || []).map((morador) => morador.id);
    }

    if (distribuicao.tipo === "selecionados") {
      const unidadesEncontradas = new Set<number>();

      // Validar torres selecionadas
      if (torreIds.length > 0) {
        const { data, error } = await supabaseAdmin
          .from("torres")
          .select("id")
          .eq("condominio_id", condominioId)
          .eq("ativo", true)
          .in("id", torreIds);

        if (error) throw error;

        if ((data || []).length !== torreIds.length) {
          return respostaErro(
            "Uma ou mais torres não pertencem a este condomínio ou estão inativas."
          );
        }
      }

      // Validar setores selecionados
      if (setorIds.length > 0) {
        const { data, error } = await supabaseAdmin
          .from("setores")
          .select("id")
          .eq("condominio_id", condominioId)
          .eq("ativo", true)
          .in("id", setorIds);

        if (error) throw error;

        if ((data || []).length !== setorIds.length) {
          return respostaErro(
            "Um ou mais setores não pertencem a este condomínio ou estão inativos."
          );
        }
      }

      // Validar unidades selecionadas diretamente
      if (unidadeIds.length > 0) {
        const { data, error } = await supabaseAdmin
          .from("unidades")
          .select("id")
          .eq("condominio_id", condominioId)
          .eq("ativo", true)
          .in("id", unidadeIds);

        if (error) throw error;

        if ((data || []).length !== unidadeIds.length) {
          return respostaErro(
            "Uma ou mais unidades não pertencem a este condomínio ou estão inativas."
          );
        }

        (data || []).forEach((unidade) => {
          unidadesEncontradas.add(unidade.id);
        });
      }

      // Buscar unidades pertencentes aos setores selecionados
      if (setorIds.length > 0) {
        const { data, error } = await supabaseAdmin
          .from("unidades")
          .select("id")
          .eq("condominio_id", condominioId)
          .eq("ativo", true)
          .in("setor_id", setorIds);

        if (error) throw error;

        (data || []).forEach((unidade) => {
          unidadesEncontradas.add(unidade.id);
        });
      }

      // Buscar unidades pertencentes às torres selecionadas
      if (torreIds.length > 0) {
        const { data, error } = await supabaseAdmin
          .from("unidades")
          .select("id")
          .eq("condominio_id", condominioId)
          .eq("ativo", true)
          .in("torre_id", torreIds);

        if (error) throw error;

        (data || []).forEach((unidade) => {
          unidadesEncontradas.add(unidade.id);
        });
      }

      // Buscar moradores vinculados às unidades encontradas
      const listaUnidades = Array.from(unidadesEncontradas);

      if (listaUnidades.length > 0) {
        const { data, error } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("condominio_id", condominioId)
          .eq("role", "morador")
          .in("unidade_id", listaUnidades);

        if (error) throw error;

        destinatarios = (data || []).map((morador) => morador.id);
      }
    }

    // Evitar notificações duplicadas
    destinatarios = [...new Set(destinatarios)];

    // 5. Criar o aviso
    const { data: aviso, error: avisoError } =
      await supabaseAdmin
        .from("avisos")
        .insert({
          titulo,
          corpo,
          autor_id: user.id,
          arquivo_url,
          condominio_id: condominioId,
        })
        .select("id")
        .single();

    if (avisoError) throw avisoError;

    avisoId = aviso.id;

    // 6. Criar notificações individuais
    if (
      distribuicao.tipo !== "nenhum" &&
      destinatarios.length > 0
    ) {
      const notificacoes = destinatarios.map(
        (moradorId) => ({
          condominio_id: condominioId,
          morador_id: moradorId,
          tipo: "aviso_novo",
          titulo:
            prioridade === "urgente"
              ? `URGENTE: ${titulo}`
              : `Novo aviso: ${titulo}`,
          mensagem: corpo,
          modulo: "avisos",
          referencia_id: aviso.id,
          url_destino: "/avisos",
          prioridade,
          evento_chave:
            `aviso:${aviso.id}:morador:${moradorId}`,
        })
      );

      // Inserir notificações em lotes de até 500
      for (
        let i = 0;
        i < notificacoes.length;
        i += 500
      ) {
        const lote = notificacoes.slice(i, i + 500);

        const { error } = await supabaseAdmin
          .from("notificacoes_morador")
          .insert(lote);

        if (error) throw error;
      }
    }

    return NextResponse.json({
      sucesso: true,
      aviso_id: aviso.id,
      notificacoes_criadas:
        distribuicao.tipo === "nenhum"
          ? 0
          : destinatarios.length,
    });

  } catch (error) {
    console.error("Erro ao publicar aviso:", error);

    // Limpar notificações e aviso se a operação falhar
    if (avisoId !== null) {
      await supabaseAdmin
        .from("notificacoes_morador")
        .delete()
        .eq("condominio_id", 0)
        .eq("modulo", "avisos")
        .eq("referencia_id", avisoId);

      await supabaseAdmin
        .from("notificacoes_morador")
        .delete()
        .like(
          "evento_chave",
          `aviso:${avisoId}:morador:%`
        );

      await supabaseAdmin
        .from("avisos")
        .delete()
        .eq("id", avisoId);
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao publicar aviso.",
      },
      { status: 500 }
    );
  }
}
