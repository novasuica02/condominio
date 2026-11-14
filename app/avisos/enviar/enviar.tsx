"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Send, X, CheckSquare, Square, MessageCircle } from "lucide-react";

export default function EnviarWhatsApp({ aviso }: { aviso: any }) {
  const [aberto, setAberto] = useState(false);
  const [moradores, setMoradores] = useState<any[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  // Busca os moradores quando o modal abre
  useEffect(() => {
    if (aberto) {
      const supabase = createClient();
      supabase.from("profiles").select("id, nome, unidade, telefone").order("nome").then(({ data }) => {
        if (data) {
          setMoradores(data);
          setSelecionados(data.map(m => m.id)); // Seleciona todos por padrão
        }
      });
    }
  }, [aberto]);

  const toggleSelecionado = (id: string) => {
    if (selecionados.includes(id)) {
      setSelecionados(selecionados.filter(s => s !== id));
    } else {
      setSelecionados([...selecionados, id]);
    }
  };

  const handleEnviar = async () => {
    setEnviando(true);
    
    // AQUI ENTRARÁ A INTEGRAÇÃO REAL COM A API DO WHATSAPP
    // Por enquanto, estamos simulando o envio.
    setTimeout(() => {
      alert(`Simulação: Mensagem enviada para ${selecionados.length} moradores!`);
      setEnviando(false);
      setAberto(false);
    }, 1500);
  };

  return (
    <>
      <Button onClick={() => setAberto(true)} className="bg-green-600 hover:bg-green-700">
        <Send className="w-4 h-4 mr-2" /> Enviar
      </Button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-slate-100 p-4 border-b flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Enviar via WhatsApp</h2>
                <p className="text-xs text-slate-500">Aviso: {aviso.titulo}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setAberto(false)}><X className="w-5 h-5" /></Button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto bg-slate-50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-slate-700">Selecione os moradores:</span>
                <Button variant="ghost" size="sm" onClick={() => setSelecionados(moradores.map(m => m.id))} className="text-xs h-7">
                  Selecionar Todos
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                {moradores.map((m) => (
                  <div 
                    key={m.id} 
                    onClick={() => toggleSelecionado(m.id)}
                    className="flex items-center gap-3 p-3 bg-white border rounded-lg cursor-pointer hover:border-green-400 transition-colors"
                  >
                    {selecionados.includes(m.id) ? <CheckSquare className="w-5 h-5 text-green-600" /> : <Square className="w-5 h-5 text-slate-300" />}
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{m.nome || "Sem nome"}</p>
                      <p className="text-xs text-slate-500">{m.unidade} • {m.telefone || "Sem telefone"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t bg-white flex justify-between items-center">
              <span className="text-sm text-slate-500">{selecionados.length} selecionado(s)</span>
              <Button onClick={handleEnviar} disabled={enviando || selecionados.length === 0} className="bg-green-600 hover:bg-green-700">
                {enviando ? "Enviando..." : <><MessageCircle className="w-4 h-4 mr-2" /> Disparar Mensagens</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}