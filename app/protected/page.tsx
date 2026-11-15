import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2, Megaphone, Wrench, FileText, LogOut, UserCircle, Users, Shield } from "lucide-react";

async function PainelContent() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  const isSindico = profile?.role === "sindico";

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-slate-50/50">
      <header className="bg-white border-b w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-md text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-800 text-base sm:text-lg">Nova Suíça 02</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:block">{data.user.email}</span>
            <form action="/auth/logout" method="post">
              <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3">
                <LogOut className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Sair</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8">
        <div className="flex justify-between items-end mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Área do Morador</h1>
          {isSindico && (
            <span className="text-[10px] sm:text-xs font-semibold bg-blue-100 text-blue-700 px-2 sm:px-3 py-1 rounded-full">Síndico</span>
          )}
        </div>
        
        {/* GRID: 2 colunas no celular, 3 no tablet, 4 no PC */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          
          <Link href="/avisos" className="group">
            <div className="bg-white p-3 sm:p-6 rounded-xl border shadow-sm hover:border-blue-500 hover:shadow-md transition-all h-full flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h2 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 text-slate-800 leading-tight">Mural de Avisos</h2>
              <p className="text-[11px] sm:text-sm text-slate-500 hidden sm:block">Veja as últimas notícias e comunicados.</p>
            </div>
          </Link>

          <Link href="/chamados" className="group">
            <div className="bg-white p-3 sm:p-6 rounded-xl border shadow-sm hover:border-orange-500 hover:shadow-md transition-all h-full flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h2 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 text-slate-800 leading-tight">Chamados</h2>
              <p className="text-[11px] sm:text-sm text-slate-500 hidden sm:block">Abra e acompanhe solicitações de manutenção.</p>
            </div>
          </Link>

          <Link href="/documentos" className="group">
            <div className="bg-white p-3 sm:p-6 rounded-xl border shadow-sm hover:border-emerald-500 hover:shadow-md transition-all h-full flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h2 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 text-slate-800 leading-tight">Documentos</h2>
              <p className="text-[11px] sm:text-sm text-slate-500 hidden sm:block">Acesse atas, regimento e contratos.</p>
            </div>
          </Link>

          <Link href="/perfil" className="group">
            <div className="bg-white p-3 sm:p-6 rounded-xl border shadow-sm hover:border-purple-500 hover:shadow-md transition-all h-full flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                <UserCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h2 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 text-slate-800 leading-tight">Meu Perfil</h2>
              <p className="text-[11px] sm:text-sm text-slate-500 hidden sm:block">Atualize seus dados de contato e endereço.</p>
            </div>
          </Link>

          <Link href="/moradores" className="group">
            <div className="bg-white p-3 sm:p-6 rounded-xl border shadow-sm hover:border-slate-500 hover:shadow-md transition-all h-full flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h2 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 text-slate-800 leading-tight">Moradores</h2>
              <p className="text-[11px] sm:text-sm text-slate-500 hidden sm:block">Gerencie a lista de contatos e localização.</p>
            </div>
          </Link>

          {isSindico && (
            <Link href="/admin" className="group">
              <div className="bg-white p-3 sm:p-6 rounded-xl border shadow-sm hover:border-blue-600 hover:shadow-md transition-all h-full flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h2 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 text-slate-800 leading-tight">Gestão</h2>
                <p className="text-[11px] sm:text-sm text-slate-500 hidden sm:block">Gerencie os acessos dos moradores.</p>
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
    <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50"><p className="text-slate-500 animate-pulse">Carregando painel...</p></div>}>
      <PainelContent />
    </Suspense>
  );
}