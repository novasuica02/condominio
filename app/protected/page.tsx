
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Megaphone,
  Wrench,
  FileText,
  UserCircle,
  Users,
  Shield,
  Phone,
  ShoppingBag,
  Store,
  CalendarDays,
  CalendarPlus,
} from "lucide-react";
import Header from "@/components/Header";

async function PainelContent() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const isSindico =
    profile?.role === "sindico" || profile?.role === "subsindico";

  const isPrestador = profile?.role === "prestador";

  if (isPrestador) {
    redirect("/chamados");
  }

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-slate-900">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4">
        <Header showBackButton={false} />
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8">
        <div className="flex justify-between items-end mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Área do Morador
          </h1>

          {isSindico && (
            <span className="text-[10px] sm:text-xs font-semibold bg-blue-900 text-blue-200 px-2 sm:px-3 py-1 rounded-full border border-blue-700">
              Gestão
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">

          {/* Mural de Avisos */}
          <Link href="/avisos" className="group">
            <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-sm hover:border-blue-500 hover:shadow-md transition-all h-full flex flex-col items-center text-center justify-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-900/50 text-blue-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Megaphone className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-sm sm:text-base font-bold mb-1 text-white leading-tight">
                Mural de Avisos
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
                Notícias e comunicados
              </p>
            </div>
          </Link>

          {/* Chamados */}
          <Link href="/chamados" className="group">
            <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-sm hover:border-orange-500 hover:shadow-md transition-all h-full flex flex-col items-center text-center justify-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-900/50 text-orange-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-sm sm:text-base font-bold mb-1 text-white leading-tight">
                Chamados
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
                Manutenção e reparos
              </p>
            </div>
          </Link>

          {/* Classificados */}
          <Link href="/classificados" className="group">
            <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-sm hover:border-amber-500 hover:shadow-md transition-all h-full flex flex-col items-center text-center justify-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-900/50 text-amber-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-sm sm:text-base font-bold mb-1 text-white leading-tight">
                Classificados
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
                Compra, venda e serviços
              </p>
            </div>
          </Link>

          {/* Documentos */}
          <Link href="/documentos" className="group">
            <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all h-full flex flex-col items-center text-center justify-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-900/50 text-emerald-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-sm sm:text-base font-bold mb-1 text-white leading-tight">
                Documentos
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
                Atas e regimentos
              </p>
            </div>
          </Link>

          {/* Profissionais indicados */}
          <Link href="/profissionais" className="group">
            <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-sm hover:border-teal-500 hover:shadow-md transition-all h-full flex flex-col items-center text-center justify-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-teal-900/50 text-teal-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UserCircle className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-sm sm:text-base font-bold mb-1 text-white leading-tight">
                Precisa de um Serviço?
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
                Indicações de confiança
              </p>
            </div>
          </Link>

          {/* Moradores */}
          <Link href="/moradores" className="group">
            <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-sm hover:border-slate-500 hover:shadow-md transition-all h-full flex flex-col items-center text-center justify-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-700 text-slate-300 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-sm sm:text-base font-bold mb-1 text-white leading-tight">
                Moradores
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
                Lista de contatos
              </p>
            </div>
          </Link>

          {/* Meu Perfil */}
          <Link href="/perfil" className="group">
            <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-sm hover:border-purple-500 hover:shadow-md transition-all h-full flex flex-col items-center text-center justify-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-900/50 text-purple-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UserCircle className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-sm sm:text-base font-bold mb-1 text-white leading-tight">
                Meu Perfil
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
                Meus dados
              </p>
            </div>
          </Link>

          {/* Áreas Comuns */}
          <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-sm hover:border-cyan-500 hover:shadow-md transition-all h-full flex flex-col items-center text-center justify-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-cyan-900/50 text-cyan-400 rounded-full flex items-center justify-center mb-3">
              <CalendarDays className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <h2 className="text-sm sm:text-base font-bold mb-1 text-white leading-tight">
              Áreas Comuns
            </h2>

            <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block mb-3">
              Agenda e reservas
            </p>

            <div className="flex w-full gap-2 mt-1">
              <Link
                href="/protected/agenda"
                className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-1.5 py-2 text-[10px] sm:text-xs font-semibold transition-colors"
              >
                <CalendarDays className="w-4 h-4" />
                Agenda
              </Link>

              <Link
                href="/protected/reservas"
                className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700 px-1.5 py-2 text-[10px] sm:text-xs font-semibold transition-colors"
              >
                <CalendarPlus className="w-4 h-4" />
                Reservar
              </Link>
            </div>
          </div>

          {/* Acessos administrativos */}
          {isSindico && (
            <>
              <Link href="/admin" className="group">
                <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-sm hover:border-blue-500 hover:shadow-md transition-all h-full flex flex-col items-center text-center justify-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-900/50 text-blue-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Shield className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <h2 className="text-sm sm:text-base font-bold mb-1 text-white leading-tight">
                    Gestão
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
                    Acessos e permissões
                  </p>
                </div>
              </Link>

              <Link href="/prestadores" className="group">
                <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-sm hover:border-teal-500 hover:shadow-md transition-all h-full flex flex-col items-center text-center justify-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-teal-900/50 text-teal-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Store className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <h2 className="text-sm sm:text-base font-bold mb-1 text-white leading-tight">
                    Prestadores
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
                    Cadastro e responsáveis
                  </p>
                </div>
              </Link>

              <Link href="/telefones-uteis/gerenciar" className="group">
                <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-sm hover:border-blue-500 hover:shadow-md transition-all h-full flex flex-col items-center text-center justify-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-900/50 text-blue-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Phone className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <h2 className="text-sm sm:text-base font-bold mb-1 text-white leading-tight">
                    Telefones Úteis
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
                    Gerenciar contatos
                  </p>
                </div>
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ProtectedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-900">
          <p className="text-slate-400 animate-pulse">
            Carregando painel...
          </p>
        </div>
      }
    >
      <PainelContent />
    </Suspense>
  );
}
