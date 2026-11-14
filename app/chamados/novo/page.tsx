"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";

export default function NovoChamadoPage() {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [subId, setSubId] = useState("");
  const [tipos, setTipos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function carregar() {
      const supabase = createClient();
      const { data } = await supabase.from("tipos_servico").select("*, sub_servicos(*)").order("nome");
      if (data && data.length > 0) {
        setTipos(data);
        setTipoId(data[0].id.toString());
      }
    }
    carregar();
  }, []);

  // Encontra o tipo selecionado para listar os sub-serviços dele
  const tipoSelecionado = tipos.find(t => t.id.toString() === tipoId);
  const subServicos = tipoSelecionado?.sub_servicos || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("chamados").insert([{
      autor_id: user?.id,
      titulo,
      descricao,
      localizacao,
      tipo_servico_id: Number(tipoId),
      sub_servico_id: subId ? Number(subId) : null, // Salva o sub-serviço se escolhido
    }]);

    setLoading(false);
    window.location.href = "/chamados";
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center p-6 md:p-12 bg-slate-50/50 min-h-screen">
      <div className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b pb-4">
          <Link href="/chamados"><Button variant="ghost" size="icon" className="-ml-2"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <h1 className="text-xl font-bold text-slate-800">Abrir Chamado</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block text-slate-700">Tipo de Serviço</label>
            <select 
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" 
              value={tipoId} 
              onChange={(e) => {
                setTipoId(e.target.value);
                setSubId(""); // Reseta o sub-serviço ao trocar o tipo
              }} 
              required
            >
              {tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>

          {/* MOSTRA O SUB-SERVIÇO APENAS SE EXISTIR ALGUM CADASTRADO */}
          {subServicos.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-1 block text-slate-700">O que exatamente está acontecendo?</label>
              <select 
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" 
                value={subId} 
                onChange={(e) => setSubId(e.target.value)}
              >
                <option value="">Selecione (Opcional)</option>
                {subServicos.map((s: any) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1 block text-slate-700">Título do Problema</label>
            <Input required placeholder="Ex: Vazamento na pia da cozinha" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block text-slate-700">Descrição detalhada (Opcional)</label>
            <textarea className="flex min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block text-slate-700">Localização / Link do Google Maps</label>
            <Input placeholder="Ex: Bloco A, Ap 12. Ou link do Maps." value={localizacao} onChange={(e) => setLocalizacao(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="mt-2 bg-orange-600 hover:bg-orange-700 h-11">
            {loading ? "Enviando..." : <><Send className="w-4 h-4 mr-2" /> Abrir Chamado</>}
          </Button>
        </form>
      </div>
    </div>
  );
}