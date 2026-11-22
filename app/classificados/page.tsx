
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClassificadosLista } from "./lista";
import Header from "@/components/Header";

async function ClassificadosContent() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const { data: perfil, error } = await supabase
    .from("profiles")
    .select("id, nome, unidade, condominio_id, role")
    .eq("id", user.id)
    .single();

  if (error || !perfil) {
    redirect("/auth/login");
  }

  if (perfil.role === "prestador") {
    redirect("/chamados");
  }

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-slate-900">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4">
        <Header
          showBackButton={true}
          backUrl="/protected"
          backText="Menu"
        />
      </div>

      <ClassificadosLista
        condominioId={perfil.condominio_id}
        usuarioId={user.id}
        role={perfil.role}
      />
    </div>
  );
}

export default function ClassificadosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
          Carregando classificados...
        </div>
      }
    >
      <ClassificadosContent />
    </Suspense>
  );
}
