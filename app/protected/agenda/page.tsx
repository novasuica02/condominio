
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import AgendaClient from "@/app/admin/agenda/agenda-client";

async function AgendaMoradorContent() {
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

  if (erroPerfil || !perfil) {
    redirect("/protected");
  }

  if (perfil.role === "prestador") {
    redirect("/chamados");
  }

  if (
    !["morador", "sindico", "subsindico"].includes(perfil.role) ||
    !perfil.condominio_id
  ) {
    redirect("/protected");
  }

  const condominioId = perfil.condominio_id;

  const [eventosResult, bloqueiosResult, areasResult] = await Promise.all([
    supabase
      .from("eventos_condominio")
      .select(
        "id, area_id, titulo, descricao, tipo_evento, inicio_em, fim_em, local, bloqueia_area, status, criado_por, created_at, updated_at"
      )
      .eq("condominio_id", condominioId)
      .order("inicio_em", { ascending: true }),

    supabase
      .from("bloqueios_areas")
      .select(
        "id, area_id, periodo_id, data_inicio, data_fim, motivo, criado_por, ativo, created_at"
      )
      .eq("condominio_id", condominioId)
      .eq("ativo", true)
      .order("data_inicio", { ascending: true }),

    supabase
      .from("areas_comuns")
      .select("id, nome, modalidade, ativo")
      .eq("condominio_id", condominioId)
      .eq("ativo", true)
      .order("nome", { ascending: true }),
  ]);

  if (eventosResult.error || bloqueiosResult.error || areasResult.error) {
    console.error("Erro ao carregar agenda:", {
      eventos: eventosResult.error,
      bloqueios: bloqueiosResult.error,
      areas: areasResult.error,
    });

    return (
      <>
        <Header backUrl="/protected" />
        <main className="min-h-screen bg-slate-900 px-4 py-8">
          <div className="mx-auto max-w-4xl rounded-xl border border-red-500/30 bg-slate-800 p-5">
            <h1 className="text-lg font-bold text-white">
              Não foi possível carregar a agenda
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Ocorreu um erro ao consultar os eventos e bloqueios. Tente
              atualizar a página.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header backUrl="/protected" />
      <div className="min-h-screen bg-slate-900">
        <AgendaClient
          eventos={eventosResult.data ?? []}
          bloqueios={bloqueiosResult.data ?? []}
          areas={areasResult.data ?? []}
        />
      </div>
    </>
  );
}

export default function AgendaMoradorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
          Carregando agenda...
        </div>
      }
    >
      <AgendaMoradorContent />
    </Suspense>
  );
}
