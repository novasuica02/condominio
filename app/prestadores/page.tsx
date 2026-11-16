"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, UserCircle, Phone, MapPin, FileText, Edit, X, Save } from "lucide-react";

export default function PrestadoresPage() {
  const [prestadores, setPrestadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados do Formulário
  const [nome, setNome] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Estados do Modal de Edição
  const [editando, setEditando] = useState<any | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editEsp, setEditEsp] = useState("");
  const [editTel, setEditTel] = useState("");
  const [editEnd, setEditEnd] = useState("");

  const carregar = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("prestadores").select("*").order("nome");
    if (data) setPrestadores(data);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    const supabase = createClient();

    try {
      let usuarioId = null;

      // Se preencheu o e-mail, cria o login no Supabase Auth
      if (email && senha) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email,
          password: senha,
          options: { data: { nome: nome } }
        });

        if (authError) {
          // Se o erro for porque o usuário já existe, apenas ignoramos e seguimos
          if (!authError.message.includes("already registered")) {
            throw new Error("Erro no login: " + authError.message);
          }
        }
        
        if (authData?.user) {
          usuarioId = authData.user.id;
          // Atualiza o perfil para prestador
          await supabase.from("profiles").update({ role: "prestador", nome: nome, unidade: "Prestador" }).eq("id", usuarioId);
        }
      }

      // Insere o prestador na tabela
      await supabase.from("prestadores").insert([{ 
        nome, especialidade, cpf_cnpj: cpf, telefone, endereco, email, usuario_id: usuarioId
      }]);
      
      setNome(""); setEspecialidade(""); setCpf(""); setTelefone(""); setEndereco(""); setEmail(""); setSenha("");
      carregar();
      alert("Prestador cadastrado com sucesso!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = async (id: number) => {
    if (!confirm("Apagar este prestador?")) return;
    const supabase = createClient();
    await supabase.from("prestadores").delete().eq("id", id);
    carregar();
  };

  const abrirEdicao = (p: any) => {
    setEditando(p);
    setEditNome(p.nome);
    setEditEsp(p.especialidade || "");
    setEditTel(p.telefone || "");
    setEditEnd(p.endereco || "");
  };

  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    await supabase.from("prestadores").update({
      nome: editNome,
      especialidade: editEsp,
      telefone: editTel,
      endereco: editEnd
    }).eq("id", editando.id);
    
    setEditando(null);
    carregar();
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center p-6 md:p-12 bg-slate-900 min-h-screen">
      <div className="w-full max-w-4xl bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-700 shadow-lg">
        
        <div className="flex items-center gap-2 mb-6 border-b border-slate-700 pb-4">
          <Link href="/protected">
            <Button variant="ghost" size="icon" className="-ml-2 text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-blue-400" /> Prestadores de Serviço
          </h1>
        </div>

        {/* FORMULÁRIO DE CADASTRO */}
        <form onSubmit={handleCriar} className="mb-8 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Nome / Empresa" value={nome} onChange={(e) => setNome(e.target.value)} required className="bg-slate-700 border-slate-600 text-white" />
            <Input placeholder="Especialidade (Ex: Pedreiro)" value={especialidade} onChange={(e) => setEspecialidade(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
            <Input placeholder="CPF ou CNPJ" value={cpf} onChange={(e) => setCpf(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
            <Input placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
            <Input placeholder="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} className="md:col-span-2 bg-slate-700 border-slate-600 text-white" />
            
            <div className="md:col-span-2 border-t border-slate-700 pt-3 mt-1">
              <p className="text-xs text-blue-400 mb-2 font-semibold">Opcional: Criar Login de Acesso para o Prestador</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input type="email" placeholder="E-mail de Acesso" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                <Input type="text" placeholder="Senha Provisória" value={senha} onChange={(e) => setSenha(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
              </div>
            </div>
          </div>
          <Button type="submit" disabled={salvando} className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white">
            {salvando ? "Cadastrando..." : <><Plus className="w-4 h-4 mr-2" /> Cadastrar Prestador</>}
          </Button>
        </form>

        {/* LISTA DE PRESTADORES */}
        <h2 className="text-lg font-bold text-white mb-4">Prestadores Cadastrados</h2>
        
        {loading ? (
          <p className="text-center text-slate-400">Carregando...</p>
        ) : prestadores.length === 0 ? (
          <p className="text-center text-slate-400 py-8">Nenhum prestador cadastrado ainda.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prestadores.map((p) => (
              <div key={p.id} className="border border-slate-700 rounded-lg p-4 flex flex-col gap-2 bg-slate-800 shadow-sm relative">
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => abrirEdicao(p)} className="text-blue-400 hover:bg-blue-900/30 hover:text-blue-300" title="Editar">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeletar(p.id)} className="text-red-400 hover:bg-red-900/30 hover:text-red-300" title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <h3 className="font-bold text-white text-lg pr-16">{p.nome}</h3>
                <span className="text-sm font-medium text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded-full w-fit border border-blue-800">{p.especialidade || "Geral"}</span>
                
                <div className="text-sm text-slate-300 flex flex-col gap-1 mt-2">
                  {p.cpf_cnpj && <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-slate-500" /> {p.cpf_cnpj}</span>}
                  {p.telefone && <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-500" /> {p.telefone}</span>}
                  {p.endereco && <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-500" /> {p.endereco}</span>}
                </div>
                
                {p.email && (
                  <p className="text-xs text-teal-400 mt-2 border-t border-slate-700 pt-2 flex items-center gap-2">
                    <span className="font-semibold">Login:</span> {p.email}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* MODAL DE EDIÇÃO */}
        {editando && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-700">
              <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white">Editar Prestador</h2>
                <Button variant="ghost" size="icon" onClick={() => setEditando(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></Button>
              </div>
              
              <form onSubmit={salvarEdicao} className="p-5 flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block text-slate-300">Nome</label>
                  <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-slate-300">Especialidade</label>
                  <Input value={editEsp} onChange={(e) => setEditEsp(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-slate-300">Telefone</label>
                  <Input value={editTel} onChange={(e) => setEditTel(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-slate-300">Endereço</label>
                  <Input value={editEnd} onChange={(e) => setEditEnd(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                </div>
                
                <Button type="submit" className="mt-2 bg-blue-600 hover:bg-blue-500 text-white">
                  <Save className="w-4 h-4 mr-2" /> Salvar Alterações
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}