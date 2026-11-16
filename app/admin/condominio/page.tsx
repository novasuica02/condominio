"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Building2, Image as ImageIcon } from "lucide-react";
import Header from "@/components/Header";

export default function CadastroCondominioPage() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const [configId, setConfigId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [sindicoNome, setSindicoNome] = useState("");
  const [sindicoTelefone, setSindicoTelefone] = useState("");

  useEffect(() => {
    async function carregar() {
      const supabase = createClient();
      const { data } = await supabase.from("condominio_config").select("*").limit(1).single();
      
      if (data) {
        setConfigId(data.id);
        setNome(data.nome || "");
        setLogoUrl(data.logo_url || "");
        setEndereco(data.endereco || "");
        setCnpj(data.cnpj || "");
        setSindicoNome(data.sindico_nome || "");
        setSindicoTelefone(data.sindico_telefone || "");
      }
      setLoading(false);
    }
    carregar();
  }, []);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setMensagem(null);
    const supabase = createClient();

    const dados = {
      nome,
      logo_url: logoUrl,
      endereco,
      cnpj,
      sindico_nome: sindicoNome,
      sindico_telefone: sindicoTelefone
    };

    let error;
    if (configId) {
      // Se já existe, atualiza
      const { error: err } = await supabase.from("condominio_config").update(dados).eq("id", configId);
      error = err;
    } else {
      // Se não existe, insere
      const { error: err } = await supabase.from("condominio_config").insert([dados]);
      error = err;
    }

    setSalvando(false);

    if (error) {
      setMensagem("Erro ao salvar: " + error.message);
    } else {
      setMensagem("Configurações salvas com sucesso!");
      // Recarrega o Header para mostrar o novo nome/logo
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  if (loading) {
    return <div className="flex-1 w-full flex items-center justify-center bg-slate-900 min-h-screen text-slate-400">Carregando configurações...</div>;
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center p-4 md:p-12 bg-slate-900 min-h-screen">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        
        <Header />

        <div className="bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-700 shadow-sm">
          
          <div className="flex items-center gap-2 mb-6 border-b border-slate-700 pb-4">
            <Building2 className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">Dados do Condomínio</h1>
          </div>

          {mensagem && (
            <div className={`p-4 mb-6 text-sm rounded-md ${mensagem.includes("Erro") ? "bg-red-900/50 text-red-200 border border-red-700" : "bg-green-900/50 text-green-200 border border-green-700"}`}>
              {mensagem}
            </div>
          )}

          <form onSubmit={handleSalvar} className="flex flex-col gap-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-slate-300">Nome do Condomínio</label>
                <Input required value={nome} onChange={(e) => setNome(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-slate-300">CNPJ</label>
                <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block text-slate-300">Endereço Completo</label>
              <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block text-slate-300">URL do Logo (Imagem)</label>
              <div className="flex gap-2">
                <Input 
                  placeholder="https://exemplo.com/logo.png" 
                  value={logoUrl} 
                  onChange={(e) => setLogoUrl(e.target.value)} 
                  className="bg-slate-700 border-slate-600 text-white" 
                />
                {logoUrl && (
                  <div className="bg-slate-700 p-1 rounded-md border border-slate-600 flex items-center justify-center w-12 h-10">
                    <img src={logoUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">Cole o link direto da imagem (ex: hospedada no Imgur, Google Drive público, etc).</p>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <h2 className="text-sm font-semibold text-white mb-3">Dados do Síndico</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block text-slate-300">Nome do Síndico</label>
                  <Input value={sindicoNome} onChange={(e) => setSindicoNome(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-slate-300">Telefone do Síndico</label>
                  <Input value={sindicoTelefone} onChange={(e) => setSindicoTelefone(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={salvando} className="bg-blue-600 hover:bg-blue-500 text-white h-11 mt-2">
              {salvando ? "Salvando..." : <><Save className="w-4 h-4 mr-2" /> Salvar Configurações</>}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}