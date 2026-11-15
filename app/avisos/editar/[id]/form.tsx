"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Paperclip } from "lucide-react";

export default function EditarAvisoForm({ aviso }: { aviso: any }) {
  const [titulo, setTitulo] = useState(aviso.titulo);
  const [corpo, setCorpo] = useState(aviso.corpo);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // LOG PARA SABERMOS SE O CLIQUE CHEGOU AQUI
    console.log("1. Iniciando submit do formulário...");
    
    setLoading(true);
    setErro(null);
    
    const supabase = createClient();
    let arquivo_url = aviso.arquivo_url;

    try {
      if (arquivo) {
        console.log("2. Fazendo upload do arquivo...");
        const fileExt = arquivo.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from("documentos").upload(fileName, arquivo);
        if (uploadError) throw new Error("Erro no upload: " + uploadError.message);

        const { data: { publicUrl } } = supabase.storage.from("documentos").getPublicUrl(fileName);
        arquivo_url = publicUrl;
        console.log("3. Upload concluído. URL:", arquivo_url);
      }

      console.log("4. Atualizando o banco de dados...");
      const { error } = await supabase.from("avisos").update({
        titulo,
        corpo,
        arquivo_url,
      }).eq("id", aviso.id);

      if (error) throw new Error("Erro no banco: " + error.message);

      console.log("5. Sucesso! Redirecionando...");
      window.location.href = "/avisos";
      
    } catch (err: any) {
      console.error("Erro capturado:", err);
      setErro(err.message || "Ocorreu um erro desconhecido ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {erro && (
        <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md border border-red-200">
          <strong>Erro:</strong> {erro}
        </div>
      )}

      <div>
        <label className="text-sm font-medium mb-1 block text-slate-700">Título</label>
        <Input required value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block text-slate-700">Mensagem</label>
        <textarea required className="flex min-h-[150px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={corpo} onChange={(e) => setCorpo(e.target.value)} />
      </div>

      <div className="bg-slate-50 p-4 rounded-lg border">
        <label className="text-sm font-medium mb-2 block text-slate-700">Anexo Atual</label>
        {aviso.arquivo_url ? (
          <a href={aviso.arquivo_url} target="_blank" className="text-blue-600 text-sm hover:underline flex items-center gap-2 mb-4">
            <Paperclip className="w-4 h-4" /> Ver anexo atual
          </a>
        ) : (
          <p className="text-sm text-slate-500 mb-4">Nenhum anexo.</p>
        )}

        <label className="text-sm font-medium mb-2 block text-slate-700">Substituir Anexo (Opcional)</label>
        <input type="file" accept=".pdf,image/*" onChange={(e) => setArquivo(e.target.files?.[0] || null)} className="flex w-full h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm file:border-0 file:bg-slate-200 file:font-medium file:mr-4 file:px-4 file:py-1.5 file:rounded-md cursor-pointer" />
      </div>

      <Button type="button" onClick={() => handleSubmit()} disabled={loading} className="bg-blue-600 hover:bg-blue-700 h-11 mt-2">
        {loading ? "Salvando..." : <><Save className="w-4 h-4 mr-2" /> Gravar Avisos</>}
      </Button>
    </form>
  );
}