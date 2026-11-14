import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, ShieldAlert, User } from "lucide-react";
import GerenciarUsuario from "./gerenciar";

// Componente que busca e lista os usuários
async function ListaUsuarios() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/auth/login");

  const { data: myProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  
  // Se não for síndico, expulsa da página
  if (myProfile?.role !== "sindico") {
    redirect("/protected");
  }

  const { data: perfis } = await supabase.from("profiles").select("*").order("nome");

  return (
    <div className="w-full flex flex-col gap-4">
      {perfis?.map((p) => (
        <div key={p.id} className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${p.role === 'sindico' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
              {p.role === 'sindico' ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{p.nome || "Sem nome cadastrado"}</h3>
              <p className="text-sm text-slate-500">{p.unidade || "Sem unidade"} • {p.role.toUpperCase()}</p>
            </div>
          </div>
          
          {/* Não mostra o botão para o próprio usuário logado, para ele não se rebaixar sem querer */}
          {user.id !== p.id && (
            <GerenciarUsuario id={p.id} roleAtual={p.role} />
          )}
        </div>
      ))}
      {perfis?.length === 0 && <p className="text-center text-slate-500 p-8">Nenhum usuário encontrado.</p>}
    </div>
  );
}

// Componente do cabeçalho
function AdminHeader() {
  return (
    <div className="flex items-center gap-3">
      <Link href="/protected">
        <Button variant="ghost" size="icon" className="text-slate-500"><ArrowLeft className="w-5 h-5" /></Button>
      </Link>
      <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
        <ShieldAlert className="w-8 h-8 text-blue-600" /> Gestão de Acessos
      </h1>
    </div>
  );
}

// Página principal
export default function AdminPage() {
  return (
    <div className="flex-1 w-full flex flex-col items-center p-6 md:p-12 bg-slate-50/50 min-h-screen">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <AdminHeader />
        <p className="text-slate-600">Promova moradores a síndicos ou remova privilégios de administradores.</p>

        <Suspense fallback={<div className="animate-pulse text-slate-500 p-8 text-center bg-white rounded-xl border">Carregando lista de usuários...</div>}>
          <ListaUsuarios />
        </Suspense>
      </div>
    </div>
  );
}