"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";

export default function NovoAvisoPage() {
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Pega o usuário logado para salvar o ID do autor
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("avisos").insert([
      {
        titulo,
        corpo,
        autor_id: user?.id,
      },
    ]);

    setLoading(false);

    if (error) {
      alert("Erro ao publicar: " + error.message);
    } else {
      // Recarrega a página inteira para garantir que o aviso apareça
      window.location.href = "/avisos";
    }
  };

  const handleVoltar = () => {
    window.location.href = "/avisos";
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center p-6 md:p-12 bg-slate-50/50 min-h-screen">
      <div className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-xl border shadow-sm">
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-slate-800">
            <Button variant="ghost" size="icon" onClick={handleVoltar} className="-ml-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Publicar Novo Aviso</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700">Título do Aviso</label>
            <Input
              required
              placeholder="Ex: Manutenção do Elevador"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700">Mensagem</label>
            <textarea
              required
              placeholder="Escreva os detalhes do aviso aqui..."
              className="flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={loading} className="mt-2 bg-blue-600 hover:bg-blue-700 h-11 text-base">
            {loading ? "Publicando..." : (
              <>
                <Send className="w-4 h-4 mr-2" /> Publicar Aviso
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}