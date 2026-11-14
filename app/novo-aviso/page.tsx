"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Paperclip } from "lucide-react";

export default function NovoAvisoPage() {
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    let arquivo_url = null;

    // 1. Se anexou um arquivo, faz o upload para o bucket 'documentos'
    if (arquivo) {
      const fileExt = arquivo.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(fileName, arquivo);

      if (uploadError) {
        alert("Erro ao enviar arquivo: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from("documentos").getPublicUrl(fileName);
      arquivo_url = publicUrl;
    }

    // 2. Salva o aviso
    const { error } = await supabase.from("avisos").insert([{
      titulo,
      corpo,
      autor_id: user?.id,
      arquivo_url: arquivo_url,
    }]);

    setLoading(false);

    if (error) {
      alert("Erro ao publicar: " + error.message);
    } else {
      window.location.href = "/avisos";
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center p-6 md:p-12 bg-slate-50/50 min-h-screen">
      <div className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b pb-4">
          <Button variant="ghost" size="icon" onClick={() => window.location.href = "/avisos"} className="-ml-2"><ArrowLeft className="w-5 h-5" /></Button>
          <h1 className="text-xl font-bold text-slate-800">Publicar Novo Aviso</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block text-slate-700">Título</label>
            <Input required placeholder="Ex: Manutenção do Elevador" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block text-slate-700">Mensagem</label>
            <textarea required className="flex min-h-[150px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={corpo} onChange={(e) => setCorpo(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block text-slate-700">Anexo (Opcional)</label>
            <input type="file" accept=".pdf,image/*" onChange={(e) => setArquivo(e.target.files?.[0] || null)} className="flex w-full h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium file:mr-4 file:px-4 file:py-1.5 file:rounded-md cursor-pointer" />
          </div>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 h-11 mt-2">
            {loading ? "Publicando..." : <><Send className="w-4 h-4 mr-2" /> Publicar Aviso</>}
          </Button>
        </form>
      </div>
    </div>
  );
}