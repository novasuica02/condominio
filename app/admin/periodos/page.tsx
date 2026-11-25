
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PeriodosClient from "./periodos-client";

export default function PeriodosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
          Carregando horários e períodos...
        </div>
      }
    >
      <PeriodosConteudo />
    </Suspense>
  );
}

async function PeriodosConteudo() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: perfil, error: erroPerfil } = await supabase
    .from("profiles")
    .select("role, condominio_id")
    .eq("id", user.id)
    .single();

  if (
    erroPerfil ||
    !perfil ||
    !["sindico", "subsindico"].includes(perfil.role)
  ) {
    redirect("/protected");
  }

  const { data: areas, error: erroAreas } = await supabase
    .from("areas_comuns")
    .select("id, nome, modalidade, ativo")
    .eq("condominio_id", perfil.condominio_id)
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (erroAreas) {
    throw new Error("Não foi possível carregar as áreas comuns.");
  }

  const { data: periodos, error: erroPeriodos } = await supabase
    .from("periodos_areas")
    .select(`
      id,
      area_id,
      nome,
      hora_inicio,
      hora_fim,
      dias_semana,
      intervalo_limpeza_minutos,
      ordem,
      ativo
    `)
    .eq("condominio_id", perfil.condominio_id)
    .order("ordem", { ascending: true });

  if (erroPeriodos) {
    throw new Error("Não foi possível carregar os períodos.");
  }

  return (
    <PeriodosClient
      areas={areas ?? []}
      periodos={periodos ?? []}
      condominioId={perfil.condominio_id}
    />
  );
}
