"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2 } from "lucide-react";

// Função para formatar o telefone como (11) 99999-9999 ou (11) 9999-9999
const formatarTelefone = (valor: string) => {
  let apenasNumeros = valor.replace(/\D/g, "");
  apenasNumeros = apenasNumeros.slice(0, 11); // Limita a 11 dígitos

  if (apenasNumeros.length > 10) {
    // Celular: (11) 99999-9999
    return apenasNumeros.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
  } else if (apenasNumeros.length > 6) {
    // Fixo: (11) 9999-9999
    return apenasNumeros.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
  } else if (apenasNumeros.length > 2) {
    // Digitando...
    return apenasNumeros.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
  } else if (apenasNumeros.length > 0) {
    return apenasNumeros.replace(/^(\d{0,2}).*/, "($1");
  }
  return "";
};

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Dados Pessoais
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState("");
  const [telefone, setTelefone] = useState("");
  
  // Localização
  const [maps, setMaps] = useState("");
  const [pontoRef, setPontoRef] = useState("");
  
  // Recados
  const [nomeRecado, setNomeRecado] = useState("");
  const [telRecado, setTelRecado] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // 1. Cria o usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome: nome,
          unidade: unidade,
        },
      },
    });

    if (authError) {
      setMessage("Erro ao criar conta: " + authError.message);
      setLoading(false);
      return;
    }

    // 2. Se deu certo, atualiza o restante dos dados na tabela profiles
    if (authData.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          telefone: telefone,
          link_google_maps: maps,
          ponto_referencia: pontoRef,
          nome_para_recados: nomeRecado,
          telefone_recados: telRecado,
        })
        .eq("id", authData.user.id);

      if (profileError) {
        console.error("Erro ao salvar dados extras:", profileError);
        setMessage("Conta criada, mas houve um erro ao salvar os dados extras.");
      }
    }

    setLoading(false);
    setMessage("Conta criada com sucesso!");
    
    // Redireciona para o painel
    setTimeout(() => {
      window.location.href = "/protected";
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col w-full px-6 sm:max-w-xl mx-auto justify-center gap-2 mt-10 mb-10">
      <div className="flex justify-center mb-4">
        <div className="bg-blue-600 p-3 rounded-xl text-white">
          <Building2 className="w-8 h-8" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold text-center text-slate-800 mb-6">Ficha do Morador</h1>

      {message && (
        <div className={`p-4 text-sm rounded-md mb-4 ${message.includes("Erro") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSignUp} className="flex flex-col gap-5">
        
        {/* BLOCO 1: DADOS DO MORADOR */}
        <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">1. Seus Dados</h2>
          
          <div>
            <label className="text-sm font-medium mb-1 block text-slate-700">Nome Completo</label>
            <Input required placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block text-slate-700">Unidade</label>
              <Input required placeholder="Casa 12 ou Ap 302" value={unidade} onChange={(e) => setUnidade(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-slate-700">Seu WhatsApp</label>
              <Input 
                required 
                placeholder="(11) 99999-9999" 
                value={telefone} 
                onChange={(e) => setTelefone(formatarTelefone(e.target.value))} 
              />
            </div>
          </div>
        </div>

        {/* BLOCO 2: LOCALIZAÇÃO */}
        <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">2. Localização (Para Entregas)</h2>
          
          <div>
            <label className="text-sm font-medium mb-1 block text-slate-700">Ponto de Referência</label>
            <Input placeholder="Ex: Portão azul, em frente à praça" value={pontoRef} onChange={(e) => setPontoRef(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block text-slate-700">Link do Google Maps (Opcional)</label>
            <Input placeholder="https://maps.app.goo.gl/..." value={maps} onChange={(e) => setMaps(e.target.value)} />
          </div>
        </div>

        {/* BLOCO 3: RECADOS */}
        <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">3. Contato de Recados</h2>
          <p className="text-xs text-slate-500 -mt-2">Caso não te encontremos, com quem falamos?</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block text-slate-700">Nome do Contato</label>
              <Input placeholder="Ex: Maria (Esposa)" value={nomeRecado} onChange={(e) => setNomeRecado(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-slate-700">Telefone de Recados</label>
              <Input 
                placeholder="(11) 99999-9999" 
                value={telRecado} 
                onChange={(e) => setTelRecado(formatarTelefone(e.target.value))} 
              />
            </div>
          </div>
        </div>

        {/* BLOCO 4: ACESSO */}
        <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">4. Dados de Acesso</h2>
          
          <div>
            <label className="text-sm font-medium mb-1 block text-slate-700">E-mail</label>
            <Input type="email" required placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block text-slate-700">Senha</label>
            <Input type="password" required placeholder="Crie uma senha forte" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 h-12 text-lg">
          {loading ? "Criando conta..." : "Finalizar Cadastro"}
        </Button>
      </form>

      <div className="text-sm text-center text-slate-500 mt-4">
        Já tem uma conta?{" "}
        <Link href="/auth/login" className="text-blue-600 hover:underline">
          Fazer login
        </Link>
      </div>
    </div>
  );
}