
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Save,
  MessageSquarePlus,
  Bell,
  BellOff,
} from "lucide-react";

type Setor = {
  id: number;
  nome: string;
};

type Unidade = {
  id: number;
  nome: string;
};

type Distribuicao = "todos" | "setores" | "unidades";

export default function EditarAvisoForm({ aviso }: { aviso: any }) {
  const [titulo, setTitulo] = useState(aviso.titulo || "");
  const [corpo, setCorpo] = useState(aviso.corpo || "");
  const [arquivoOriginal, setArquivoOriginal] = useState<File | null>(null);

  const [textoAtualizacao, setTextoAtualizacao] = useState("");
  const [arquivoAtualizacao, setArquivoAtualizacao] = useState<File | null>(null);

  const [notificar, setNotificar] = useState(false);
  const [distribuicao, setDistribuicao] = useState<Distribuicao>("todos");

  const [setores, setSetores] = useState<Setor[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);

  const [setoresSelecionados, setSetoresSelecionados] = useState<number[]>([]);
  const [unidadesSelecionadas, setUnidadesSelecionadas] = useState<number[]>([]);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // CARREGAR SETORES E UNIDADES DO CONDOMÍNIO
  useEffect(() => {
    async function carregarDestinatarios() {
      const supabase = createClient();

      // Identifica o usuário autenticado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Erro ao identificar usuário:", userError);
        return;
      }

      // Busca o perfil do usuário autenticado
      const { data: perfil, error: perfilError } = await supabase
        .from("profiles")
        .select("condominio_id")
        .eq("id", user.id)
        .single();

      if (perfilError || !perfil?.condominio_id) {
        console.error("Erro ao carregar perfil:", perfilError);
        return;
      }

      const condominioId = perfil.condominio_id;

      // Busca setores e unidades ativos do condomínio
      const [setoresResult, unidadesResult] = await Promise.all([
        supabase
          .from("setores")
          .select("id, nome")
          .eq("condominio_id", condominioId)
          .eq("ativo", true)
          .order("nome"),

        supabase
          .from("unidades")
          .select("id, nome")
          .eq("condominio_id", condominioId)
          .eq("ativo", true)
          .order("nome"),
      ]);

      if (setoresResult.error) {
        console.error("Erro ao carregar setores:", setoresResult.error);
      } else {
        setSetores(setoresResult.data || []);
      }

      if (unidadesResult.error) {
        console.error("Erro ao carregar unidades:", unidadesResult.error);
      } else {
        setUnidades(unidadesResult.data || []);
      }
    }

    carregarDestinatarios();
  }, []);

  // SELEÇÃO DE SETORES
  const alternarSetor = (id: number) => {
    setSetoresSelecionados((atuais) =>
      atuais.includes(id)
        ? atuais.filter((item) => item !== id)
        : [...atuais, id]
    );
  };

  // SELEÇÃO DE UNIDADES
  const alternarUnidade = (id: number) => {
    setUnidadesSelecionadas((atuais) =>
      atuais.includes(id)
        ? atuais.filter((item) => item !== id)
        : [...atuais, id]
    );
  };

  // ENVIO DE ARQUIVOS
  const enviarArquivo = async (arquivo: File, identificador: string) => {
    const supabase = createClient();

    const extensao = arquivo.name.split(".").pop() || "arquivo";
    const nomeArquivo = `${Date.now()}-${identificador}.${extensao}`;

    const { error: uploadError } = await supabase.storage
      .from("documentos")
      .upload(nomeArquivo, arquivo);

    if (uploadError) {
      throw new Error(
        "Erro no envio do arquivo: " + uploadError.message
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("documentos")
      .getPublicUrl(nomeArquivo);

    return publicUrl;
  };

  // SALVAR ALTERAÇÕES
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setErro(null);

    try {
      if (
        notificar &&
        distribuicao === "setores" &&
        setoresSelecionados.length === 0
      ) {
        throw new Error("Selecione pelo menos um setor.");
      }

      if (
        notificar &&
        distribuicao === "unidades" &&
        unidadesSelecionadas.length === 0
      ) {
        throw new Error("Selecione pelo menos uma unidade.");
      }

      // Preserva o anexo original caso não seja substituído
      let originalArquivoUrl = aviso.arquivo_url || null;

      if (arquivoOriginal) {
        originalArquivoUrl = await enviarArquivo(
          arquivoOriginal,
          "original"
        );
      }

      // Envia eventual anexo da atualização
      let novoArquivoAtualizacaoUrl: string | null = null;

      if (arquivoAtualizacao) {
        novoArquivoAtualizacaoUrl = await enviarArquivo(
          arquivoAtualizacao,
          "atualizacao"
        );
      }

      const payload = {
        titulo,
        corpo,
        arquivo_url: originalArquivoUrl,
        texto_atualizacao: textoAtualizacao,
        arquivo_atualizacao_url: novoArquivoAtualizacaoUrl,
        notificar,
        distribuicao: {
          tipo: distribuicao,
          setor_ids:
            distribuicao === "setores" ? setoresSelecionados : [],
          unidade_ids:
            distribuicao === "unidades" ? unidadesSelecionadas : [],
        },
      };

      const resposta = await fetch(`/api/avisos/${aviso.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        if (resultado.aviso_salvo) {
          throw new Error(
            resultado.error ||
              "O aviso foi salvo, mas ocorreu um erro em uma etapa complementar. Verifique antes de tentar novamente."
          );
        }

        throw new Error(
          resultado.error || "Não foi possível salvar o aviso."
        );
      }

      const quantidade = resultado.notificacoes_criadas || 0;

      if (notificar && quantidade > 0) {
        alert(
          `Aviso atualizado com sucesso!\n\n${quantidade} notificação(ões) enviada(s) aos moradores.`
        );
      } else if (notificar && quantidade === 0) {
        alert(
          "Aviso atualizado com sucesso, mas nenhum morador foi encontrado para receber a notificação."
        );
      } else {
        alert("Aviso atualizado com sucesso!");
      }

      window.location.href = "/avisos";
    } catch (err: any) {
      setErro(err.message || "Ocorreu um erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {erro && (
        <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md border border-red-200">
          {erro}
        </div>
      )}

      {/* AVISO ORIGINAL */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col gap-4">
        <h2 className="text-sm font-bold text-slate-300">
          Editar Aviso Original
        </h2>

        <div>
          <label className="text-sm font-medium mb-1 block text-slate-400">
            Título
          </label>

          <Input
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block text-slate-400">
            Mensagem
          </label>

          <textarea
            required
            className="flex min-h-[100px] w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm"
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block text-slate-400">
            Substituir Anexo Original (Opcional)
          </label>

          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(e) =>
              setArquivoOriginal(e.target.files?.[0] || null)
            }
            className="flex w-full h-11 rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm file:border-0 file:bg-slate-600 file:text-white file:font-medium file:mr-4 file:px-4 file:py-1.5 file:rounded-md cursor-pointer"
          />
        </div>
      </div>

      {/* NOVA ATUALIZAÇÃO */}
      <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700/50 flex flex-col gap-4">
        <h2 className="text-sm font-bold text-blue-300 flex items-center gap-2">
          <MessageSquarePlus className="w-4 h-4" />
          Adicionar Nova Atualização (Opcional)
        </h2>

        <p className="text-xs text-slate-400">
          Esta atualização aparecerá com data e hora abaixo do aviso original.
        </p>

        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm placeholder:text-slate-400"
          placeholder="Escreva a nova informação aqui..."
          value={textoAtualizacao}
          onChange={(e) => setTextoAtualizacao(e.target.value)}
        />

        <div>
          <label className="text-sm font-medium mb-1 block text-slate-400">
            Anexar Novo Documento (Opcional)
          </label>

          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(e) =>
              setArquivoAtualizacao(e.target.files?.[0] || null)
            }
            className="flex w-full h-11 rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm file:border-0 file:bg-slate-600 file:text-white file:font-medium file:mr-4 file:px-4 file:py-1.5 file:rounded-md cursor-pointer"
          />
        </div>
      </div>

      {/* NOTIFICAÇÕES */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          {notificar ? (
            <Bell className="w-5 h-5 text-blue-400" />
          ) : (
            <BellOff className="w-5 h-5 text-slate-400" />
          )}

          <div className="flex-1">
            <h2 className="text-sm font-bold text-white">
              Notificar moradores sobre esta alteração?
            </h2>

            <p className="text-xs text-slate-400">
              Se desmarcado, o aviso será atualizado sem enviar notificações.
            </p>
          </div>

          <input
            type="checkbox"
            checked={notificar}
            onChange={(e) => setNotificar(e.target.checked)}
            className="w-5 h-5 accent-blue-600"
          />
        </div>

        {notificar && (
          <div className="border-t border-slate-700 pt-4 flex flex-col gap-4">
            <p className="text-sm font-medium text-slate-300">
              Quem deverá receber a notificação?
            </p>

            <div className="flex flex-col gap-3">
              {[
                { value: "todos", label: "Todos os moradores" },
                { value: "setores", label: "Setor(es)" },
                { value: "unidades", label: "Unidade(s)" },
              ].map((opcao) => (
                <label
                  key={opcao.value}
                  className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="distribuicao"
                    value={opcao.value}
                    checked={distribuicao === opcao.value}
                    onChange={() =>
                      setDistribuicao(opcao.value as Distribuicao)
                    }
                    className="accent-blue-600"
                  />

                  {opcao.label}
                </label>
              ))}
            </div>

            {/* SELEÇÃO DE SETORES */}
            {distribuicao === "setores" && (
              <div className="bg-slate-900 rounded-lg p-3 flex flex-col gap-2">
                <p className="text-xs font-semibold text-slate-400">
                  Selecione os setores:
                </p>

                {setores.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Nenhum setor ativo encontrado.
                  </p>
                ) : (
                  setores.map((setor) => (
                    <label
                      key={setor.id}
                      className="flex items-center gap-2 text-sm text-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={setoresSelecionados.includes(setor.id)}
                        onChange={() => alternarSetor(setor.id)}
                        className="accent-blue-600"
                      />

                      {setor.nome}
                    </label>
                  ))
                )}
              </div>
            )}

            {/* SELEÇÃO DE UNIDADES */}
            {distribuicao === "unidades" && (
              <div className="bg-slate-900 rounded-lg p-3 flex flex-col gap-2">
                <p className="text-xs font-semibold text-slate-400">
                  Selecione as unidades:
                </p>

                {unidades.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Nenhuma unidade ativa encontrada.
                  </p>
                ) : (
                  unidades.map((unidade) => (
                    <label
                      key={unidade.id}
                      className="flex items-center gap-2 text-sm text-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={unidadesSelecionadas.includes(unidade.id)}
                        onChange={() => alternarUnidade(unidade.id)}
                        className="accent-blue-600"
                      />

                      {unidade.nome}
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTÃO SALVAR */}
      <Button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-500 text-white h-11 mt-2"
      >
        {loading ? (
          "Salvando..."
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Salvar Alterações
          </>
        )}
      </Button>
    </form>
  );
}
