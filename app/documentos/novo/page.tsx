"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload } from "lucide-react";

export default function NovoDocumentoPage() {
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [categorias, setCategorias] = useState<{ id: number; nome: string }[]>([]);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();

  // Busca as categorias do banco
  useEffect(() => {
    async function carregarCategorias() {
      const { data } = await supabase
        .from("categorias_documentos")
        .select("*")
        .order("nome");
        
      if (data && data.length > 0) {
        setCategorias(data);
        setCategoria(data[0].nome);
      }
    }
    carregarCategorias();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivo) {
      alert("Por favor, selecione um arquivo.");
      return;
    }

    setLoading(true);

    const fileExt = arquivo.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    
    // Faz o upload para o bucket 'documentos'
    const { error: uploadError } = await supabase.storage
      .from("documentos")
      .upload(fileName, arquivo);

    if (uploadError) {
      alert("Erro ao enviar arquivo: " + uploadError.message);
      setLoading(false);
      return;
    }

    // Pega a URL pública
    const { data: { publicUrl } } = supabase.storage
      .from("documentos")
      .getPublicUrl(fileName);

    const { data: { user } } = await supabase.auth.getUser();

    // Salva na tabela
    const { error: dbError } = await supabase.from("documentos").insert([
      {
        titulo,
        categoria,
        arquivo_url: publicUrl,
        autor_id: user?.id,
      },
    ]);

    setLoading(false);

    if (dbError) {
      alert("Erro ao salvar no banco: " + dbError.message);
    } else {
      window.location.href = "/documentos";
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center p-6 md:p-12 bg-slate-50/50 min-h-screen">
      <div className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-xl border shadow-sm">
        
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <div className="flex items-center gap-2">
            <Link href="/documentos">
              <Button variant="ghost" size="icon" className="-ml-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-slate-800">Enviar Novo Documento</h1>
          </div>
          <Link href="/documentos/categorias">
            <Button variant="outline" size="sm">Gerenciar Tipos</Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700">Título do Documento</label>
            <Input required placeholder="Ex: Ata da Assembleia de Outubro" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700">Tipo de Documento</label>
            <select
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              required
            >
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.nome}>{cat.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700">Arquivo (PDF ou Imagem)</label>
            {/* INPUT DE ARQUIVO PURO - RESOLVE O PROBLEMA DE TRAVAR */}
            <input
              type="file"
              required
              accept=".pdf,image/*"
              onChange={(e) => setArquivo(e.target.files?.[0] || null)}
              className="flex w-full h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:border-0 file:bg-emerald-50 file:text-emerald-700 file:font-medium file:mr-4 file:px-4 file:py-1.5 file:rounded-md hover:file:bg-emerald-100 transition-all cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-2">O arquivo será salvo com um nome seguro no servidor.</p>
          </div>

          <Button type="submit" disabled={loading} className="mt-4 bg-emerald-600 hover:bg-emerald-700 h-11 text-base">
            {loading ? "Enviando..." : (
              <><Upload className="w-4 h-4 mr-2" /> Enviar Documento</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}