import { NextResponse } from "next/server";

// Função de proxy vazia: apenas repassa a requisição sem fazer nada.
// Isso desativa a verificação de sessão do Supabase temporariamente.
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};