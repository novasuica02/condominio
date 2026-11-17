
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Bell, Loader2, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Config = {
  id: number;
  evento: string;
  destinatario: string;
  ativo: boolean;
};

const eventos = [
  { id: "abertura", nome: "Abertura de chamado" },
  { id: "atualizacao", nome: "Movimentação do chamado" },
  { id: "troca_prestador", nome: "Troca de prestador" },
  { id: "em_analise", nome: "Prestador concluiu o atendimento" },
  { id: "resolvido", nome: "Chamado resolvido" },
  { id: "devolvido", nome: "Chamado devolvido para atendimento" },
];

const destinatarios = [
  { id: "sindico", nome: "Síndico" },
  { id: "subsindico", nome: "Subsíndico" },
  { id: "morador", nome: "Morador" },
  { id: "prestador", nome: "Prestador" },
];

export default function ConfiguracoesNotificacoesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    async function carregar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const { data: perfil } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!perfil || !["sindico", "subsindico"].includes(perfil.role)) {
        router.replace("/chamados");
        return;
      }

      const { data, error } = await supabase
        .from("config_notificacoes")
        .select("id, evento, destinatario, ativo")
        .order("evento")
        .order("destinatario");

      if (error) {
        setErro("Erro ao carregar configurações: " + error.message);
      } else {
        setConfigs(data || []);
      }

      setLoading(false);
    }

    carregar();
  }, [router]);

  async function alterar(config: Config) {
    const chave = `${config.evento}-${config.destinatario}`;

    setSalvando(chave);
    setErro("");
    setSucesso("");

    const novoValor = !config.ativo;

    const { error } = await supabase
      .from("config_notificacoes")
      .update({ ativo: novoValor })
      .eq("id", config.id);

    if (error) {
      setErro("Não foi possível salvar: " + error.message);
    } else {
      setConfigs((anteriores) =>
        anteriores.map((item) =>
          item.id === config.id ? { ...item, ativo: novoValor } : item
        )
      );

      setSucesso("Configuração atualizada com sucesso!");
    }

    setSalvando(null);
  }

  return (
    <div className="w-full min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">

        <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
          <Link href="/chamados">
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </Link>

          <Bell className="w-6 h-6 text-amber-400" />

          <div>
            <h1 className="text-xl font-bold text-white">
              Configurações de Notificações
            </h1>
            <p className="text-sm text-slate-400">
              Escolha quem recebe cada aviso por e-mail.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12 text-slate-300">
            <Loader2 className="animate-spin mr-2" />
            Carregando configurações...
          </div>
        ) : (
          <>
            {erro && (
              <div className="p-3 rounded-md bg-red-100 text-red-700 text-sm flex gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                {erro}
              </div>
            )}

            {sucesso && (
              <div className="p-3 rounded-md bg-green-100 text-green-700 text-sm flex gap-2">
                <CheckCircle className="w-5 h-5 shrink-0" />
                {sucesso}
              </div>
            )}

            {eventos.map((evento) => (
              <div
                key={evento.id}
                className="bg-slate-800 border border-slate-700 rounded-xl p-5"
              >
                <h2 className="font-bold text-white mb-4">
                  {evento.nome}
                </h2>

                <div className="flex flex-col gap-4">
                  {destinatarios.map((destinatario) => {
                    const config = configs.find(
                      (item) =>
                        item.evento === evento.id &&
                        item.destinatario === destinatario.id
                    );

                    if (!config) return null;

                    const chave = `${evento.id}-${destinatario.id}`;

                    return (
                      <label
                        key={chave}
                        className="flex items-center justify-between gap-3 text-slate-200 cursor-pointer"
                      >
                        <span>{destinatario.nome}</span>

                        <div className="flex items-center gap-3">
                          {salvando === chave && (
                            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                          )}

                          <input
                            type="checkbox"
                            checked={config.ativo}
                            disabled={salvando !== null}
                            onChange={() => alterar(config)}
                            className="w-5 h-5 accent-blue-500 cursor-pointer"
                          />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
