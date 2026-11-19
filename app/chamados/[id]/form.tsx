

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Save,
  MessageSquarePlus,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Paperclip,
  X,
  FileText,
  Wrench,
  ThumbsUp,
  RotateCcw,
} from "lucide-react";

const MAX_ARQUIVOS = 5;
const MAX_TAMANHO = 10 * 1024 * 1024;

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function nomeSeguro(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

export default function GerenciarChamadoForm({
  chamado,
  role,
}: {
  chamado: any;
  role: string;
}) {
  const isSindico = role === "sindico" || role === "subsindico";
  const isPrestador = role === "prestador";
  const isMorador = role === "morador";

  const [status, setStatus] = useState(chamado.status || "aberto");

  const [novoComentario, setNovoComentario] = useState("");
  const [resolvido, setResolvido] = useState("sim");
  const [justificativa, setJustificativa] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [avisoEmail, setAvisoEmail] = useState<string | null>(null);

  const selecionarArquivos = (lista: FileList | null) => {
    if (!lista) return;

    const novosArquivos = Array.from(lista);

    if (arquivos.length + novosArquivos.length > MAX_ARQUIVOS) {
      setErro(`Você pode anexar no máximo ${MAX_ARQUIVOS} arquivos.`);
      return;
    }

    for (const arquivo of novosArquivos) {
      if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
        setErro(`Tipo de arquivo não permitido: ${arquivo.name}`);
        return;
      }

      if (arquivo.size > MAX_TAMANHO) {
        setErro(`O arquivo ${arquivo.name} ultrapassa o limite de 10 MB.`);
        return;
      }
    }

    setErro(null);
    setArquivos((anteriores) => [...anteriores, ...novosArquivos]);
  };

  const removerArquivo = (indice: number) => {
    setArquivos((anteriores) =>
      anteriores.filter((_, i) => i !== indice)
    );
  };

  const registrarHistorico = async (
    supabase: ReturnType<typeof createClient>,
    userId: string,
    texto: string
  ) => {
    const { data, error } = await supabase
      .from("chamados_historico")
      .insert({
        chamado_id: chamado.id,
        autor_id: userId,
        texto,
      })
      .select("id")
      .single();

    if (error) throw error;

    return data.id as number;
  };

  const enviarAnexos = async (
    supabase: ReturnType<typeof createClient>,
    userId: string,
    historicoId: number
  ) => {
    let enviados = 0;
    const falhas: string[] = [];

    for (const arquivo of arquivos) {
      const caminho =
        `${chamado.id}/${crypto.randomUUID()}-${nomeSeguro(arquivo.name)}`;

      const { error: uploadError } = await supabase.storage
        .from("chamados")
        .upload(caminho, arquivo, {
          contentType: arquivo.type,
          upsert: false,
        });

      if (uploadError) {
        falhas.push(`${arquivo.name}: ${uploadError.message}`);
        continue;
      }

      const { error: registroError } = await supabase
        .from("chamados_anexos")
        .insert({
          chamado_id: chamado.id,
          autor_id: userId,
          nome_arquivo: arquivo.name,
          caminho_arquivo: caminho,
          tipo_mime: arquivo.type,
          tamanho: arquivo.size,
          origem: "atualizacao",
          historico_id: historicoId,
        });

      if (registroError) {
        falhas.push(`${arquivo.name}: ${registroError.message}`);
        continue;
      }

      enviados++;
    }

    return { enviados, falhas };
  };

  const enviarEmail = async (
    evento: string,
    comentario: string,
    prestadorAnteriorId: string | null
  ) => {
    try {
      const response = await fetch("/api/enviar-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chamadoId: chamado.id,
          evento,
          comentario,
          prestadorAnteriorId: prestadorAnteriorId
            ? Number(prestadorAnteriorId)
            : null,
        }),
      });

      const resultado = await response.json().catch(() => null);

      if (!response.ok) {
        return (
          "As alterações foram salvas, mas o e-mail não foi enviado: " +
          (resultado?.erro || "Erro no serviço de e-mail.")
        );
      }

      return "";
    } catch (emailError) {
      console.error("Falha ao enviar notificação:", emailError);
      return "As alterações foram salvas, mas não foi possível conectar ao serviço de e-mail.";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setErro(null);
    setAvisoEmail(null);
    setSucesso(false);

    const supabase = createClient();
    let avisoAtual = "";

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Não foi possível identificar o usuário.");
      }

      let historicoId: number | null = null;
      let eventoEmail = "atualizacao";
      let comentarioEmail = "";

      // MORADOR
      if (isMorador) {
        const vaiAvaliar = chamado.status === "em_analise";

        const podeResponder =
          chamado.status !== "resolvido" &&
          (novoComentario.trim().length > 0 || arquivos.length > 0);

        if (!vaiAvaliar && !podeResponder) {
          throw new Error("Nenhuma alteração foi realizada.");
        }

        // Avaliação da resolução informada pelo prestador
        if (vaiAvaliar) {
          if (resolvido === "nao" && !justificativa.trim()) {
            throw new Error(
              "Informe o motivo pelo qual o problema não foi resolvido."
            );
          }

          const { error } = await supabase.rpc("morador_avalia_atendimento", {
            p_chamado_id: chamado.id,
            p_resolvido: resolvido === "sim",
            p_justificativa:
              resolvido === "nao" ? justificativa.trim() : null,
          });

          if (error) throw error;

          comentarioEmail =
            resolvido === "sim"
              ? "Morador confirmou a resolução do chamado."
              : `Morador devolveu o chamado para atendimento. Motivo: ${justificativa.trim()}`;
        }

        // Resposta do morador: sempre cria uma NOVA movimentação
        if (podeResponder) {
          const textoResposta = novoComentario.trim() ||
            "O morador anexou arquivos ao chamado.";

          historicoId = await registrarHistorico(
            supabase,
            user.id,
            textoResposta
          );

          comentarioEmail = comentarioEmail
            ? `${comentarioEmail}\n\nResposta do morador: ${textoResposta}`
            : textoResposta;
        }
      }

      // PRESTADOR
      if (isPrestador) {
        if (!novoComentario.trim()) {
          throw new Error("Descreva o atendimento realizado.");
        }

        const { data, error } = await supabase.rpc(
          "prestador_registra_atendimento",
          {
            p_chamado_id: chamado.id,
            p_resolvido: resolvido === "sim",
            p_relato: novoComentario.trim(),
            p_novo_sla: null,
          }
        );

        if (error) throw error;

        historicoId = Number(data);
        comentarioEmail = novoComentario.trim();
      }

      // SÍNDICO / SUBSÍNDICO
      if (isSindico) {
        const statusFoiAlterado = status !== chamado.status;
        const houveAlteracao = statusFoiAlterado;

        if (
          !houveAlteracao &&
          !novoComentario.trim() &&
          arquivos.length === 0
        ) {
          throw new Error("Nenhuma alteração foi realizada.");
        }

        if (houveAlteracao) {
          const { error } = await supabase
            .from("chamados")
            .update({ status })
            .eq("id", chamado.id);

          if (error) throw error;
        }

        if (novoComentario.trim() || arquivos.length > 0) {
          const texto = novoComentario.trim() ||
            "Arquivos anexados à movimentação do chamado.";

          historicoId = await registrarHistorico(
            supabase,
            user.id,
            texto
          );

          comentarioEmail = texto;
        }

      }

      // Anexos vinculados à movimentação criada nesta operação
      if (arquivos.length > 0) {
        if (!historicoId) {
          throw new Error(
            "Não foi possível identificar a movimentação para vincular os anexos."
          );
        }

        const resultado = await enviarAnexos(
          supabase,
          user.id,
          historicoId
        );

        if (resultado.falhas.length > 0) {
          avisoAtual =
            `${resultado.enviados} anexo(s) enviado(s). Alguns arquivos não puderam ser registrados: ` +
            resultado.falhas.join("; ");
        }
      }

      // Notificação por e-mail
      const aviso = await enviarEmail(eventoEmail, comentarioEmail, null);

      if (aviso) {
        avisoAtual += (avisoAtual ? " " : "") + aviso;
      }

      setAvisoEmail(avisoAtual || null);
      setSucesso(true);

      setTimeout(() => {
        window.location.href = "/chamados";
      }, 3000);
    } catch (error: any) {
      console.error("Erro ao atualizar chamado:", error);
      setErro(error?.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const podeRegistrarAtendimento =
    isPrestador &&
    chamado.status !== "resolvido" &&
    chamado.status !== "em_analise";

  const podeAvaliar =
    isMorador && chamado.status === "em_analise";

  const podeAdministrar = isSindico;

  const podeMoradorResponder =
    isMorador && chamado.status !== "resolvido";

  const podeMoradorEnviar =
    podeMoradorResponder &&
    (novoComentario.trim().length > 0 || arquivos.length > 0);

  const podeAnexar =
    isPrestador ||
    isSindico ||
    podeMoradorResponder;

  if (isPrestador && !podeRegistrarAtendimento) {
    return (
      <div className="rounded-lg border border-slate-600 bg-slate-900/50 p-4 text-sm text-slate-300">
        {chamado.status === "em_analise"
          ? "Este chamado está aguardando a avaliação do morador ou da gestão."
          : "Este chamado já foi resolvido. Não é possível registrar novo atendimento."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {erro && (
        <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md border border-red-200">
          {erro}
        </div>
      )}

      {avisoEmail && (
        <div className="p-3 bg-yellow-100 text-yellow-800 text-sm rounded-md border border-yellow-300 flex gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{avisoEmail}</span>
        </div>
      )}

      {sucesso && (
        <div className="p-3 bg-green-100 text-green-700 text-sm rounded-md border border-green-200">
          Operação realizada com sucesso!
          {avisoEmail
            ? " Verifique o aviso acima sobre notificações ou anexos."
            : " Notificações processadas."}
          <br />
          Redirecionando...
        </div>
      )}

      {isPrestador && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
          <h3 className="font-bold text-white mb-1">
            Registrar atendimento
          </h3>
          <p className="text-sm text-slate-300">
            Informe o que foi realizado e se o problema foi resolvido.
            Quando informar que resolveu, o chamado seguirá para análise do
            morador ou da gestão.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-28">
        {podeAdministrar && (
          <>
            <div>
              <label className="text-sm font-medium mb-1 block text-slate-300">
                Status
              </label>

              <select
                className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={loading || sucesso}
              >
                <option value="aberto">Aberto</option>
                <option value="em_andamento">Em andamento</option>
                <option value="em_analise">Em análise</option>
                <option value="resolvido">Resolvido</option>
              </select>
            </div>


          </>
        )}


        {podeRegistrarAtendimento && (
          <>
            <div>
              <label className="text-sm font-bold mb-2 block text-slate-200">
                O problema foi resolvido?
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setResolvido("sim")}
                  disabled={loading || sucesso}
                  className={`rounded-lg border p-3 text-sm font-bold flex items-center justify-center gap-2 ${
                    resolvido === "sim"
                      ? "bg-green-600 border-green-500 text-white"
                      : "bg-slate-700 border-slate-600 text-slate-300"
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Sim
                </button>

                <button
                  type="button"
                  onClick={() => setResolvido("nao")}
                  disabled={loading || sucesso}
                  className={`rounded-lg border p-3 text-sm font-bold flex items-center justify-center gap-2 ${
                    resolvido === "nao"
                      ? "bg-amber-600 border-amber-500 text-white"
                      : "bg-slate-700 border-slate-600 text-slate-300"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Não
                </button>
              </div>

              <p className="text-xs text-slate-400 mt-2">
                {resolvido === "sim"
                  ? "O chamado será encaminhado para análise do morador ou da gestão."
                  : "O chamado continuará Em andamento e ficará registrado o que ainda precisa ser feito."}
              </p>
            </div>
          </>
        )}

        {podeAvaliar && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col gap-4">
            <div>
              <h3 className="font-bold text-white">
                Avaliar atendimento
              </h3>
              <p className="text-sm text-slate-300 mt-1">
                O prestador informou que resolveu o problema. Você confirma?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setResolvido("sim")}
                disabled={loading || sucesso}
                className={`rounded-lg border p-3 text-sm font-bold flex items-center justify-center gap-2 ${
                  resolvido === "sim"
                    ? "bg-green-600 border-green-500 text-white"
                    : "bg-slate-700 border-slate-600 text-slate-300"
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                Confirmar
              </button>

              <button
                type="button"
                onClick={() => setResolvido("nao")}
                disabled={loading || sucesso}
                className={`rounded-lg border p-3 text-sm font-bold flex items-center justify-center gap-2 ${
                  resolvido === "nao"
                    ? "bg-amber-600 border-amber-500 text-white"
                    : "bg-slate-700 border-slate-600 text-slate-300"
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                Não resolveu
              </button>
            </div>

            {resolvido === "nao" && (
              <div>
                <label className="text-sm font-bold mb-2 block text-slate-200">
                  Por que o problema não foi resolvido?
                </label>

                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm placeholder:text-slate-400"
                  placeholder="Explique o que continua pendente..."
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  disabled={loading || sucesso}
                  required
                />
              </div>
            )}
          </div>
        )}

        {(podeMoradorResponder || isSindico || podeRegistrarAtendimento) && (
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="text-sm font-bold flex items-center gap-2 text-slate-200">
                <MessageSquarePlus className="w-4 h-4" />
                Comentários
              </div>

              {podeAnexar && (
                <label
                  htmlFor="anexos-chamado"
                  className={`inline-flex items-center gap-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-3 py-2 cursor-pointer ${
                    loading || sucesso || arquivos.length >= MAX_ARQUIVOS
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                >
                  <Paperclip className="w-4 h-4" />
                  Anexar (buscar arquivo)
                </label>
              )}
            </div>

            <textarea
              className="flex min-h-[110px] w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm placeholder:text-slate-400"
              placeholder={
                isPrestador
                  ? "Descreva o atendimento realizado e, se ainda não resolveu, o que falta fazer..."
                  : isMorador
                    ? "Escreva seu comentário..."
                    : "Registre um comentário sobre o chamado..."
              }
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
              disabled={loading || sucesso}
              required={isPrestador && podeRegistrarAtendimento}
            />

            <input
              id="anexos-chamado"
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              onChange={(e) => {
                selecionarArquivos(e.target.files);
                e.target.value = "";
              }}
              disabled={loading || sucesso || arquivos.length >= MAX_ARQUIVOS}
              className="hidden"
            />

            <p className="text-xs text-slate-400 mt-2">
              Até 5 arquivos, com limite de 10 MB cada. Formatos: JPG, PNG, PDF, DOC e DOCX.
            </p>

            {arquivos.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {arquivos.map((arquivo, indice) => (
                  <div
                    key={`${arquivo.name}-${indice}`}
                    className="flex items-center justify-between gap-2 bg-slate-800 border border-slate-600 rounded-md p-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="text-sm text-slate-200 truncate">
                        {arquivo.name}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">
                        {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removerArquivo(indice)}
                      disabled={loading || sucesso}
                      className="text-slate-400 hover:text-red-400 p-1"
                      title="Remover arquivo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(podeAdministrar ||
          podeRegistrarAtendimento ||
          podeAvaliar ||
          (isMorador && podeMoradorEnviar)) && (
          <div className="fixed bottom-5 right-5 z-50">
            <button
              type="submit"
              disabled={loading || sucesso}
              className={`h-12 rounded-full px-6 shadow-xl flex items-center justify-center font-bold text-sm transition-colors ${
                sucesso
                  ? "bg-green-600 text-white"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : sucesso ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Salvo com sucesso!
                </>
              ) : isPrestador ? (
                <>
                  <Wrench className="w-5 h-5 mr-2" />
                  Registrar atendimento
                </>
              ) : podeAvaliar ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Registrar avaliação
                </>
              ) : isMorador && podeMoradorEnviar ? (
                <>
                  <MessageSquarePlus className="w-5 h-5 mr-2" />
                  Enviar resposta
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Salvar alterações
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
