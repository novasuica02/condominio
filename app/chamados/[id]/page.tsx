import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import GerenciarChamadoForm from "./form";

export default async function GerenciarChamadoPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "sindico") redirect("/chamados");

  // Busca o chamado e os prestadores disponíveis
  const { data: chamado } = await supabase.from("chamados").select("*").eq("id", params.id).single();
  const { data: prestadores } = await supabase.from("prestadores").select("*").order("nome");

  if (!chamado) return <div className="p-12 text-center text-red-500">Chamado não encontrado.</div>;

  return (
    <div className="flex-1 w-full flex flex-col items-center p-6 md:p-12 bg-slate-50/50 min-h-screen">
      <div className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b pb-4">
          <Link href="/chamados"><Button variant="ghost" size="icon" className="-ml-2"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <h1 className="text-xl font-bold text-slate-800">Gerenciar Chamado</h1>
        </div>

        <div className="mb-6 bg-slate-50 p-4 rounded-lg border">
          <h2 className="font-bold text-lg">{chamado.titulo}</h2>
          <p className="text-slate-600 mt-1">{chamado.descricao}</p>
          {chamado.localizacao && <p className="text-sm text-slate-500 mt-2">Local: {chamado.localizacao}</p>}
        </div>

        <GerenciarChamadoForm chamado={chamado} prestadores={prestadores || []} />
      </div>
    </div>
  );
}