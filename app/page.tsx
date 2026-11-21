
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { UltimoAviso } from "./ultimo-aviso";
import { Phone } from "lucide-react";

async function UserStatus() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    return (
      <Link href="/protected">
        <Button
          size="lg"
          className="bg-blue-600 hover:bg-blue-500 text-white px-7"
        >
          Acessar Painel
        </Button>
      </Link>
    );
  }

  return (
    <Link href="/auth/login">
      <Button
        size="lg"
        variant="outline"
        className="bg-transparent border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white px-7"
      >
        Fazer Login
      </Button>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="flex-1 w-full flex flex-col bg-slate-900 min-h-screen">
      {/* CABEÇALHO */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4">
        <Header showBackButton={false} />
      </div>

      {/* APRESENTAÇÃO */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-16 flex flex-col gap-10">

        <section className="relative overflow-hidden rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 px-6 py-10 md:px-12 md:py-14">
          <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300 mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Bem-vindo ao aplicativo do condomínio
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Nova Suíça 02
              <span className="block text-blue-400 mt-2">
                Mais perto de você.
              </span>
            </h1>

            <p className="mt-5 text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Um espaço para acompanhar os avisos, solicitar serviços,
              consultar informações e ficar por dentro de tudo o que
              acontece no nosso condomínio.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Suspense
                fallback={
                  <Button size="lg" disabled>
                    Carregando...
                  </Button>
                }
              >
                <UserStatus />
              </Suspense>

              <Link href="/auth/sign-up">
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-7 bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                >
                  Criar minha conta
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* PRINCIPAIS SERVIÇOS */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">
              O condomínio em um só lugar
            </h2>
            <p className="text-slate-400 mt-2">
              Mais praticidade para acompanhar e participar da vida do condomínio.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center text-2xl mb-4">
                📢
              </div>
              <h3 className="text-lg font-semibold text-white">
                Mural de avisos
              </h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Acompanhe comunicados, notícias e informações importantes
                da administração.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-2xl mb-4">
                🔧
              </div>
              <h3 className="text-lg font-semibold text-white">
                Solicitação de serviços
              </h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Registre chamados, acompanhe atendimentos e consulte
                as atualizações das solicitações.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-6">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-2xl mb-4">
                🏡
              </div>
              <h3 className="text-lg font-semibold text-white">
                Informações do condomínio
              </h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Consulte documentos, orientações e informações úteis
                para o dia a dia.
              </p>
            </div>

            <Link
              href="/telefones-uteis"
              className="group rounded-2xl border border-slate-700 bg-slate-800/70 p-6 transition-all hover:border-blue-500/60 hover:bg-slate-800"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 mb-4 transition-colors group-hover:bg-blue-500/25">
                <Phone size={26} />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Telefones Úteis
              </h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Encontre rapidamente telefones de emergência, serviços
                e contatos importantes.
              </p>
              <span className="inline-block mt-4 text-sm font-medium text-blue-400 group-hover:text-blue-300">
                Consultar contatos →
              </span>
            </Link>

          </div>
        </section>

        {/* ÚLTIMO AVISO */}
        <section>
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-white">
              Últimas novidades
            </h2>
            <p className="text-slate-400 mt-2">
              Confira o comunicado mais recente da administração.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4 sm:p-6">
            <Suspense
              fallback={
                <div className="text-slate-500 py-6 text-center animate-pulse">
                  Buscando último aviso...
                </div>
              }
            >
              <UltimoAviso />
            </Suspense>
          </div>
        </section>

        {/* RODAPÉ */}
        <footer className="border-t border-slate-800 pt-6 pb-4 text-center">
          <p className="text-sm text-slate-500">
            Nova Suíça 02 · Aplicativo do Condomínio
          </p>
          <p className="text-xs text-slate-600 mt-2">
            Informação, comunicação e praticidade para todos.
          </p>
        </footer>
      </main>
    </div>
  );
}
