
"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  User,
  Crown,
  RefreshCw,
  Loader2,
} from "lucide-react";

type Morador = {
  id: string;
  nome: string | null;
  unidade: string | null;
  unidade_id: number | null;
  role: string;
};

type Props = {
  moradores: Morador[];
  meuId: string;
  meuCargo: string;
};

export default function MoradoresClient({
  moradores: moradoresIniciais,
  meuId,
  meuCargo,
}: Props) {
  const [moradores, setMoradores] = useState(moradoresIniciais);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const souSindico = meuCargo === "sindico";

  const formatarCargo = (role: string) => {
    switch (role) {
      case "sindico":
        return "Síndico";
      case "subsindico":
        return "Subsíndico";
      case "morador":
        return "Morador";
      case "prestador":
        return "Prestador";
      default:
        return role;
    }
  };

  const alterarCargo = async (
    morador: Morador,
    novoCargo: "morador" | "subsindico"
  ) => {
    const acao =
      novoCargo === "subsindico"
        ? "nomear este morador como subsíndico"
        : "retirar o cargo de subsíndico";

    if (!confirm(`Deseja realmente ${acao}?`)) return;

    setLoadingId(morador.id);
    setMensagem("");
    setErro("");

    const supabase = createClient();

    const { error } = await supabase.rpc("alterar_cargo_morador", {
      p_morador_id: morador.id,
      p_novo_cargo: novoCargo,
    });

    if (error) {
      setErro(error.message);
      setLoadingId(null);
      return;
    }

    setMoradores((atuais) =>
      atuais.map((m) =>
        m.id === morador.id ? { ...m, role: novoCargo } : m
      )
    );

    setMensagem("Cargo atualizado com sucesso!");
    setLoadingId(null);
  };

  const transferirSindico = async (morador: Morador) => {
    const confirmar = confirm(
      `ATENÇÃO!\n\nDeseja transferir a função de síndico para ${morador.nome}?\n\nSeu próprio cargo será alterado para morador e o escolhido assumirá como síndico. Essa operação não poderá ser desfeita automaticamente.`
    );

    if (!confirmar) return;

    setLoadingId(morador.id);
    setMensagem("");
    setErro("");

    const supabase = createClient();

    const { error } = await supabase.rpc("transferir_sindico", {
      p_novo_sindico_id: morador.id,
    });

    if (error) {
      setErro(error.message);
      setLoadingId(null);
      return;
    }

    setMoradores((atuais) =>
      atuais.map((m) => {
        if (m.id === meuId) return { ...m, role: "morador" };
        if (m.id === morador.id) return { ...m, role: "sindico" };
        return m;
      })
    );

    setMensagem(
      "Titularidade transferida com sucesso. Você agora é morador."
    );

    setLoadingId(null);
  };

  const recarregar = () => {
    window.location.reload();
  };

  const moradoresElegiveis = moradores.filter(
    (m) =>
      m.id !== meuId &&
      (m.role === "morador" || m.role === "subsindico")
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header />

      <main className="mx-auto max-w-6xl p-4 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/admin"
              className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
            >
              <ArrowLeft size={16} />
              Voltar à Gestão
            </Link>

            <h1 className="flex items-center gap-3 text-2xl font-bold">
              <Users className="text-blue-400" />
              Gestão de Moradores
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Consulte moradores e gerencie os cargos administrativos.
            </p>
          </div>

          <button
            onClick={recarregar}
            className="flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>

        {mensagem && (
          <div className="mb-4 rounded-lg border border-green-700 bg-green-900/30 p-4 text-green-300">
            {mensagem}
          </div>
        )}

        {erro && (
          <div className="mb-4 rounded-lg border border-red-700 bg-red-900/30 p-4 text-red-300">
            {erro}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-sm text-slate-400">Total de cadastros</p>
            <p className="mt-1 text-2xl font-bold">{moradores.length}</p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-sm text-slate-400">Síndico</p>
            <p className="mt-1 text-2xl font-bold">
              {moradores.filter((m) => m.role === "sindico").length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-sm text-slate-400">Subsíndicos</p>
            <p className="mt-1 text-2xl font-bold">
              {moradores.filter((m) => m.role === "subsindico").length}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
          <div className="border-b border-slate-700 p-4">
            <h2 className="font-semibold">Moradores cadastrados</h2>
            <p className="mt-1 text-xs text-slate-400">
              Os cargos são protegidos pelas regras do banco de dados.
            </p>
          </div>

          <div className="divide-y divide-slate-700">
            {moradores.map((morador) => {
              const ePrestador = morador.role === "prestador";
              const eMeuPerfil = morador.id === meuId;
              const carregando = loadingId === morador.id;

              return (
                <div
                  key={morador.id}
                  className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-700">
                      {morador.role === "sindico" ? (
                        <Crown className="text-yellow-400" size={21} />
                      ) : morador.role === "subsindico" ? (
                        <ShieldCheck className="text-blue-400" size={21} />
                      ) : (
                        <User className="text-slate-300" size={21} />
                      )}
                    </div>

                    <div>
                      <p className="font-semibold">
                        {morador.nome || "Nome não informado"}
                        {eMeuPerfil && (
                          <span className="ml-2 text-xs text-blue-400">
                            Você
                          </span>
                        )}
                      </p>

                      <p className="text-sm text-slate-400">
                        Unidade: {morador.unidade || "Não informada"}
                      </p>

                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-1 text-xs ${
                          morador.role === "sindico"
                            ? "bg-yellow-900/40 text-yellow-300"
                            : morador.role === "subsindico"
                              ? "bg-blue-900/40 text-blue-300"
                              : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {formatarCargo(morador.role)}
                      </span>
                    </div>
                  </div>

                  {souSindico && !eMeuPerfil && !ePrestador &&
                    morador.role !== "sindico" && (
                    <div className="flex flex-wrap gap-2">
                      {morador.role === "morador" ? (
                        <button
                          disabled={!!loadingId}
                          onClick={() =>
                            alterarCargo(morador, "subsindico")
                          }
                          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
                        >
                          {carregando ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            "Nomear subsíndico"
                          )}
                        </button>
                      ) : (
                        <button
                          disabled={!!loadingId}
                          onClick={() =>
                            alterarCargo(morador, "morador")
                          }
                          className="rounded-lg border border-slate-500 px-3 py-2 text-sm hover:bg-slate-700 disabled:opacity-50"
                        >
                          {carregando ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            "Retirar subsíndico"
                          )}
                        </button>
                      )}

                      <button
                        disabled={!!loadingId}
                        onClick={() => transferirSindico(morador)}
                        className="rounded-lg border border-yellow-600 px-3 py-2 text-sm text-yellow-300 hover:bg-yellow-900/30 disabled:opacity-50"
                      >
                        Transferir sindicância
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {moradores.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                Nenhum cadastro encontrado.
              </div>
            )}
          </div>
        </div>

        {!souSindico && (
          <p className="mt-4 text-sm text-slate-400">
            Você possui acesso de consulta. Somente o síndico pode alterar os
            cargos administrativos.
          </p>
        )}

        <div className="mt-4 text-xs text-slate-500">
          {moradoresElegiveis.length} pessoas elegíveis para uma eventual
          transferência de sindicância.
        </div>
      </main>
    </div>
  );
}
