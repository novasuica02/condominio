"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, User, MessageCircle, MapPin } from "lucide-react";
import Header from "@/components/Header";

type Morador = {
  id: string;
  nome: string;
  unidade: string;
  telefone: string;
  link_google_maps: string;
  ponto_referencia: string;
  nome_para_recados: string;
  telefone_recados: string;
};

export default function MoradoresPage() {
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [moradorSelecionado, setMoradorSelecionado] = useState<Morador | null>(null);

  useEffect(() => {
    async function carregar() {
      const supabase = createClient();
      
      // FILTRO: Traz apenas moradores e síndicos (esconde prestadores)
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .in("role", ["morador", "sindico"]) 
        .order("nome", { ascending: true });
      
      if (data) setMoradores(data);
      setLoading(false);
    }
    carregar();
  }, []);

  const moradoresFiltrados = moradores.filter((m) => 
    m.nome?.toLowerCase().includes(busca.toLowerCase()) || 
    m.unidade?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="flex-1 w-full flex flex-col items-center p-4 md:p-12 bg-slate-900 min-h-screen">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        
        {/* HEADER REUTILIZÁVEL */}
        <Header />

        {/* TÍTULO */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <h1 className="text-3xl font-bold text-white">Moradores</h1>
        </div>

        {/* BUSCA */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Buscar por nome ou unidade..." 
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {/* LISTA */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400 animate-pulse">Carregando moradores...</div>
          ) : moradoresFiltrados.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Nenhum morador encontrado.</div>
          ) : (
            <div className="flex flex-col">
              {moradoresFiltrados.map((morador, index) => (
                <div 
                  key={morador.id} 
                  className={`flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors ${index !== moradoresFiltrados.length - 1 ? 'border-b border-slate-700' : ''}`}
                >
                  <div 
                    className="flex items-center gap-4 flex-1 cursor-pointer"
                    onClick={() => setMoradorSelecionado(morador)}
                  >
                    <div className="bg-slate-700 p-2 rounded-full text-slate-300">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{morador.nome || "Sem nome"}</h3>
                      <span className="text-sm text-slate-400">{morador.unidade}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-400 hidden md:block">
                      {morador.telefone}
                    </div>
                    
                    {morador.telefone && (
                      <a 
                        href={`https://wa.me/55${morador.telefone.replace(/\D/g, '')}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()} 
                        className="bg-green-900/50 hover:bg-green-800 text-green-400 px-3 py-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium border border-green-700/50"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE DETALHES */}
      {moradorSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-700">
            
            <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white">{moradorSelecionado.nome}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMoradorSelecionado(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unidade</span>
                <p className="text-white font-medium">{moradorSelecionado.unidade}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">WhatsApp</span>
                <p className="text-slate-300">{moradorSelecionado.telefone || "Não informado"}</p>
              </div>

              {(moradorSelecionado.nome_para_recados || moradorSelecionado.telefone_recados) && (
                <div className="bg-orange-900/20 p-3 rounded-lg border border-orange-700/50">
                  <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Contato de Recados</span>
                  <p className="text-orange-200 text-sm mt-1">
                    {moradorSelecionado.nome_para_recados} <br/>
                    {moradorSelecionado.telefone_recados}
                  </p>
                </div>
              )}

              {moradorSelecionado.ponto_referencia && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ponto de Referência</span>
                  <p className="text-slate-300 text-sm">{moradorSelecionado.ponto_referencia}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3">
              {moradorSelecionado.telefone && (
                <a 
                  href={`https://wa.me/55${moradorSelecionado.telefone.replace(/\D/g, '')}`} 
                  target="_blank" 
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-2 rounded-md transition-colors font-medium text-sm"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              )}
              {moradorSelecionado.link_google_maps && (
                <a 
                  href={moradorSelecionado.link_google_maps} 
                  target="_blank" 
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded-md transition-colors font-medium text-sm"
                >
                  <MapPin className="w-4 h-4" /> Maps
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}