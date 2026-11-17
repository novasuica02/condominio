
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Save,
  MessageSquarePlus,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";

export default function GerenciarChamadoForm({
  chamado,
  prestadores,
}: {
  chamado: any;
  prestadores: any[];
}) {
  const [status, setStatus] = useState(chamado.status || "aberto");
  const [sla, setSla] = useState(chamado.sla || "");
  const [prestadorId, setPrestadorId] = useState(
    chamado.prestador_id ? String(chamado.prestador_id) : ""
  );
  const [novoComentario, setNovoComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [avisoEmail, setAvisoEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setErro(null);
    setAvisoEmail(null);
    setSucesso(false);

    const supabase = createClient();

    // Guarda os valores anteriores para identificar alterações
    const prestadorAnteriorId = chamado.prestador_id
      ? String(chamado.prestador_id)
      : "";

    const prestadorFoiAlterado = prestadorAnteriorId !== prestadorId;

    const statusFoiAlterado = status !== chamado.status;

    const slaAnterior = chamado.sla
      ? String(chamado.sla).slice(0, 10)
      : "";

    const slaFoiAlterado = (sla || "") !== slaAnterior;

    const houveAlteracao =
      prestadorFoiAlterado || statusFoiAlterado || slaFoiAlterado;

    try {
      // 1. Atualiza o chamado no banco
      const { error: updateError } = await supabase
        .from("chamados")
        .update({
          status,
          sla: sla || null,
          prestador_id: prestadorId ? Number(prestadorId) : null,
        })
        .eq("id", chamado.id);

      if (updateError) {
        setErro("Erro ao atualizar: " + updateError.message);
        return;
      }

      // 2. Salva o comentário no histórico, se houver
      let comentarioSalvo = false;

      if (novoComentario.trim() !== "") {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setErro("Não foi possível identificar o usuário.");
          return;
        }

        const { error: histError } = await supabase
          .from("chamados_historico")
          .insert([
            {
              chamado_id: chamado.id,
              autor_id: user.id,
              texto: novoComentario.trim(),
            },
          ]);

        if (histError) {
          setAvisoEmail(
            "As alterações foram salvas, mas o comentário não foi registrado no histórico: " +
              histError.message
          );
        } else {
          comentarioSalvo = true;
        }
      }

      // 3. Identifica se precisa enviar notificação
      const deveNotificar = houveAlteracao || comentarioSalvo;

      if (deveNotificar) {
        try {
          // Se havia prestador e ele foi substituído ou removido,
          // envia o evento específico de troca.
          // Se antes não havia prestador, utiliza atualização.
          const evento =
            prestadorFoiAlterado && prestadorAnteriorId
              ? "troca_prestador"
              : "atualizacao";

          const response = await fetch("/api/enviar-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              chamadoId: chamado.id,
              evento,
              comentario: comentarioSalvo ? novoComentario.trim() : "",
              prestadorAnteriorId:
                evento === "troca_prestador"
                  ? Number(prestadorAnteriorId)
                  : null,
            }),
          });

          const resultado = await response.json().catch(() => null);

          if (!response.ok) {
            setAvisoEmail(
              (avisoEmail ? avisoEmail + " " : "") +
                "As alterações foram salvas, mas o e-mail não foi enviado: " +
                (resultado?.erro || "Erro no serviço de e-mail.")
            );
          }
        } catch (emailError) {
          console.error("Falha ao enviar notificação:", emailError);

          setAvisoEmail(
            (avisoEmail ? avisoEmail + " " : "") +
              "As alterações foram salvas, mas não foi possível conectar ao serviço de e-mail."
          );
        }
      }

      // 4. Informa que o chamado foi salvo
      setSucesso(true);

      // Atualiza os valores de referência para evitar
      // comparar com os dados antigos nesta mesma tela.
      chamado.status = status;
      chamado.sla = sla || null;
      chamado.prestador_id = prestadorId ? Number(prestadorId) : null;

      setTimeout(() => {
        window.location.href = "/chamados";
      }, 3000);
    } catch (error) {
      console.error("Erro inesperado:", error);
      setErro("Ocorreu um erro inesperado ao salvar o chamado.");
    } finally {
      setLoading(false);
    }
  };

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
          Chamado atualizado com sucesso!
          {avisoEmail
            ? " Verifique o aviso acima sobre as notificações."
            : " Notificações processadas."}
          <br />
          Redirecionando...
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <option value="em_andamento">Em Andamento</option>
              <option value="resolvido">Resolvido</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block text-slate-300">
              SLA (Data Limite)
            </label>

            <input
              type="date"
              className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm"
              value={sla}
              onChange={(e) => setSla(e.target.value)}
              disabled={loading || sucesso}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block text-slate-300">
            Prestador Responsável
          </label>

          <select
            className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm"
            value={prestadorId}
            onChange={(e) => setPrestadorId(e.target.value)}
            disabled={loading || sucesso}
          >
            <option value="">Nenhum</option>

            {prestadores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} - {p.especialidade}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
          <label className="text-sm font-bold mb-2 flex items-center gap-2 text-slate-200">
            <MessageSquarePlus className="w-4 h-4" />
            Nova Anotação (Opcional)
          </label>

          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm placeholder:text-slate-400"
            placeholder="Ex: Prestador agendou para amanhã às 14h..."
            value={novoComentario}
            onChange={(e) => setNovoComentario(e.target.value)}
            disabled={loading || sucesso}
          />
        </div>

        <button
          type="submit"
          disabled={loading || sucesso}
          className={`w-full h-11 rounded-md flex items-center justify-center font-bold text-base transition-colors ${
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
              Salvo com Sucesso!
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Salvar Alterações
            </>
          )}
        </button>
      </form>
    </div>
  );
}
