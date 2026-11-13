"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, UserCircle } from "lucide-react";

const formatarTelefone = (valor: string) => {
  let apenasNumeros = valor.replace(/\D/g, "").slice(0, 11);
  if (apenasNumeros.length > 10) return apenasNumeros.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
  if (apenasNumeros.length > 6) return apenasNumeros.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
  if (apenasNumeros.length > 2) return apenasNumeros.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
  if (apenasNumeros.length > 0) return apenasNumeros.replace(/^(\d{0,2}).*/, "($1");
  return "";
};

export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState("");
  const [telefone, setTelefone] = useState("");
  const [maps, setMaps] = useState("");
  const [pontoRef, setPontoRef] = useState("");
  const [nomeRecado, setNomeRecado] = useState("");
  const [telRecado, setTelRecado] = useState("");

  // REMOVIDO: const supabase = createClient();

  useEffect(() => {
    async function carregarPerfil() {
      const supabase = createClient(); // <-- ADICIONADO AQUI
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (data) {
          setNome(data.nome || "");
          setUnidade(data.unidade || "");
          setTelefone(data.telefone || "");
          setMaps(data.link_google_maps || "");
          setPontoRef(data.ponto_referencia || "");
          setNomeRecado(data.nome_para_recados || "");
          setTelRecado(data.telefone_recados || "");
        }
      }
      setLoading(false);
    }
    carregarPerfil();
  }, []);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setMensagem(null);

    const supabase = createClient(); // <-- ADICIONADO AQUI
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({
          nome,
          unidade,
          telefone,
          link_google_maps: maps,
          ponto_referencia: pontoRef,
          nome_para_recados: nomeRecado,
          telefone_recados: telRecado,
        })
        .eq("id", user.id);

      if (error) {
        setMensagem("Erro ao salvar: " + error.message);
      } else {
        setMensagem("Dados atualizados com sucesso!");
      }
    }
    setSalvando(false);
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Carregando seus dados...</div>;
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center p-6 md:p-12 bg-slate-50/50 min-h-screen">
      <div className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-xl border shadow-sm">
        
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => window.location.href = "/protected"} className="-ml-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <UserCircle className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-800">Meu Perfil</h1>
          </div>
        </div>

        {mensagem && (
          <div className={`p-4 mb-6 text-sm rounded-md ${mensagem.includes("Erro") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
            {mensagem}
          </div>
        )}

        <form onSubmit={handleSalvar} className="flex flex-col gap-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block text-slate-700">Nome Completo</label>
              <Input required value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-slate-700">Unidade</label>
              <Input required value={unidade} onChange={(e) => setUnidade(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block text-slate-700">Seu WhatsApp</label>
            <Input required value={telefone} onChange={(e) => setTelefone(formatarTelefone(e.target.value))} />
          </div>

          <div className="border-t pt-4">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">Localização (Para Entregas)</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-slate-700">Ponto de Referência</label>
                <Input value={pontoRef} onChange={(e) => setPontoRef(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-slate-700">Link do Google Maps</label>
                <Input value={maps} onChange={(e) => setMaps(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">Contato de Recados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-slate-700">Nome do Contato</label>
                <Input value={nomeRecado} onChange={(e) => setNomeRecado(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-slate-700">Telefone de Recados</label>
                <Input value={telRecado} onChange={(e) => setTelRecado(formatarTelefone(e.target.value))} />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={salvando} className="bg-blue-600 hover:bg-blue-700 h-11 mt-2">
            {salvando ? "Salvando..." : <><Save className="w-4 h-4 mr-2" /> Salvar Alterações</>}
          </Button>
        </form>
      </div>
    </div>
  );
}