import { updateSession } from "@/lib/supabase/proxy";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  // Se as variáveis não existirem, não quebra o site. Apenas segue.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("Variáveis do Supabase ausentes no proxy. Pulando verificação.");
    return NextResponse.next({ request });
  }

  try {
    return await updateSession(request);
  } catch (error) {
    console.error("Erro no proxy:", error);
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};