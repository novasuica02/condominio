"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, Wrench, ChevronDown, ChevronUp, UserCircle } from "lucide-react";

export default function TiposServicoPage() {
  const [tipos, setTipos] = useState<any[]>([]);
  const [prestadores, setPrestadores] = useState<any[]>([]);
  const [novo, setNovo] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<number | null>(null);
  const [novoSub, setNovoSub] = useState("");

  const carregar = async () => {
    const supabase = createClient();
    const { data: tiposData } = await supabase.from("tipos_servico").select("*, sub_servicos(*, prestadores(nome))").order("nome");
    const { data: prestData } = await supabase.from("prestadores").select("*").order("nome");
    
    if (tiposData) setTipos(tiposData);
    if (prestData) setPrestadores(prestData);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const handleCriarTipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novo.trim()) return;
    const supabase = createClient();
    await supabase.from("tipos_servico").insert([{ nome: novo.trim() }]);
    setNovo("");
    carregar();
  };

  const handleCriarSub = async (tipoId: number) => {
    if (!novoSub.trim()) return;
    const supabase = createClient();
    await supabase.from("sub_servicos").insert([{ tipo_servico_id: tipoId, nome: novoSub.trim() }]);
    setNovoSub("");
    carregar();
  };

  const handleDeletarTipo = async (id: number) => {
    if (!confirm("Apagar este tipo e todos os seus sub-serviços?")) return;
    const supabase = createClient();
    await supabase.from("tipos_servico").delete().eq("id", id);
    carregar();
  };

  const handleDeletarSub = async (id: number) => {
    if (!confirm("Apagar este sub-serviço?")) return;
    const supabase = createClient();
    await supabase.from("sub_servicos").delete().eq("id", id);
    carregar();
  };

  const handleDefinirPrestadorSub = async (subId: number, prestadorId: string) => {
    const supabase = createClient();
    await supabase.from("sub_servicos")
      .update({ prestador_id: prestadorId ? Number(prestadorId) : null })
      .eq("id", subId);
    carregar();
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center p-6 md:p-12 bg-slate-900 min-h-screen">
      <div className="w-full max-w-2xl bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-700 shadow-lg">
        
        <div className="flex items-center gap-2 mb-6 border-b border-slate-700 pb-4">
          <Link href="/chamados">
            <Button variant="ghost" size="icon" className="-ml-2 text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-orange-400" /> Tipos e Prestadores Padrão
          </h1>
        </div>

        {/* FORMULÁRIO DE NOVO TIPO */}
        <form onSubmit={handleCriarTipo} className="flex gap-2 mb-6">
          <Input 
            placeholder="Novo Tipo (Ex: Hidráulica)" 
            value={novo} 
            onChange={(e) => setNovo(e.target.value)} 
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
          />
          <Button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white">
            <Plus className="w-4 h-4 mr-1" /> Adicionar Tipo
          </Button>
        </form>

        {loading ? <p className="text-center text-slate-400">Carregando...</p> : (
          <div className="flex flex-col gap-3">
            {tipos.map((t) => (
              <div key={t.id} className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800">
                {/* CABEÇALHO DO TIPO */}
                <div className="flex justify-between items-center p-4 bg-slate-900/50 border-b border-slate-700">
                  <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => setExpandido(expandido === t.id ? null : t.id)}>
                    {expandido === t.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    <span className="font-semibold text-white">{t.nome}</span>
                    <span className="text-xs text-slate-500">({t.sub_servicos?.length || 0} sub)</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeletarTipo(t.id)} className="text-red-400 hover:bg-red-900/30 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* ÁREA EXPANDIDA (SUB-SERVIÇOS) */}
                {expandido === t.id && (
                  <div className="p-4 flex flex-col gap-4 bg-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-300 mb-3">Sub-serviços e Responsáveis</h3>
                      
                      {t.sub_servicos && t.sub_servicos.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {t.sub_servicos.map((sub: any) => (
                            <div key={sub.id} className="bg-slate-900/50 p-3 rounded-md border border-slate-700 flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-white">{sub.nome}</span>
                                <Button variant="ghost" size="icon" onClick={() => handleDeletarSub(sub.id)} className="h-6 w-6 text-red-400 hover:text-red-300">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              
                              <div className="flex items-center gap-2 mt-1">
                                <UserCircle className="w-4 h-4 text-slate-500" />
                                <select 
                                  className="flex h-8 w-full rounded-md border border-slate-600 bg-slate-700 text-white px-2 py-1 text-xs"
                                  value={sub.prestador_id || ""}
                                  onChange={(e) => handleDefinirPrestadorSub(sub.id, e.target.value)}
                                >
                                  <option value="">Sem prestador padrão</option>
                                  {prestadores.map(p => (
                                    <option key={p.id} value={p.id}>{p.nome} - {p.especialidade}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 mb-2">Nenhum sub-serviço cadastrado.</p>
                      )}

                      {/* CAMPO PARA ADICIONAR NOVO SUB-SERVIÇO */}
                      <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700">
                        <Input 
                          placeholder="Adicionar novo sub-serviço..." 
                          value={novoSub} 
                          onChange={(e) => setNovoSub(e.target.value)}
                          className="h-9 text-sm bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCriarSub(t.id); } }}
                        />
                        <Button size="sm" onClick={() => handleCriarSub(t.id)} className="h-9 bg-slate-600 hover:bg-slate-500 text-white">
                          <Plus className="w-4 h-4 mr-1" /> Add
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {tipos.length === 0 && <p className="p-4 text-center text-slate-400">Nenhum tipo cadastrado.</p>}
          </div>
        )}
      </div>
    </div>
  );
}