import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2, Megaphone, Wrench, FileText, LogOut } from "lucide-react";

export async function Painel() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-slate-50/50">
      <header className="bg-white border-b w-full">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
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

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Área do Morador</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/avisos" className="group">
            <div className="bg-white p-6 rounded-xl border shadow-sm hover:border-blue-500 hover:shadow-md transition-all h-full">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Megaphone className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-slate-800">Mural de Avisos</h2>
              <p className="text-sm text-slate-500">
                Veja as últimas notícias, comunicados e manutenções programadas.
              </p>
            </div>
          </Link>

          <div className="bg-white p-6 rounded-xl border border-dashed opacity-60 cursor-not-allowed">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4">
              <Wrench className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold mb-2 text-slate-800">Chamados</h2>
            <p className="text-sm text-slate-500">
              Abra solicitações de manutenção e acompanhe o status. (Em breve)
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-dashed opacity-60 cursor-not-allowed">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold mb-2 text-slate-800">Documentos</h2>
            <p className="text-sm text-slate-500">
              Acesse atas de assembleia, regimento interno e contratos. (Em breve)
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}