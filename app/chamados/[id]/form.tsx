"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Save, MessageSquarePlus, CheckCircle, Loader2 } from "lucide-react";

export default function GerenciarChamadoForm({ chamado, prestadores }: { chamado: any, prestadores: any[] }) {
  const [status, setStatus] = useState(chamado.status || "aberto");
  const [sla, setSla] = useState(chamado.sla || "");
  const [prestadorId, setPrestadorId] = useState(chamado.prestador_id ? String(chamado.prestador_id) : "");
  const [novoComentario, setNovoComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    setSucesso(false);

    const supabase = createClient();

    // 1. Atualiza o chamado
    const { error: updateError } = await supabase.from("chamados").update({
      status,
      sla: sla || null,
      prestador_id: prestadorId ? Number(prestadorId) : null,
    }).eq("id", chamado.id);

    if (updateError) {
      setErro("Erro ao atualizar: " + updateError.message);
      setLoading(false);
      return;
    }

    // 2. Salva o histórico
    if (novoComentario.trim() !== "") {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: histError } = await supabase.from("chamados_historico").insert([{
        chamado_id: chamado.id,
        autor_id: user?.id,
        texto: novoComentario
      }]);

      if (histError) {
        setErro("Erro ao salvar histórico: " + histError.message);
        setLoading(false);
        return;
      }
    }

    // 3. DISPARO DE E-MAIL (AQUI ESTÁ O PULO DO GATO)
    try {
      console.log("Iniciando disparo de e-mail...");
      
      const { data: autor } = await supabase.from("profiles").select("email").eq("id", chamado.autor_id).single();
      const { data: sindicos } = await supabase.from("profiles").select("email").eq("role", "sindico");
      
      const destinatarios = [];
      if (autor?.email) destinatarios.push(autor.email);
      sindicos?.forEach(s => { if (s.email) destinatarios.push(s.email); });

      if (destinatarios.length > 0 && novoComentario.trim() !== "") {
        const response = await fetch('/api/enviar-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: destinatarios,
            subject: `Atualização no Chamado: ${chamado.titulo}`,
            html: `<h2>Atualização de Chamado</h2>
                   <p><strong>Chamado:</strong> ${chamado.titulo}</p>
                   <p><strong>Nova Anotação:</strong> ${novoComentario}</p>
                   <p>Status atual: ${status}</p>`
          })
        });
        console.log("Resposta da API de e-mail:", response.status);
      }
    } catch (err) {
      console.error("Falha ao disparar e-mail:", err);
    }

    setLoading(false);
    setSucesso(true);
    
    setTimeout(() => {
      window.location.href = "/chamados";
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-5">
      {erro && (
        <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md border border-red-200">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block text-slate-300">Status</label>
            <select className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="aberto">Aberto</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="resolvido">Resolvido</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block text-slate-300">SLA (Data Limite)</label>
            <input 
              type="date" 
              className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm"
              value={sla} 
              onChange={(e) => setSla(e.target.value)} 
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block text-slate-300">Prestador Responsável</label>
          <select className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm" value={prestadorId} onChange={(e) => setPrestadorId(e.target.value)}>
            <option value="">Nenhum</option>
            {prestadores.map((p) => (
              <option key={p.id} value={p.id}>{p.nome} - {p.especialidade}</option>
            ))}
          </select>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
          <label className="text-sm font-bold mb-2 flex items-center gap-2 text-slate-200">
            <MessageSquarePlus className="w-4 h-4" /> Nova Anotação (Opcional)
          </label>
          <textarea 
            className="flex min-h-[80px] w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm placeholder:text-slate-400" 
            placeholder="Ex: Prestador agendou para amanhã às 14h..."
            value={novoComentario}
            onChange={(e) => setNovoComentario(e.target.value)}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || sucesso} 
          className={`w-full h-11 rounded-md flex items-center justify-center font-bold text-base transition-colors ${
            sucesso ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"
          }`}
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Salvando...</>
          ) : sucesso ? (
            <><CheckCircle className="w-5 h-5 mr-2" /> Salvo com Sucesso!</>
          ) : (
            <><Save className="w-5 h-5 mr-2" /> Salvar Alterações</>
          )}
        </button>
      </form>
    </div>
  );
}