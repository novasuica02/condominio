import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import GerenciarChamadoForm from "./form";

export async function GerenciarChamado({ id }: { id: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/auth/login");

  // Verifica se é síndico
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "sindico") redirect("/chamados");

  // Busca o chamado e os prestadores
  const { data: chamado } = await supabase.from("chamados").select("*").eq("id", id).single();
  const { data: prestadores } = await supabase.from("prestadores").select("*").order("nome");

  if (!chamado) return <div className="text-red-500 font-bold">Chamado não encontrado.</div>;

  return (
    <div className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-xl border shadow-sm">
      <div className="flex items-center gap-2 mb-6 border-b pb-4">
        <Link href="/chamados">
          <Button variant="ghost" size="icon" className="-ml-2"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <h1 className="text-xl font-bold text-slate-800">Gerenciar Chamado</h1>
      </div>

      <div className="mb-6 bg-slate-50 p-4 rounded-lg border">
        <h2 className="font-bold text-lg text-slate-800">{chamado.titulo}</h2>
        <p className="text-slate-600 mt-1">{chamado.descricao}</p>
        {chamado.localizacao && <p className="text-sm text-slate-500 mt-2">Local: {chamado.localizacao}</p>}
      </div>

      {/* O formulário que já criamos anteriormente */}
      <GerenciarChamadoForm chamado={chamado} prestadores={prestadores || []} />
    </div>
  );
}