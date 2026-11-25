
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AreasComunsClient from "./areas-comuns-client";

export default function AreasComunsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
          Carregando áreas comuns...
        </div>
      }
    >
      <AreasComunsConteudo />
    </Suspense>
  );
}

async function AreasComunsConteudo() {
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

  const { data: areas, error } = await supabase
    .from("areas_comuns")
    .select(`
      id,
      nome,
      descricao,
      modalidade,
      capacidade_maxima,
      limite_mensal_unidade,
      prazo_cancelamento_horas,
      antecedencia_maxima_dias,
      taxa_utilizacao,
      exige_aprovacao_padrao,
      checkin_obrigatorio,
      ativo
    `)
    .eq("condominio_id", perfil.condominio_id)
    .order("nome", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar as áreas comuns.");
  }

  return (
    <AreasComunsClient
      areas={areas ?? []}
      meuCargo={perfil.role}
      condominioId={perfil.condominio_id}
    />
  );
}
