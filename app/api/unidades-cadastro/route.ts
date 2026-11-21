
import { NextRequest, NextResponse, connection } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  // Impede a pré-renderização desta rota.
  // Precisa ficar antes do try/catch.
  await connection();

  try {
    // Identifica o domínio pelo cabeçalho da requisição.
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

    console.log("Domínio recebido na rota:", dominio);

    // Localiza o condomínio autorizado para esse domínio.
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
        { error: "Domínio não cadastrado.", dominio },
        { status: 404 }
      );
    }

    // Retorna somente unidades ativas daquele condomínio.
    const { data: unidades, error: unidadesError } =
      await supabaseAdmin
        .from("unidades")
        .select("id, nome")
        .eq("condominio_id", cadastro.condominio_id)
        .eq("ativo", true)
        .order("nome");

    if (unidadesError) {
      console.error("Erro ao consultar unidades:", unidadesError);
      return NextResponse.json(
        { error: "Não foi possível carregar as unidades." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { unidades: unidades ?? [] },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Erro na rota de cadastro:", error);

    return NextResponse.json(
      { error: "Erro interno ao carregar unidades." },
      { status: 500 }
    );
  }
}