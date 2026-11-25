
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MoradoresClient from "./moradores-client";

export default function MoradoresPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
          Carregando moradores...
        </div>
      }
    >
      <MoradoresConteudo />
    </Suspense>
  );
}

async function MoradoresConteudo() {
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

  const { data: moradores, error } = await supabase
    .from("profiles")
    .select("id, nome, unidade, unidade_id, role")
    .eq("condominio_id", perfil.condominio_id)
    .in("role", ["morador", "sindico", "subsindico"])
    .order("nome", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar os moradores.");
  }

  return (
    <MoradoresClient
      moradores={moradores ?? []}
      meuId={user.id}
      meuCargo={perfil.role}
    />
  );
}
