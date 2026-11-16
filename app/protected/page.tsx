import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2, Megaphone, Wrench, FileText, LogOut, UserCircle, Users, Shield, HelpCircle } from "lucide-react";

async function PainelContent() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  const isSindico = profile?.role === "sindico";
  const isPrestador = profile?.role === "prestador";

  // REDIRECIONAMENTO: Se for prestador, vai direto para a lista de chamados
  if (isPrestador) {
    redirect("/chamados");
  }

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-md text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-bold text-white text-base sm:text-lg">Nova Suíça 02</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs text-slate-400 hidden sm:block mr-2">{data.user.email}</span>
            
            <Link href="/ajuda">
              <div className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-amber-300 hover:text-amber-200 border border-amber-400/50 px-3 py-1.5 rounded-md shadow-sm transition-all cursor-pointer">
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm font-semibold hidden sm:inline">Ajuda</span>
              </div>
            </Link>

            <form action="/auth/logout" method="post">
              <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3 bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                <LogOut className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Sair</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8">
        <div className="flex justify-between items-end mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Área do Morador</h1>
          {isSindico && (
            <span className="text-[10px] sm:text-xs font-semibold bg-blue-900 text-blue-200 px-2 sm:px-3 py-1 rounded-full border border-blue-700">Síndico</span>
          )}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          
          <Link href="/avisos" className="group">
            <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-sm hover:border-blue-500 hover:shadow-md transition-all h-full flex flex-col items-center text-center justify-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-900/50 text-blue-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Megaphone className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-sm sm:text-base font-bold mb-1 text-white leading-tight">Mural de Avisos</h2>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">Notícias e comunicados</p>
            </div>
          </Link>

          <Link href="/chamados" className="group">
            <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-sm hover:border-orange-500 hover:shadow-md transition-all h-full flex flex-col items-center text-center justify-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-900/50 text-orange-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-sm sm:text-base font-bold mb-1 text-white leading-tight">Chamados</h2>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">Manutenção e reparos</p>
            </div>
          </Link>

          <Link href="/documentos" className="group">
            <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all h-full flex flex-col items-center text-center justify-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-900/50 text-emerald-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-sm sm:text-base font-bold mb-1 text-white leading-tight">Documentos</h2>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">Atas e regimentos</p>
            </div>
          </Link>

          <Link href="/profissionais" className="group">
            <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-sm hover:border-teal-500 hover:shadow-md transition-all h-full flex flex-col items-center text-center justify-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-teal-900/50 text-teal-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UserCircle className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-sm sm:text-base font-bold mb-1 text-white leading-tight">Precisa de um Serviço?</h2>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">Indicações de confiança</p>
            </div>
          </Link>

          <Link href="/moradores" className="group">
            <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-sm hover:border-slate-500 hover:shadow-md transition-all h-full flex flex-col items-center text-center justify-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-700 text-slate-300 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-sm sm:text-base font-bold mb-1 text-white leading-tight">Moradores</h2>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">Lista de contatos</p>
            </div>
          </Link>

          <Link href="/perfil" className="group">
            <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-sm hover:border-purple-500 hover:shadow-md transition-all h-full flex flex-col items-center text-center justify-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-900/50 text-purple-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UserCircle className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-sm sm:text-base font-bold mb-1 text-white leading-tight">Meu Perfil</h2>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">Meus dados</p>
            </div>
          </Link>

          {isSindico && (
            <Link href="/admin" className="group">
              <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-sm hover:border-blue-500 hover:shadow-md transition-all h-full flex flex-col items-center text-center justify-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-900/50 text-blue-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h2 className="text-sm sm:text-base font-bold mb-1 text-white leading-tight">Gestão</h2>
                <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">Acessos e permissões</p>
              </div>
            </Link>
          )}

        </div>
      </main>
    </div>
  );
}

export default function ProtectedPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-screen bg-slate-900"><p className="text-slate-400 animate-pulse">Carregando painel...</p></div>}>
      <PainelContent />
    </Suspense>
  );
}