import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert, User, Shield, Settings } from "lucide-react";
import GerenciarUsuario from "./gerenciar";
import Header from "@/components/Header";

async function ListaUsuarios() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/auth/login");

  const { data: myProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (myProfile?.role !== "sindico") redirect("/protected");

  const { data: perfis } = await supabase.from("profiles").select("*").order("nome");

  return (
    <div className="w-full flex flex-col gap-4">
      {perfis?.map((p) => (
        <div key={p.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${p.role === 'sindico' ? 'bg-blue-900/50 text-blue-400' : p.role === 'prestador' ? 'bg-teal-900/50 text-teal-400' : 'bg-slate-700 text-slate-400'}`}>
              {p.role === 'sindico' ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-white">{p.nome || "Sem nome"}</h3>
              <p className="text-sm text-slate-400">{p.unidade || "Sem unidade"} • {p.role.toUpperCase()}</p>
            </div>
          </div>
          
          {user.id !== p.id && (
            <GerenciarUsuario id={p.id} roleAtual={p.role} />
          )}
        </div>
      ))}
      {perfis?.length === 0 && <p className="text-center text-slate-400 p-8">Nenhum usuário encontrado.</p>}
    </div>
  );
}

async function AdminHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "sindico") return null;

  return (
    <div className="flex flex-col gap-4">
      <Header />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-blue-500" /> Gestão de Acessos
        </h1>
        
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/condominio">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white">
              <Settings className="w-4 h-4 mr-2" /> Dados do Condomínio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="flex-1 w-full flex flex-col items-center p-4 md:p-12 bg-slate-900 min-h-screen">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <Suspense fallback={<div className="h-24 animate-pulse bg-slate-800 rounded-xl"></div>}>
          <AdminHeader />
        </Suspense>
        
        <p className="text-slate-400 text-sm">
          Promova moradores a síndicos, gerencie prestadores ou atualize os dados do condomínio.
        </p>

        <Suspense fallback={<div className="animate-pulse text-slate-400 p-8 text-center">Carregando usuários...</div>}>
          <ListaUsuarios />
        </Suspense>
      </div>
    </div>
  );
}