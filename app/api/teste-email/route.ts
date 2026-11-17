
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    // Verifica se existe usuário autenticado
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

    // Verifica se é síndico
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "sindico") {
      return NextResponse.json(
        { erro: "Apenas síndicos podem realizar este teste." },
        { status: 403 }
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

    const { data, error } = await resend.emails.send({
      from: "Nova Suíça 02 <nao-responda@mail.sostoyota.com.br>",
      to: ["xiko57@gmail.com"],
      subject: "Teste de envio - Condomínio Nova Suíça 02",
      html: `
        <h2>Teste de envio de e-mail</h2>
        <p>O envio pelo Resend está funcionando!</p>
        <p>Este é um teste do sistema do Condomínio Nova Suíça 02.</p>
      `,
    });

    if (error) {
      console.error("Erro Resend:", error);

      return NextResponse.json(
        { erro: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: "E-mail enviado com sucesso!",
      id: data?.id,
    });

  } catch (error) {
    console.error("Erro no teste:", error);

    return NextResponse.json(
      { erro: "Falha ao executar o teste." },
      { status: 500 }
    );
  }
}
