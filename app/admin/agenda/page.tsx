
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import AgendaClient from "./agenda-client";

export default function AgendaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-300">
          Carregando agenda...
        </div>
      }
    >
      <AgendaConteudo />
    </Suspense>
  );
}

async function AgendaConteudo() {
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

  const condominioId = perfil.condominio_id;

  const [
    { data: eventos, error: erroEventos },
    { data: bloqueios, error: erroBloqueios },
    { data: areas, error: erroAreas },
  ] = await Promise.all([
    supabase
      .from("eventos_condominio")
      .select(`
        id,
        area_id,
        titulo,
        descricao,
        tipo_evento,
        inicio_em,
        fim_em,
        local,
        bloqueia_area,
        status,
        criado_por,
        created_at,
        updated_at
      `)
      .eq("condominio_id", condominioId)
      .order("inicio_em", { ascending: true }),

    supabase
      .from("bloqueios_areas")
      .select(`
        id,
        area_id,
        periodo_id,
        data_inicio,
        data_fim,
        motivo,
        criado_por,
        ativo,
        created_at
      `)
      .eq("condominio_id", condominioId)
      .eq("ativo", true)
      .order("data_inicio", { ascending: true }),

    supabase
      .from("areas_comuns")
      .select("id, nome, modalidade, ativo")
      .eq("condominio_id", condominioId),
  ]);

  if (erroEventos || erroBloqueios || erroAreas) {
    throw new Error("Não foi possível carregar os dados da agenda.");
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="w-full flex flex-col items-center px-4 pt-4 pb-0 md:px-12 md:pt-12 md:pb-0">
        <div className="w-full max-w-4xl">
          <Header
            showBackButton={true}
            backUrl="/admin"
            backText="Voltar"
          />
        </div>
      </div>

      <AgendaClient
        eventos={eventos ?? []}
        bloqueios={bloqueios ?? []}
        areas={areas ?? []}
      />
    </div>
  );
}
