"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, UserCircle, Phone, MapPin, FileText } from "lucide-react";

export default function GerenciarProfissionaisPage() {
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do formulário
  const [nome, setNome] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [endereco, setEndereco] = useState("");
  const [observacao, setObservacao] = useState("");

  const carregar = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("profissionais_indicados").select("*").order("especialidade");
    if (data) setProfissionais(data);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    await supabase.from("profissionais_indicados").insert([{ 
      nome, 
      especialidade, 
      telefone, 
      cpf_cnpj: cpfCnpj,
      endereco,
      observacao 
    }]);
    
    // Limpa o formulário após cadastrar
    setNome(""); setEspecialidade(""); setTelefone(""); setCpfCnpj(""); setEndereco(""); setObservacao("");
    carregar();
  };

  const handleDeletar = async (id: number) => {
    if (!confirm("Apagar este profissional?")) return;
    const supabase = createClient();
    await supabase.from("profissionais_indicados").delete().eq("id", id);
    carregar();
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center p-6 md:p-12 bg-slate-50/50 min-h-screen">
      <div className="w-full max-w-4xl bg-white p-6 md:p-8 rounded-xl border shadow-sm">
        
        <div className="flex items-center gap-2 mb-6 border-b pb-4">
          <Link href="/profissionais">
            <Button variant="ghost" size="icon" className="-ml-2"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-teal-600" /> Gerenciar Serviços Profissionais
          </h1>
        </div>

        {/* FORMULÁRIO DE CADASTRO */}
        <form onSubmit={handleCriar} className="mb-10 bg-slate-50 p-5 rounded-xl border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Cadastrar Novo Profissional</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block text-slate-700">Nome / Empresa</label>
              <Input placeholder="Ex: João da Silva" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-slate-700">Especialidade</label>
              <Input placeholder="Ex: Pedreiro, Eletricista" value={especialidade} onChange={(e) => setEspecialidade(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-slate-700">CPF ou CNPJ</label>
              <Input placeholder="000.000.000-00" value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-slate-700">WhatsApp / Telefone</label>
              <Input placeholder="(11) 99999-9999" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block text-slate-700">Endereço / Região</label>
              <Input placeholder="Ex: Bairro Centro, próximo ao mercado" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block text-slate-700">Observações (Opcional)</label>
              <Input placeholder="Ex: Indico muito, pontual e organizado" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
            </div>
          </div>

          <Button type="submit" className="mt-6 w-full bg-teal-600 hover:bg-teal-700 h-11 text-base">
            <Plus className="w-5 h-5 mr-2" /> Adicionar Profissional
          </Button>
        </form>

        {/* LISTA DE PROFISSIONAIS JÁ CADASTRADOS */}
        <h2 className="text-lg font-semibold text-slate-800 mb-4 border-t pt-6">Profissionais Cadastrados</h2>
        
        {loading ? <p className="text-center text-slate-500">Carregando...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profissionais.map((p) => (
              <div key={p.id} className="border rounded-lg p-5 flex flex-col gap-3 bg-white shadow-sm relative">
                <Button variant="ghost" size="icon" onClick={() => handleDeletar(p.id)} className="absolute top-2 right-2 text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{p.nome}</h3>
                  <span className="text-sm font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full w-fit inline-block mt-1">{p.especialidade}</span>
                </div>

                <div className="flex flex-col gap-1.5 mt-1">
                  {p.cpf_cnpj && <span className="text-sm text-slate-600 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> {p.cpf_cnpj}</span>}
                  <span className="text-sm text-slate-600 flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {p.telefone}</span>
                  {p.endereco && <span className="text-sm text-slate-600 flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> {p.endereco}</span>}
                </div>

                {p.observacao && (
                  <div className="mt-2 bg-slate-50 p-2 rounded text-xs text-slate-500 italic border">
                    "{p.observacao}"
                  </div>
                )}
              </div>
            ))}
            {profissionais.length === 0 && (
              <p className="col-span-2 text-center text-slate-500 py-8">Nenhum profissional cadastrado.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}