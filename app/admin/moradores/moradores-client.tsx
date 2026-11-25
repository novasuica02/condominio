
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import {
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
      <div className="w-full flex flex-col items-center px-4 pt-2 pb-0 md:px-12 md:pt-4 md:pb-0">
        <div className="w-full max-w-4xl">
          <Header
            showBackButton={true}
            backUrl="/admin"
            backText="Voltar"
          />
        </div>
      </div>

      <main className="flex-1 w-full flex flex-col items-center px-4 pt-0 pb-4 md:px-12 md:pt-0 md:pb-12 bg-slate-900 min-h-screen">
        <div className="w-full max-w-4xl flex flex-col gap-3 text-white">

          {/* Cabeçalho e resumo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                <Users size={20} />
              </div>

              <div className="min-w-0">
                <h1 className="text-xl font-bold text-white leading-tight">
                  Gestão de Moradores
                </h1>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400">
                  <span>
                    Total: <strong className="text-white">{moradores.length}</strong>
                  </span>
                  <span>
                    Síndico: <strong className="text-yellow-300">{moradores.filter((m) => m.role === "sindico").length}</strong>
                  </span>
                  <span>
                    Subsíndicos: <strong className="text-blue-300">{moradores.filter((m) => m.role === "subsindico").length}</strong>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={recarregar}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-xs hover:bg-slate-700 shrink-0"
            >
              <RefreshCw size={15} />
              Atualizar
            </button>
          </div>

          {/* Mensagens */}
          {mensagem && (
            <div className="rounded-lg border border-green-700 bg-green-900/30 p-3 text-sm text-green-300">
              {mensagem}
            </div>
          )}

          {erro && (
            <div className="rounded-lg border border-red-700 bg-red-900/30 p-3 text-sm text-red-300">
              {erro}
            </div>
          )}

          {/* Lista de moradores */}
          <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
            <div className="border-b border-slate-700 px-3 py-2">
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
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700">
                        {morador.role === "sindico" ? (
                          <Crown className="text-yellow-400" size={18} />
                        ) : morador.role === "subsindico" ? (
                          <ShieldCheck className="text-blue-400" size={18} />
                        ) : (
                          <User className="text-slate-300" size={18} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm leading-tight truncate">
                          {morador.nome || "Nome não informado"}
                          {eMeuPerfil && (
                            <span className="ml-2 text-xs text-blue-400">
                              Você
                            </span>
                          )}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400">
                            Unidade: {morador.unidade || "Não informada"}
                          </span>

                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] ${
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
                    </div>

                    {souSindico &&
                      !eMeuPerfil &&
                      !ePrestador &&
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
            <p className="mt-1 text-sm text-slate-400">
              Você possui acesso de consulta. Somente o síndico pode alterar os
              cargos administrativos.
            </p>
          )}

          <div className="mt-1 text-xs text-slate-500">
            {moradoresElegiveis.length} pessoas elegíveis para uma eventual
            transferência de sindicância.
          </div>
        </div>
      </main>
    </div>
  );
}
