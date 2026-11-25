
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import ReservasMoradorClient from "./reservas-morador-client";

async function ReservasMoradorConteudo() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: perfil, error: erroPerfil } = await supabase
    .from("profiles")
    .select("role, condominio_id, unidade_id")
    .eq("id", user.id)
    .single();

  if (erroPerfil || !perfil) {
    redirect("/protected");
  }

  if (perfil.role === "prestador") {
    redirect("/chamados");
  }

  if (["sindico", "subsindico"].includes(perfil.role)) {
    redirect("/admin/reservas");
  }

  if (
    perfil.role !== "morador" ||
    !perfil.condominio_id ||
    !perfil.unidade_id
  ) {
    redirect("/protected");
  }

  const condominioId = perfil.condominio_id;

  const [
    { data: areas, error: erroAreas },
    { data: reservas, error: erroReservas },
  ] = await Promise.all([
    supabase
      .from("areas_comuns")
      .select(`
        id,
        nome,
        descricao,
        modalidade,
        limite_mensal_unidade,
        prazo_cancelamento_horas,
        antecedencia_maxima_dias,
        taxa_utilizacao,
        exige_aprovacao_padrao
      `)
      .eq("condominio_id", condominioId)
      .eq("ativo", true)
      .eq("modalidade", "reserva")
      .order("nome", { ascending: true }),

    supabase
      .from("reservas_areas")
      .select(`
        id,
        area_id,
        periodo_id,
        data_reserva,
        status,
        valor_taxa,
        observacao,
        motivo_decisao,
        created_at
      `)
      .eq("condominio_id", condominioId)
      .eq("morador_id", user.id)
      .order("data_reserva", { ascending: false }),
  ]);

  if (erroAreas || erroReservas) {
    console.error("Erro ao carregar reservas do morador:", {
      erroAreas,
      erroReservas,
    });

    return (
      <>
        <Header backUrl="/protected" />
        <main className="min-h-screen bg-slate-900 px-4 py-8">
          <div className="max-w-4xl mx-auto bg-slate-800 border border-red-800 rounded-xl p-5">
            <h1 className="font-semibold text-red-300">
              Não foi possível carregar as reservas
            </h1>
            <p className="text-sm text-slate-300 mt-2">
              Ocorreu um erro ao consultar as áreas comuns ou suas reservas.
              Tente novamente mais tarde.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="w-full max-w-4xl mx-auto px-4 pt-3">
        <Header backUrl="/protected" backText="Voltar" />
      </div>

      <ReservasMoradorClient
        areas={areas ?? []}
        reservasIniciais={reservas ?? []}
        userId={user.id}
      />
    </div>
  );
}

export default function ReservasMoradorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-300">
          Carregando reservas...
        </div>
      }
    >
      <ReservasMoradorConteudo />
    </Suspense>
  );
}
