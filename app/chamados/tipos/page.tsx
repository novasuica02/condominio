"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, Wrench, ChevronDown, ChevronUp } from "lucide-react";

export default function TiposServicoPage() {
  const [tipos, setTipos] = useState<any[]>([]);
  const [novo, setNovo] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<number | null>(null);
  const [novoSub, setNovoSub] = useState("");

  const carregar = async () => {
    const supabase = createClient();
    // Busca os tipos e já traz os sub-serviços relacionados
    const { data } = await supabase.from("tipos_servico").select("*, sub_servicos(*)").order("nome");
    if (data) setTipos(data);
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

  return (
    <div className="flex-1 w-full flex flex-col items-center p-6 md:p-12 bg-slate-50/50 min-h-screen">
      <div className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b pb-4">
          <Link href="/chamados">
            <Button variant="ghost" size="icon" className="-ml-2"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-orange-500" /> Tipos e Sub-serviços
          </h1>
        </div>

        <form onSubmit={handleCriarTipo} className="flex gap-2 mb-6">
          <Input placeholder="Novo Tipo (Ex: Hidráulica)" value={novo} onChange={(e) => setNovo(e.target.value)} />
          <Button type="submit" className="bg-orange-600 hover:bg-orange-700"><Plus className="w-4 h-4 mr-1" /> Adicionar Tipo</Button>
        </form>

        {loading ? <p className="text-center text-slate-500">Carregando...</p> : (
          <div className="flex flex-col gap-3">
            {tipos.map((t) => (
              <div key={t.id} className="border rounded-lg overflow-hidden">
                {/* Linha do Tipo */}
                <div className="flex justify-between items-center p-3 bg-slate-50">
                  <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => setExpandido(expandido === t.id ? null : t.id)}>
                    {expandido === t.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    <span className="font-semibold text-slate-800">{t.nome}</span>
                    <span className="text-xs text-slate-400">({t.sub_servicos.length} sub)</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeletarTipo(t.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Área Expandida (Sub-serviços) */}
                {expandido === t.id && (
                  <div className="p-4 border-t bg-white flex flex-col gap-3">
                    {t.sub_servicos.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {t.sub_servicos.map((sub: any) => (
                          <div key={sub.id} className="flex justify-between items-center text-sm bg-slate-50 px-3 py-1.5 rounded-md border">
                            <span className="text-slate-700">{sub.nome}</span>
                            <Button variant="ghost" size="icon" onClick={() => handleDeletarSub(sub.id)} className="h-6 w-6 text-red-400 hover:text-red-600">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">Nenhum sub-serviço cadastrado.</p>
                    )}

                    <div className="flex gap-2 mt-2">
                      <Input 
                        placeholder="Adicionar sub-serviço..." 
                        value={novoSub} 
                        onChange={(e) => setNovoSub(e.target.value)}
                        className="h-9 text-sm"
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCriarSub(t.id); } }}
                      />
                      <Button size="sm" onClick={() => handleCriarSub(t.id)} className="h-9 bg-slate-800 hover:bg-slate-700">
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {tipos.length === 0 && <p className="p-4 text-center text-slate-500">Nenhum tipo cadastrado.</p>}
          </div>
        )}
      </div>
    </div>
  );
}