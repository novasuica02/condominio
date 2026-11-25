
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import ReservasClient from "./reservas-client";

export default function ReservasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-300">
          Carregando reservas...
        </div>
      }
    >
      <ReservasConteudo />
    </Suspense>
  );
}

async function ReservasConteudo() {
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
    { data: reservas, error: erroReservas },
    { data: areas, error: erroAreas },
    { data: periodos, error: erroPeriodos },
    { data: moradores, error: erroMoradores },
  ] = await Promise.all([
    supabase
      .from("reservas_areas")
      .select(`
        id,
        area_id,
        periodo_id,
        morador_id,
        unidade_id,
        data_reserva,
        status,
        exige_aprovacao,
        valor_taxa,
        observacao,
        aprovado_por,
        aprovado_em,
        motivo_decisao,
        cancelado_por,
        cancelado_em,
        created_at,
        updated_at
      `)
      .eq("condominio_id", condominioId)
      .order("data_reserva", { ascending: false }),

    supabase
      .from("areas_comuns")
      .select("id, nome, modalidade, ativo")
      .eq("condominio_id", condominioId),

    supabase
      .from("periodos_areas")
      .select("id, area_id, nome, hora_inicio, hora_fim, ativo")
      .eq("condominio_id", condominioId),

    supabase
      .from("profiles")
      .select("id, nome, unidade")
      .eq("condominio_id", condominioId),
  ]);

  if (erroReservas || erroAreas || erroPeriodos || erroMoradores) {
    throw new Error("Não foi possível carregar os dados das reservas.");
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="w-full max-w-4xl mx-auto px-4 md:px-0 pt-3">
        <Header
          showBackButton={true}
          backUrl="/admin"
          backText="Voltar"
        />
      </div>

      <ReservasClient
        reservas={reservas ?? []}
        areas={areas ?? []}
        periodos={periodos ?? []}
        moradores={moradores ?? []}
        condominioId={condominioId}
      />
    </div>
  );
}
