import { updateSession } from "@/lib/supabase/proxy";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  // 1. GUARDA: Verifica se as variáveis existem antes de tentar criar o cliente Supabase.
  // Se não existirem, ele NÃO quebra o site, apenas segue em frente.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ Variáveis do Supabase ausentes no Middleware. Pulando verificação de sessão.");
    // Retorna a resposta normalmente, deixando a página carregar
    return NextResponse.next({ request });
  }

  // 2. Tenta atualizar a sessão com um bloco try/catch para segurança extra
  try {
    return await updateSession(request);
  } catch (error) {
    console.error("❌ Erro ao atualizar sessão no Middleware:", error);
    // Se der qualquer erro no Supabase, não derruba a página, apenas segue
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
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};