import { updateSession } from "@/lib/supabase/proxy";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  // 1. GUARDA DE SEGURANÇA: Verifica se as variáveis de ambiente existem.
  // Se não existirem (ex: falha na Vercel), ele ignora o Supabase e deixa a página carregar.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("Aviso: Variáveis do Supabase ausentes no proxy. Pulando verificação de sessão.");
    return NextResponse.next({ request });
  }

  // 2. Se as variáveis existem, tenta atualizar a sessão normalmente
  try {
    return await updateSession(request);
  } catch (error) {
    console.error("Erro ao atualizar sessão no proxy:", error);
    // Se der erro no Supabase, não trava o site, apenas segue em frente
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};