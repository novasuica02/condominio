import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { UltimoAviso } from "./ultimo-aviso";

async function UserStatus() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    return (
      <Link href="/protected">
        <Button className="bg-blue-600 hover:bg-blue-500 text-white">Acessar Painel</Button>
      </Link>
    );
  }

  return (
    <Link href="/auth/login">
      <Button variant="outline" className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
        Fazer Login
      </Button>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="flex-1 w-full flex flex-col items-center bg-slate-900 min-h-screen">
      
      {/* HEADER DINÂMICO */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4">
        <Header showBackButton={false} />
      </div>

      {/* CONTEÚDO CENTRAL */}
      <main className="w-full max-w-4xl px-4 mt-12 text-center flex flex-col items-center gap-6">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          Tudo o que acontece no <span className="text-blue-500">Nova Suíça II</span>, <br className="hidden md:block" />
          em um só lugar.
        </h2>
        <p className="text-lg text-slate-400 max-w-2xl">
          Acesse o mural de avisos, abra chamados para a administração e fique por dentro das novidades.
        </p>
        
        <div className="mt-2 flex gap-3">
          <Suspense fallback={<Button disabled>Carregando...</Button>}>
            <UserStatus />
          </Suspense>
          <Link href="/auth/sign-up">
            <Button size="lg" className="px-8 bg-blue-600 hover:bg-blue-500 text-white">Criar minha conta</Button>
          </Link>
        </div>

        <Suspense fallback={<div className="text-slate-500 mt-8 animate-pulse">Buscando último aviso...</div>}>
          <UltimoAviso />
        </Suspense>
      </main>
    </div>
  );
}