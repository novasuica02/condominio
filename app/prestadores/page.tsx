"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, UserCircle, Phone, MapPin, FileText } from "lucide-react";

export default function PrestadoresPage() {
  const [prestadores, setPrestadores] = useState<any[]>([]);
  const [nome, setNome] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("prestadores").select("*").order("nome");
    if (data) setPrestadores(data);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    await supabase.from("prestadores").insert([{ nome, especialidade, cpf_cnpj: cpf, telefone, endereco }]);
    setNome(""); setEspecialidade(""); setCpf(""); setTelefone(""); setEndereco("");
    carregar();
  };

  const handleDeletar = async (id: number) => {
    if (!confirm("Apagar este prestador?")) return;
    const supabase = createClient();
    await supabase.from("prestadores").delete().eq("id", id);
    carregar();
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center p-6 md:p-12 bg-slate-50/50 min-h-screen">
      <div className="w-full max-w-4xl bg-white p-6 md:p-8 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b pb-4">
          <Link href="/protected">
            <Button variant="ghost" size="icon" className="-ml-2"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-blue-600" /> Prestadores de Serviço
          </h1>
        </div>

        <form onSubmit={handleCriar} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-slate-50 p-4 rounded-lg border">
          <Input placeholder="Nome / Empresa" value={nome} onChange={(e) => setNome(e.target.value)} required />
          <Input placeholder="Especialidade (Ex: Pedreiro)" value={especialidade} onChange={(e) => setEspecialidade(e.target.value)} />
          <Input placeholder="CPF ou CNPJ" value={cpf} onChange={(e) => setCpf(e.target.value)} />
          <Input placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          <Input placeholder="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} className="md:col-span-2" />
          <Button type="submit" className="md:col-span-2 bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" /> Cadastrar Prestador</Button>
        </form>

        {loading ? <p className="text-center text-slate-500">Carregando...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prestadores.map((p) => (
              <div key={p.id} className="border rounded-lg p-4 flex flex-col gap-2 bg-white shadow-sm relative">
                <Button variant="ghost" size="icon" onClick={() => handleDeletar(p.id)} className="absolute top-2 right-2 text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                <h3 className="font-bold text-slate-800 text-lg">{p.nome}</h3>
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-fit">{p.especialidade || "Geral"}</span>
                <div className="text-sm text-slate-600 flex flex-col gap-1 mt-2">
                  {p.cpf_cnpj && <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> {p.cpf_cnpj}</span>}
                  {p.telefone && <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {p.telefone}</span>}
                  {p.endereco && <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> {p.endereco}</span>}
                </div>
              </div>
            ))}
            {prestadores.length === 0 && <p className="col-span-2 text-center text-slate-500 py-8">Nenhum prestador cadastrado.</p>}
          </div>
        )}
      </div>
    </div>
  );
}