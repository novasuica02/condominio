import { NextResponse } from "next/server";

// Proxy vazio: apenas repassa a requisição sem verificar sessão.
// A proteção de rotas é feita diretamente nas páginas (ex: protected/page.tsx).
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};