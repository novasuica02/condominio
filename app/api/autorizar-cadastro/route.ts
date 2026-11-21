
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    // Identifica o domínio da requisição.
    const hostHeader =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      request.nextUrl.hostname;

    const dominio = hostHeader
      .split(",")[0]
      .trim()
      .toLowerCase()
      .replace(/:\d+$/, "")
      .replace(/\.$/, "");

    // Recebe e valida a unidade escolhida.
    const body = await request.json();
    const unidadeId = Number(body.unidade_id);

    if (
      !Number.isSafeInteger(unidadeId) ||
      unidadeId <= 0
    ) {
      return NextResponse.json(
        { error: "Unidade inválida." },
        { status: 400 }
      );
    }

    // Identifica o condomínio autorizado para o domínio.
    const { data: cadastro, error: dominioError } =
      await supabaseAdmin
        .from("condominio_dominios")
        .select("condominio_id")
        .eq("dominio", dominio)
        .eq("ativo", true)
        .maybeSingle();

    if (dominioError) {
      console.error("Erro ao identificar condomínio:", dominioError);

      return NextResponse.json(
        { error: "Não foi possível identificar o condomínio." },
        { status: 500 }
      );
    }

    if (!cadastro) {
      return NextResponse.json(
        { error: "Domínio não cadastrado." },
        { status: 404 }
      );
    }

    // Confere se a unidade pertence ao condomínio do domínio.
    const { data: unidade, error: unidadeError } =
      await supabaseAdmin
        .from("unidades")
        .select("id")
        .eq("id", unidadeId)
        .eq("condominio_id", cadastro.condominio_id)
        .eq("ativo", true)
        .maybeSingle();

    if (unidadeError) {
      console.error("Erro ao validar unidade:", unidadeError);

      return NextResponse.json(
        { error: "Não foi possível validar a unidade." },
        { status: 500 }
      );
    }

    if (!unidade) {
      return NextResponse.json(
        { error: "Unidade inválida para este condomínio." },
        { status: 403 }
      );
    }

    // Gera autorização aleatória válida por 10 minutos.
    const token = randomUUID();

    const expiraEm = new Date(
      Date.now() + 10 * 60 * 1000
    ).toISOString();

    const { error: insertError } = await supabaseAdmin
      .from("cadastro_autorizacoes")
      .insert({
        token,
        unidade_id: unidade.id,
        condominio_id: cadastro.condominio_id,
        expira_em: expiraEm,
      });

    if (insertError) {
      console.error("Erro ao gerar autorização:", insertError);

      return NextResponse.json(
        { error: "Não foi possível autorizar o cadastro." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        token,
        expira_em: expiraEm,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Erro na autorização de cadastro:", error);

    return NextResponse.json(
      { error: "Erro interno ao autorizar cadastro." },
      { status: 500 }
    );
  }
}
