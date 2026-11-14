"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";

export default function GerenciarChamadoForm({ chamado, prestadores }: { chamado: any, prestadores: any[] }) {
  const [status, setStatus] = useState(chamado.status);
  const [sla, setSla] = useState(chamado.sla || "");
  const [prestadorId, setPrestadorId] = useState(chamado.prestador_id || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    await supabase.from("chamados").update({
      status,
      sla: sla || null,
      prestador_id: prestadorId ? Number(prestadorId) : null,
    }).eq("id", chamado.id);

    setLoading(false);
    window.location.href = "/chamados";
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium mb-1 block text-slate-700">Status</label>
        <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="aberto">Aberto</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="resolvido">Resolvido</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block text-slate-700">SLA (Data Limite)</label>
        <Input type="date" value={sla} onChange={(e) => setSla(e.target.value)} />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block text-slate-700">Prestador Responsável</label>
        <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={prestadorId} onChange={(e) => setPrestadorId(e.target.value)}>
          <option value="">Nenhum</option>
          {prestadores.map((p) => (
            <option key={p.id} value={p.id}>{p.nome} - {p.especialidade}</option>
          ))}
        </select>
      </div>

      <Button type="submit" disabled={loading} className="mt-4 bg-orange-600 hover:bg-orange-700">
        {loading ? "Salvando..." : <><Save className="w-4 h-4 mr-2" /> Salvar Alterações</>}
      </Button>
    </form>
  );
}