"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, MessageCircle, User, Search, X } from "lucide-react";

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

export default function ListaMoradores() {
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [moradorSelecionado, setMoradorSelecionado] = useState<Morador | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function carregarMoradores() {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("nome", { ascending: true });
      
      if (data) setMoradores(data);
      setLoading(false);
    }
    carregarMoradores();
  }, [supabase]);

  const moradoresFiltrados = moradores.filter((m) => 
    m.nome?.toLowerCase().includes(busca.toLowerCase()) || 
    m.unidade?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Buscar por nome ou unidade..." 
          className="pl-9 bg-white"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse">Carregando moradores...</div>
        ) : moradoresFiltrados.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhum morador encontrado.</div>
        ) : (
          <div className="flex flex-col">
            {moradoresFiltrados.map((morador, index) => (
              <div 
                key={morador.id} 
                className={`flex items-center justify-between p-4 hover:bg-slate-50 transition-colors ${index !== moradoresFiltrados.length - 1 ? 'border-b' : ''}`}
              >
                <div 
                  className="flex items-center gap-4 flex-1 cursor-pointer"
                  onClick={() => setMoradorSelecionado(morador)}
                >
                  <div className="bg-slate-100 p-2 rounded-full text-slate-500">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{morador.nome || "Sem nome"}</h3>
                    <span className="text-sm text-slate-500">{morador.unidade}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-sm text-slate-500 hidden md:block">
                    {morador.telefone}
                  </div>
                  
                  {morador.telefone && (
                    <a 
                      href={`https://wa.me/55${morador.telefone.replace(/\D/g, '')}`}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()} 
                      className="bg-green-100 hover:bg-green-200 text-green-700 p-2 sm:px-3 sm:py-2 rounded-full sm:rounded-md transition-colors flex items-center gap-2 text-sm font-medium"
                      title="Chamar no WhatsApp"
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

      {moradorSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="bg-slate-100 p-4 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-slate-600" />
                <h2 className="text-lg font-bold text-slate-800">{moradorSelecionado.nome}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMoradorSelecionado(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unidade</span>
                <p className="text-slate-800 font-medium">{moradorSelecionado.unidade}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">WhatsApp</span>
                <p className="text-slate-800">{moradorSelecionado.telefone || "Não informado"}</p>
              </div>

              {(moradorSelecionado.nome_para_recados || moradorSelecionado.telefone_recados) && (
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                  <span className="text-xs font-semibold text-orange-800 uppercase tracking-wider">Contato de Recados</span>
                  <p className="text-orange-900 text-sm mt-1">
                    {moradorSelecionado.nome_para_recados} <br/>
                    {moradorSelecionado.telefone_recados}
                  </p>
                </div>
              )}

              {moradorSelecionado.ponto_referencia && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ponto de Referência</span>
                  <p className="text-slate-800 text-sm">{moradorSelecionado.ponto_referencia}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-slate-50 flex gap-3">
              {moradorSelecionado.telefone && (
                <a 
                  href={`https://wa.me/55${moradorSelecionado.telefone.replace(/\D/g, '')}`} 
                  target="_blank" 
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 rounded-md transition-colors font-medium text-sm"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              )}
              {moradorSelecionado.link_google_maps && (
                <a 
                  href={moradorSelecionado.link_google_maps} 
                  target="_blank" 
                  className="flex-1 flex items-center justify-center gap-2 bg-white border hover:bg-slate-100 text-slate-700 py-2 rounded-md transition-colors font-medium text-sm"
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