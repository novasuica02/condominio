
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PhoneCall } from "lucide-react";
import GerenciarTelefonesClient from "./gerenciar-client";

export default function GerenciarTelefonesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-900 p-8 text-center text-white">
          Carregando gerenciamento de telefones...
        </main>
      }
    >
      <ConteudoGerenciarTelefones />
    </Suspense>
  );
}

async function ConteudoGerenciarTelefones() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: perfil, error: erroPerfil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    erroPerfil ||
    !perfil ||
    !["sindico", "subsindico"].includes(perfil.role)
  ) {
    redirect("/protected");
  }

  const { data: contatos, error } = await supabase
    .from("telefones_uteis")
    .select("*")
    .order("ordem", { ascending: true })
    .order("nome", { ascending: true });

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">

        <Link
          href="/protected"
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft size={18} />
          Voltar ao painel
        </Link>

        <div className="mb-8 mt-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-3">
            <PhoneCall size={28} />
          </div>

          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              Gerenciar Telefones Úteis
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Cadastre e organize os contatos disponíveis ao público.
            </p>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            Não foi possível carregar os contatos.
          </div>
        ) : (
          <GerenciarTelefonesClient
            contatosIniciais={contatos || []}
          />
        )}
      </div>
    </main>
  );
}
