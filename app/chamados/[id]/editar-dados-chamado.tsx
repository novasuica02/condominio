"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Calendar, Check, Loader2, Wrench } from "lucide-react";

function formatarData(data: string | null) {
  if (!data) return "Não informado";
  const [ano, mes, dia] = String(data).slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function EditarDadosChamado({
  chamadoId,
  prestadorIdInicial,
  prestadorNomeInicial,
  slaInicial,
  prestadores,
  role,
}: {
  chamadoId: number;
  prestadorIdInicial: number | null;
  prestadorNomeInicial: string | null;
  slaInicial: string | null;
  prestadores: any[];
  role: string;
}) {
  const isGestao = role === "sindico" || role === "subsindico";
  const isMorador = role === "morador";
  const podeEditarPrazo = isGestao || isMorador;

  const [prestadorId, setPrestadorId] = useState(
    prestadorIdInicial ? String(prestadorIdInicial) : ""
  );
  const [sla, setSla] = useState(slaInicial ? String(slaInicial).slice(0, 10) : "");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const prestadorAtual = useMemo(
    () => prestadores.find((p) => String(p.id) === prestadorId),
    [prestadores, prestadorId]
  );
  const prestadorMudou = isGestao && prestadorId !== (prestadorIdInicial ? String(prestadorIdInicial) : "");
  const prazoMudou = podeEditarPrazo && sla !== (slaInicial ? String(slaInicial).slice(0, 10) : "");
  const houveAlteracao = prestadorMudou || prazoMudou;

  async function salvar() {
    if (!houveAlteracao || loading) return;
    setLoading(true);
    setErro("");
    setMensagem("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não foi possível identificar o usuário.");

      let comentario = "";
      let evento = "atualizacao";

      if (isMorador && prazoMudou) {
        const { error } = await supabase.rpc("morador_atualiza_sla", {
          p_chamado_id: chamadoId,
          p_novo_sla: sla || null,
        });
        if (error) throw error;
        comentario = `Morador atualizou o VCTO para ${sla ? formatarData(sla) : "não informado"}, conforme negociação com o prestador.`;
      }

      if (isGestao) {
        const atualizacao: Record<string, any> = {};
        if (prestadorMudou) atualizacao.prestador_id = prestadorId ? Number(prestadorId) : null;
        if (prazoMudou) atualizacao.sla = sla || null;

        const { error } = await supabase
          .from("chamados")
          .update(atualizacao)
          .eq("id", chamadoId);
        if (error) throw error;

        const nomeAnterior = prestadorNomeInicial || "Nenhum";
        const nomeNovo = prestadorAtual?.nome || "Nenhum";
        const partes: string[] = [];
        if (prestadorMudou) partes.push(`Prestador alterado de ${nomeAnterior} para ${nomeNovo}.`);
        if (prazoMudou) partes.push(`VCTO atualizado para ${sla ? formatarData(sla) : "não informado"}, conforme negociação com o prestador.`);
        comentario = partes.join(" ");
        if (prestadorMudou && prestadorIdInicial) evento = "troca_prestador";

        const { error: historicoError } = await supabase
          .from("chamados_historico")
          .insert({ chamado_id: chamadoId, autor_id: user.id, texto: comentario });
        if (historicoError) throw historicoError;
      }

      if (isMorador && prazoMudou) {
        const response = await fetch("/api/enviar-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chamadoId, evento, comentario }),
        });
        if (!response.ok) setMensagem("Prazo atualizado. Não foi possível enviar a notificação por e-mail.");
      }

      if (isGestao) {
        const response = await fetch("/api/enviar-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chamadoId,
            evento,
            comentario,
            prestadorAnteriorId: prestadorMudou && prestadorIdInicial ? prestadorIdInicial : null,
          }),
        });
        if (!response.ok) setMensagem("Alterações salvas. Não foi possível enviar a notificação por e-mail.");
      }

      if (!mensagem) setMensagem("Alterações salvas com sucesso.");
      window.location.reload();
    } catch (e: any) {
      setErro(e?.message || "Não foi possível salvar as alterações.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-amber-200">
        <Wrench className="h-4 w-4 shrink-0 text-amber-400" />
        <strong>Prestador:</strong>
        {isGestao ? (
          <select
            value={prestadorId}
            onChange={(e) => setPrestadorId(e.target.value)}
            disabled={loading}
            aria-label="Alterar prestador responsável"
            className="max-w-[220px] min-w-[130px] rounded-md border border-slate-600 bg-slate-700 px-2 py-1 text-sm text-white"
          >
            <option value="">Nenhum</option>
            {prestadores.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}{p.especialidade ? ` - ${p.especialidade}` : ""}</option>
            ))}
          </select>
        ) : (
          <span className="text-white">{prestadorNomeInicial || "Não definido"}</span>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-amber-200">
        <Calendar className="h-4 w-4 shrink-0 text-amber-400" />
        <strong>VCTO:</strong>
        {podeEditarPrazo ? (
          <input
            type="date"
            value={sla}
            onChange={(e) => setSla(e.target.value)}
            disabled={loading}
            aria-label="Data de vencimento negociada"
            className="rounded-md border border-slate-600 bg-slate-700 px-2 py-1 text-sm text-white"
          />
        ) : (
          <span className="text-white">{formatarData(sla)}</span>
        )}
      </div>

      {houveAlteracao && (
        <button
          type="button"
          onClick={salvar}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Salvar
        </button>
      )}

      {(erro || mensagem) && (
        <p className={`w-full text-xs ${erro ? "text-red-300" : "text-green-300"}`}>
          {erro || mensagem}
        </p>
      )}
    </div>
  );
}
