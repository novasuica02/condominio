import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import EditarAvisoForm from "./form";

// 1. Componente que recebe a Promise e a resolve AQUI DENTRO
async function CarregarAviso({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise; // O Next.js 16 exige o await AQUI

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "sindico") redirect("/avisos");

  const { data: aviso } = await supabase.from("avisos").select("*").eq("id", id).single();
  if (!aviso) return <div className="text-red-500">Aviso não encontrado.</div>;

  return (
    <div className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-xl border shadow-sm">
      <div className="flex items-center gap-2 mb-6 border-b pb-4">
        <Link href="/avisos">
          <Button variant="ghost" size="icon" className="-ml-2"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <h1 className="text-xl font-bold text-slate-800">Editar Aviso</h1>
      </div>
      <EditarAvisoForm aviso={aviso} />
    </div>
  );
}

// 2. A página APENAS repassa a Promise para o componente acima
export default function EditarAvisoPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="flex-1 w-full flex flex-col items-center p-6 md:p-12 bg-slate-50/50 min-h-screen">
      <Suspense fallback={<div className="text-center p-12 text-slate-500">Carregando aviso...</div>}>
        <CarregarAviso paramsPromise={params} />
      </Suspense>
    </div>
  );
}