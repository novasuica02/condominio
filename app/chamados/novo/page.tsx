"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, MapPin } from "lucide-react";

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
      const { data } = await supabase.from("tipos_servico").select("*, sub_servicos(*, prestador_id)").order("nome");
      if (data && data.length > 0) {
        setTipos(data);
        setTipoId(data[0].id.toString());
      }
    }
    carregar();
  }, []);

  const tipoSelecionado = tipos.find(t => t.id.toString() === tipoId);
  const subServicos = tipoSelecionado?.sub_servicos || [];
  const subSelecionado = subServicos.find((s: any) => s.id.toString() === subId);

  const handlePegarLocalizacao = () => {
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta geolocalização.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocalizacao(`https://www.google.com/maps?q=${latitude},${longitude}`);
      },
      (error) => {
        alert("Não foi possível obter a localização. Verifique se o GPS está ligado.");
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("Usuário não autenticado.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("chamados").insert([{
      autor_id: user.id,
      titulo,
      descricao,
      localizacao,
      tipo_servico_id: Number(tipoId),
      sub_servico_id: subId ? Number(subId) : null,
      prestador_id: subSelecionado?.prestador_id || null,
      status: subSelecionado?.prestador_id ? "em_andamento" : "aberto"
    }]);

    setLoading(false);
    
    if (error) {
      alert("Erro ao criar chamado: " + error.message);
    } else {
      window.location.href = "/chamados";
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center p-4 md:p-12 bg-slate-900 min-h-screen">
      <div className="w-full max-w-2xl bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-700 shadow-lg">
        
        <div className="flex items-center gap-2 mb-6 border-b border-slate-700 pb-4">
          <Link href="/chamados">
            <Button variant="ghost" size="icon" className="-ml-2 text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <h1 className="text-xl font-bold text-white">Abrir Chamado</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block text-slate-300">Tipo de Serviço</label>
            <select 
              className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm" 
              value={tipoId} 
              onChange={(e) => { setTipoId(e.target.value); setSubId(""); }} 
              required
            >
              {tipos.length === 0 && <option value="">Carregando...</option>}
              {tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>

          {subServicos.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-1 block text-slate-300">O que exatamente está acontecendo?</label>
              <select 
                className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm" 
                value={subId} 
                onChange={(e) => setSubId(e.target.value)}
              >
                <option value="">Selecione (Opcional)</option>
                {subServicos.map((s: any) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1 block text-slate-300">Título do Problema</label>
            <Input required placeholder="Ex: Vazamento na pia da cozinha" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block text-slate-300">Descrição detalhada (Opcional)</label>
            <textarea className="flex min-h-[100px] w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block text-slate-300">Localização</label>
            <div className="flex gap-2">
              <Input placeholder="Descreva o local ou cole o link do Maps" value={localizacao} onChange={(e) => setLocalizacao(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
              <button type="button" onClick={handlePegarLocalizacao} className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 rounded-md border border-slate-600 flex items-center justify-center" title="Pegar minha localização atual">
                <MapPin className="w-5 h-5" />
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="mt-4 bg-orange-600 hover:bg-orange-500 text-white h-11 text-base">
            {loading ? "Registrando..." : <><Send className="w-4 h-4 mr-2" /> Registrar Chamado</>}
          </Button>
        </form>
      </div>
    </div>
  );
}