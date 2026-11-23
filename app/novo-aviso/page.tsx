
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Send,
  Paperclip,
  AlertTriangle,
  Users,
  Building2,
  Home,
  Layers,
  Bell,
  BellOff,
  Megaphone,
  X,
} from "lucide-react";

type Torre = {
  id: number;
  nome: string;
};

type Setor = {
  id: number;
  nome: string;
};

type Unidade = {
  id: number;
  nome: string | null;
  numero: string | null;
};

type Distribuicao = "todos" | "selecionados" | "nenhum";

export default function NovoAvisoPage() {
  const router = useRouter();
  const supabase = createClient();

  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);

  const [torres, setTorres] = useState<Torre[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);

  const [torreIds, setTorreIds] = useState<number[]>([]);
  const [setorIds, setSetorIds] = useState<number[]>([]);
  const [unidadeIds, setUnidadeIds] = useState<number[]>([]);

  const [distribuicao, setDistribuicao] =
    useState<Distribuicao>("todos");

  const [prioridade, setPrioridade] =
    useState<"normal" | "urgente">("normal");

  const [carregando, setCarregando] = useState(false);
  const [carregandoCatalogos, setCarregandoCatalogos] =
    useState(true);

  useEffect(() => {
    async function carregarCatalogos() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("condominio_id")
          .eq("id", user.id)
          .single();

        if (profileError || !profile?.condominio_id) {
          throw new Error("Não foi possível identificar o condomínio.");
        }

        const condominioId = profile.condominio_id;

        const [torresResult, setoresResult, unidadesResult] =
          await Promise.all([
            supabase
              .from("torres")
              .select("id, nome")
              .eq("condominio_id", condominioId)
              .eq("ativo", true)
              .order("nome"),

            supabase
              .from("setores")
              .select("id, nome")
              .eq("condominio_id", condominioId)
              .eq("ativo", true)
              .order("nome"),

            supabase
              .from("unidades")
              .select("id, nome, numero")
              .eq("condominio_id", condominioId)
              .eq("ativo", true)
              .order("nome"),
          ]);

        if (torresResult.error) throw torresResult.error;
        if (setoresResult.error) throw setoresResult.error;
        if (unidadesResult.error) throw unidadesResult.error;

        setTorres(torresResult.data || []);
        setSetores(setoresResult.data || []);
        setUnidades(unidadesResult.data || []);
      } catch (error) {
        console.error("Erro ao carregar destinatários:", error);
        alert("Não foi possível carregar os destinatários.");
      } finally {
        setCarregandoCatalogos(false);
      }
    }

    carregarCatalogos();
  }, [router]);

  function alternarSelecao(
    id: number,
    lista: number[],
    atualizar: (ids: number[]) => void
  ) {
    atualizar(
      lista.includes(id)
        ? lista.filter((item) => item !== id)
        : [...lista, id]
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!titulo.trim() || !corpo.trim()) {
      alert("Preencha o título e o conteúdo do aviso.");
      return;
    }

    if (
      distribuicao === "selecionados" &&
      torreIds.length === 0 &&
      setorIds.length === 0 &&
      unidadeIds.length === 0
    ) {
      alert("Selecione pelo menos uma torre, setor ou unidade.");
      return;
    }

    setCarregando(true);

    let arquivoUrl: string | null = null;
    let caminhoArquivo: string | null = null;

    try {
      if (arquivo) {
        const extensao = arquivo.name.split(".").pop() || "arquivo";

        caminhoArquivo = `${Date.now()}-${crypto.randomUUID()}.${extensao}`;

        const { error: uploadError } = await supabase.storage
          .from("documentos")
          .upload(caminhoArquivo, arquivo);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("documentos")
          .getPublicUrl(caminhoArquivo);

        arquivoUrl = data.publicUrl;
      }

      const response = await fetch("/api/avisos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo: titulo.trim(),
          corpo: corpo.trim(),
          arquivo_url: arquivoUrl,
          prioridade,
          distribuicao: {
            tipo: distribuicao,
            torre_ids: torreIds,
            setor_ids: setorIds,
            unidade_ids: unidadeIds,
          },
        }),
      });

      const resultado = await response.json();

      if (!response.ok) {
        throw new Error(resultado.error || "Erro ao publicar o aviso.");
      }

      alert(
        resultado.notificacoes > 0
          ? `Aviso publicado! ${resultado.notificacoes} notificação(ões) criada(s).`
          : "Aviso publicado com sucesso!"
      );

      router.push("/avisos");
      router.refresh();
    } catch (error) {
      console.error("Erro ao publicar aviso:", error);

      if (caminhoArquivo) {
        await supabase.storage
          .from("documentos")
          .remove([caminhoArquivo]);
      }

      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível publicar o aviso."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex-1 w-full min-h-screen bg-slate-900">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 p-4 md:p-12">

        {/* Cabeçalho padrão do aplicativo */}
        <Header />

        {/* Título da página */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <Megaphone className="w-8 h-8 text-blue-500" />
              Novo Aviso
            </h1>
            <p className="text-slate-400 mt-2">
              Publique um comunicado no mural do condomínio.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/avisos")}
            className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Conteúdo do aviso */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-white mb-5">
              Conteúdo do comunicado
            </h2>

            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Título do aviso *
                </label>
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Digite o título do aviso"
                  required
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Mensagem *
                </label>
                <textarea
                  value={corpo}
                  onChange={(e) => setCorpo(e.target.value)}
                  placeholder="Escreva aqui o comunicado..."
                  required
                  rows={7}
                  className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Anexo (opcional)
                </label>

                <div className="flex flex-col gap-3">
                  <label className="flex items-center justify-center gap-2 border border-dashed border-slate-600 rounded-lg p-4 cursor-pointer hover:bg-slate-700/50 transition-colors text-slate-300">
                    <Paperclip className="w-5 h-5 text-blue-400" />
                    <span className="text-sm">
                      Selecionar arquivo
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        setArquivo(e.target.files?.[0] || null)
                      }
                    />
                  </label>

                  {arquivo && (
                    <div className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="text-sm text-slate-300 truncate">
                          {arquivo.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setArquivo(null)}
                        className="text-slate-400 hover:text-red-400 p-1"
                        aria-label="Remover anexo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Distribuição das notificações */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Bell className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">
                Envio de notificações
              </h2>
            </div>

            <p className="text-sm text-slate-400 mb-5">
              Escolha quem receberá uma notificação sobre este aviso.
            </p>

            <div className="flex flex-col gap-3">

              <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                distribuicao === "todos"
                  ? "border-blue-500 bg-blue-900/20"
                  : "border-slate-700 bg-slate-900/50 hover:bg-slate-700/50"
              }`}>
                <input
                  type="radio"
                  name="distribuicao"
                  checked={distribuicao === "todos"}
                  onChange={() => setDistribuicao("todos")}
                  className="mt-1 accent-blue-500"
                />
                <Users className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                  <span className="font-semibold text-white block">
                    Todos os moradores
                  </span>
                  <span className="text-sm text-slate-400">
                    Envia para todos, inclusive moradores sem unidade cadastrada.
                  </span>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                distribuicao === "selecionados"
                  ? "border-blue-500 bg-blue-900/20"
                  : "border-slate-700 bg-slate-900/50 hover:bg-slate-700/50"
              }`}>
                <input
                  type="radio"
                  name="distribuicao"
                  checked={distribuicao === "selecionados"}
                  onChange={() => setDistribuicao("selecionados")}
                  className="mt-1 accent-blue-500"
                />
                <Building2 className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                  <span className="font-semibold text-white block">
                    Selecionar destinatários
                  </span>
                  <span className="text-sm text-slate-400">
                    Escolha torres, setores e/ou unidades. As seleções podem ser combinadas.
                  </span>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                distribuicao === "nenhum"
                  ? "border-blue-500 bg-blue-900/20"
                  : "border-slate-700 bg-slate-900/50 hover:bg-slate-700/50"
              }`}>
                <input
                  type="radio"
                  name="distribuicao"
                  checked={distribuicao === "nenhum"}
                  onChange={() => setDistribuicao("nenhum")}
                  className="mt-1 accent-blue-500"
                />
                <BellOff className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <span className="font-semibold text-white block">
                    Não enviar notificações
                  </span>
                  <span className="text-sm text-slate-400">
                    Publica somente no mural, sem criar notificações individuais.
                  </span>
                </div>
              </label>
            </div>

            {distribuicao === "selecionados" && (
              <div className="mt-6 flex flex-col gap-5 border-t border-slate-700 pt-5">

                {carregandoCatalogos ? (
                  <p className="text-slate-400 text-sm">
                    Carregando torres, setores e unidades...
                  </p>
                ) : (
                  <>
                    {torres.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                          <Building2 className="w-4 h-4 text-blue-400" />
                          Torres
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {torres.map((torre) => (
                            <label
                              key={torre.id}
                              className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer hover:border-blue-500"
                            >
                              <input
                                type="checkbox"
                                checked={torreIds.includes(torre.id)}
                                onChange={() =>
                                  alternarSelecao(
                                    torre.id,
                                    torreIds,
                                    setTorreIds
                                  )
                                }
                                className="accent-blue-500"
                              />
                              <span className="text-sm text-slate-200">
                                {torre.nome}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {setores.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                          <Layers className="w-4 h-4 text-blue-400" />
                          Setores
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {setores.map((setor) => (
                            <label
                              key={setor.id}
                              className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer hover:border-blue-500"
                            >
                              <input
                                type="checkbox"
                                checked={setorIds.includes(setor.id)}
                                onChange={() =>
                                  alternarSelecao(
                                    setor.id,
                                    setorIds,
                                    setSetorIds
                                  )
                                }
                                className="accent-blue-500"
                              />
                              <span className="text-sm text-slate-200">
                                {setor.nome}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {unidades.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                          <Home className="w-4 h-4 text-blue-400" />
                          Unidades
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {unidades.map((unidade) => (
                            <label
                              key={unidade.id}
                              className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer hover:border-blue-500"
                            >
                              <input
                                type="checkbox"
                                checked={unidadeIds.includes(unidade.id)}
                                onChange={() =>
                                  alternarSelecao(
                                    unidade.id,
                                    unidadeIds,
                                    setUnidadeIds
                                  )
                                }
                                className="accent-blue-500"
                              />
                              <span className="text-sm text-slate-200">
                                Unidade {unidade.nome || unidade.numero}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {torres.length === 0 &&
                      setores.length === 0 &&
                      unidades.length === 0 && (
                        <p className="text-sm text-amber-400">
                          Não existem torres, setores ou unidades ativos cadastrados.
                        </p>
                      )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Prioridade */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-white mb-2">
              Importância do aviso
            </h2>

            <p className="text-sm text-slate-400 mb-5">
              Defina como a notificação aparecerá para os moradores.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPrioridade("normal")}
                className={`flex items-center gap-3 p-4 rounded-lg border text-left transition-colors ${
                  prioridade === "normal"
                    ? "border-blue-500 bg-blue-900/20"
                    : "border-slate-700 bg-slate-900 hover:bg-slate-700"
                }`}
              >
                <Bell className="w-5 h-5 text-blue-400" />
                <div>
                  <span className="block font-semibold text-white">
                    Normal
                  </span>
                  <span className="text-xs text-slate-400">
                    Comunicado habitual
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPrioridade("urgente")}
                className={`flex items-center gap-3 p-4 rounded-lg border text-left transition-colors ${
                  prioridade === "urgente"
                    ? "border-red-500 bg-red-900/20"
                    : "border-slate-700 bg-slate-900 hover:bg-slate-700"
                }`}
              >
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div>
                  <span className="block font-semibold text-white">
                    Urgente
                  </span>
                  <span className="text-xs text-slate-400">
                    Destaca a notificação
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Botão de publicação */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/avisos")}
              disabled={carregando}
              className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={carregando || carregandoCatalogos}
              className="bg-blue-600 hover:bg-blue-500 text-white min-w-[180px]"
            >
              <Send className="w-4 h-4 mr-2" />
              {carregando ? "Publicando..." : "Publicar Aviso"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
