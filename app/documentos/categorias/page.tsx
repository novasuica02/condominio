"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, Tag } from "lucide-react";

type Categoria = {
  id: number;
  nome: string;
};

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const supabase = createClient();

  const carregarCategorias = async () => {
    const { data } = await supabase.from("categorias_documentos").select("*").order("nome");
    if (data) setCategorias(data);
    setLoading(false);
  };

  useEffect(() => {
    carregarCategorias();
  }, [supabase]);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaCategoria.trim()) return;
    
    setSalvando(true);
    const { error } = await supabase.from("categorias_documentos").insert([{ nome: novaCategoria.trim() }]);
    
    if (error) {
      alert("Erro ao criar categoria: " + error.message);
    } else {
      setNovaCategoria("");
      await carregarCategorias();
    }
    setSalvando(false);
  };

  const handleDeletar = async (id: number) => {
    if (!confirm("Tem certeza que deseja apagar esta categoria?")) return;
    
    const { error } = await supabase.from("categorias_documentos").delete().eq("id", id);
    if (error) {
      alert("Erro ao deletar: " + error.message);
    } else {
      await carregarCategorias();
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center p-6 md:p-12 bg-slate-50/50 min-h-screen">
      <div className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-xl border shadow-sm">
        
        <div className="flex items-center gap-2 mb-6 border-b pb-4">
          <Link href="/documentos">
            <Button variant="ghost" size="icon" className="-ml-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600" /> Tipos de Documento
          </h1>
        </div>

        <form onSubmit={handleCriar} className="flex gap-2 mb-6">
          <Input 
            placeholder="Ex: Laudo Técnico, Nota Fiscal..." 
            value={novaCategoria}
            onChange={(e) => setNovaCategoria(e.target.value)}
          />
          <Button type="submit" disabled={salvando} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </Button>
        </form>

        {loading ? (
          <p className="text-center text-slate-500">Carregando...</p>
        ) : (
          <div className="flex flex-col border rounded-lg overflow-hidden">
            {categorias.map((cat, index) => (
              <div key={cat.id} className={`flex justify-between items-center p-3 ${index !== categorias.length - 1 ? 'border-b' : ''}`}>
                <span className="font-medium text-slate-700">{cat.nome}</span>
                <Button variant="ghost" size="icon" onClick={() => handleDeletar(cat.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {categorias.length === 0 && (
              <p className="p-4 text-center text-slate-500">Nenhuma categoria cadastrada.</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}