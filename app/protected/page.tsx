import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2, Megaphone, Wrench, FileText, LogOut, UserCircle, Users } from "lucide-react";

async function PainelContent() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Busca o perfil para checar se é síndico
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const isSindico = profile?.role === "sindico";

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-slate-50/50">
      {/* Barra Superior */}
      <header className="bg-white border-b w-full">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-md text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-800 text-lg">Nova Suíça 02</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:block">
              {data.user.email}
            </span>
            <form action="/auth/signout" method="post">
              <Button variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Conteúdo do Painel */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8">
        <div className="flex justify-between items-end mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Área do Morador</h1>
          {isSindico && (
            <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
              Modo Síndico Ativo
            </span>
          )}
        </div>
        
        {/* Grid de Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          
          {/* Card: Mural de Avisos */}
          <Link href="/avisos" className="group">
            <div className="bg-white p-6 rounded-xl border shadow-sm hover:border-blue-500 hover:shadow-md transition-all h-full">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Megaphone className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-slate-800">Mural de Avisos</h2>
              <p className="text-sm text-slate-500">
                Veja as últimas notícias e comunicados.
              </p>
            </div>
          </Link>

          {/* Card: Meu Perfil */}
          <Link href="/perfil" className="group">
            <div className="bg-white p-6 rounded-xl border shadow-sm hover:border-purple-500 hover:shadow-md transition-all h-full">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UserCircle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-slate-800">Meu Perfil</h2>
              <p className="text-sm text-slate-500">
                Atualize seus dados de contato e endereço.
              </p>
            </div>
          </Link>

          {/* Card: Moradores */}
          <Link href="/moradores" className="group">
            <div className="bg-white p-6 rounded-xl border shadow-sm hover:border-slate-500 hover:shadow-md transition-all h-full">
              <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-slate-800">Moradores</h2>
              <p className="text-sm text-slate-500">
                Gerencie a lista de contatos e localização.
              </p>
            </div>
          </Link>

          {/* Card: Chamados (Em Breve) */}
          <div className="bg-white p-6 rounded-xl border border-dashed opacity-60 cursor-not-allowed h-full">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4">
              <Wrench className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold mb-2 text-slate-800">Chamados</h2>
            <p className="text-sm text-slate-500">
              Abra solicitações de manutenção. (Em breve)
            </p>
          </div>

          {/* Card: Documentos (Em Breve) */}
          <div className="bg-white p-6 rounded-xl border border-dashed opacity-60 cursor-not-allowed h-full">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold mb-2 text-slate-800">Documentos</h2>
            <p className="text-sm text-slate-500">
              Acesse atas, regimento e contratos. (Em breve)
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function ProtectedPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-slate-500 animate-pulse">Carregando painel...</p>
      </div>
    }>
      <PainelContent />
    </Suspense>
  );
}