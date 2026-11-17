"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, MessageSquarePlus } from "lucide-react";

export default function EditarAvisoForm({ aviso }: { aviso: any }) {
  const [titulo, setTitulo] = useState(aviso.titulo);
  const [corpo, setCorpo] = useState(aviso.corpo);
  const [arquivoOriginal, setArquivoOriginal] = useState<File | null>(null);

  const [textoAtualizacao, setTextoAtualizacao] = useState("");
  const [arquivoAtualizacao, setArquivoAtualizacao] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    try {
      if (textoAtualizacao.trim() !== "") {
        let newArquivoUrl = null;

        if (arquivoAtualizacao) {
          const fileExt = arquivoAtualizacao.name.split('.').pop();
          const fileName = `${Date.now()}-atualizacao.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage.from("documentos").upload(fileName, arquivoAtualizacao);
          if (uploadError) throw new Error("Erro no upload da atualização: " + uploadError.message);

          const { data: { publicUrl } } = supabase.storage.from("documentos").getPublicUrl(fileName);
          newArquivoUrl = publicUrl;
        }

        const { error: histError } = await supabase.from("avisos_historico").insert([{
          aviso_id: aviso.id,
          autor_id: user?.id,
          texto: textoAtualizacao,
          arquivo_url: newArquivoUrl
        }]);

        if (histError) throw new Error("Erro ao salvar histórico: " + histError.message);
      }

      let originalArquivoUrl = aviso.arquivo_url;
      if (arquivoOriginal) {
        const fileExt = arquivoOriginal.name.split('.').pop();
        const fileName = `${Date.now()}-original.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from("documentos").upload(fileName, arquivoOriginal);
        if (uploadError) throw new Error("Erro no upload do arquivo original: " + uploadError.message);

        const { data: { publicUrl } } = supabase.storage.from("documentos").getPublicUrl(fileName);
        originalArquivoUrl = publicUrl;
      }

      const { error: updateError } = await supabase.from("avisos").update({
        titulo,
        corpo,
        arquivo_url: originalArquivoUrl,
      }).eq("id", aviso.id);

      if (updateError) throw new Error("Erro ao salvar aviso: " + updateError.message);

      window.location.href = "/avisos";

    } catch (err: any) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {erro && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md border border-red-200">{erro}</div>}

      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col gap-4">
        <h2 className="text-sm font-bold text-slate-300">Editar Aviso Original</h2>
        
        <div>
          <label className="text-sm font-medium mb-1 block text-slate-400">Título</label>
          <Input required value={titulo} onChange={(e) => setTitulo(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block text-slate-400">Mensagem</label>
          <textarea required className="flex min-h-[100px] w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm" value={corpo} onChange={(e) => setCorpo(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block text-slate-400">Substituir Anexo Original (Opcional)</label>
          <input type="file" accept=".pdf,image/*" onChange={(e) => setArquivoOriginal(e.target.files?.[0] || null)} className="flex w-full h-11 rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm file:border-0 file:bg-slate-600 file:text-white file:font-medium file:mr-4 file:px-4 file:py-1.5 file:rounded-md cursor-pointer" />
        </div>
      </div>

      {/* CAIXA AZUL */}
      <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700/50 flex flex-col gap-4">
        <h2 className="text-sm font-bold text-blue-300 flex items-center gap-2">
          <MessageSquarePlus className="w-4 h-4" /> Adicionar Nova Atualização (Opcional)
        </h2>
        <p className="text-xs text-slate-400">Esta atualização aparecerá com data e hora abaixo do aviso original.</p>
        
        <div>
          <textarea 
            className="flex min-h-[80px] w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm placeholder:text-slate-400" 
            placeholder="Escreva a nova informação aqui..."
            value={textoAtualizacao}
            onChange={(e) => setTextoAtualizacao(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block text-slate-400">Anexar Novo Documento (Opcional)</label>
          <input type="file" accept=".pdf,image/*" onChange={(e) => setArquivoAtualizacao(e.target.files?.[0] || null)} className="flex w-full h-11 rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm file:border-0 file:bg-slate-600 file:text-white file:font-medium file:mr-4 file:px-4 file:py-1.5 file:rounded-md cursor-pointer" />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white h-11 mt-2">
        {loading ? "Salvando..." : <><Save className="w-4 h-4 mr-2" /> Salvar Alterações</>}
      </Button>
    </form>
  );
}