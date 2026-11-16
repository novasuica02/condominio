"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Lock, Megaphone, Wrench, UserCircle, 
  FileText, Users, ChevronDown, ChevronUp, BookOpen, ShieldAlert, ChevronRight
} from "lucide-react";
import Header from "@/components/Header";

export default function AjudaPage() {
  const [aberto, setAberto] = useState<string | null>("acesso");
  const [isSindico, setIsSindico] = useState(false);

  useEffect(() => {
    async function checarPerfil() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (data?.role === "sindico") setIsSindico(true);
      }
    }
    checarPerfil();
  }, []);

  const toggleItem = (id: string) => {
    setAberto(aberto === id ? null : id);
  };

  const secoes = [
    {
      id: "acesso",
      titulo: "1. Acesso e Meu Perfil",
      icone: <Lock className="w-5 h-5 text-purple-400" />,
      cor: "bg-purple-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li><strong>Login:</strong> Use o e-mail e a senha cadastrados.</li>
          <li><strong>Meu Perfil:</strong> Atualize seu WhatsApp, Ponto de Referência e Link do Google Maps para facilitar entregas.</li>
          <li><strong>Mais de um morador:</strong> Cada pessoa da casa pode ter seu próprio login, usando a mesma unidade.</li>
        </ul>
      )
    },
    {
      id: "avisos",
      titulo: "2. Mural de Avisos",
      icone: <Megaphone className="w-5 h-5 text-blue-400" />,
      cor: "bg-blue-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Acompanhe manutenções, assembleias e comunicados oficiais.</li>
          <li>Se houver um ícone de clipe de papel 📎, clique em <strong>"Visualizar Anexo"</strong> para abrir o documento.</li>
        </ul>
      )
    },
    {
      id: "chamados",
      titulo: "3. Chamados de Manutenção",
      icone: <Wrench className="w-5 h-5 text-orange-400" />,
      cor: "bg-orange-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Vá em <strong>Chamados</strong> e clique em <strong>"Abrir Chamado"</strong>.</li>
          <li>Escolha o tipo de serviço (Ex: Elétrica), descreva o problema e informe o local. Se quiser, use o botão de GPS para puxar sua localização.</li>
          <li>Você pode acompanhar o status (Aberto, Em Andamento ou Resolvido) e ver o histórico de anotações do síndico/prestador.</li>
        </ul>
      )
    },
    {
      id: "profissionais",
      titulo: "4. Serviços Profissionais (Indicações)",
      icone: <UserCircle className="w-5 h-5 text-teal-400" />,
      cor: "bg-teal-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Precisa de um pedreiro ou eletricista? Acesse este menu para ver a lista de profissionais <strong>homologados pelo condomínio</strong>.</li>
          <li>Clique no botão do <strong>WhatsApp</strong> ou <strong>Ligar</strong> para falar direto com o profissional.</li>
        </ul>
      )
    },
    {
      id: "documentos",
      titulo: "5. Documentos do Condomínio",
      icone: <FileText className="w-5 h-5 text-emerald-400" />,
      cor: "bg-emerald-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Acesse a pasta virtual do condomínio para ver Atas, Regimento Interno e Contratos.</li>
          <li>Você pode visualizar os documentos ou baixá-los no seu celular.</li>
        </ul>
      )
    },
    {
      id: "moradores",
      titulo: "6. Lista de Moradores",
      icone: <Users className="w-5 h-5 text-slate-400" />,
      cor: "bg-slate-700",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Uma lista com os contatos dos vizinhos para facilitar a comunicação.</li>
          <li>Clique no nome do morador para ver detalhes ou no botão "WhatsApp" para mandar uma mensagem direta.</li>
        </ul>
      )
    }
  ];

  return (
    <div className="flex-1 w-full flex flex-col items-center p-4 md:p-12 bg-slate-900 min-h-screen">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        
        {/* HEADER */}
        <Header />

        <div className="flex items-center gap-3 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-blue-500" /> Guia do Morador
            </h1>
            <p className="text-sm text-slate-400 mt-1">Tudo o que você precisa saber para usar o aplicativo.</p>
          </div>
        </div>

        {/* CARD DE DESTAQUE DO SÍNDICO (SÓ APARECE PARA ELE) */}
        {isSindico && (
          <Link href="/ajuda/sindico" className="block">
            <div className="bg-red-600 hover:bg-red-700 transition-colors rounded-xl shadow-md p-6 flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full text-white">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-xl">Manual do Síndico</h2>
                  <p className="text-red-100 text-sm mt-1">Acesse o guia de gestão, cadastros e permissões.</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        )}

        {/* ACORDEÃO DE AJUDA DO MORADOR */}
        <div className="flex flex-col gap-3">
          {secoes.map((secao) => (
            <div key={secao.id} className="bg-slate-800 border border-slate-700 rounded-xl shadow-sm overflow-hidden transition-all">
              <button onClick={() => toggleItem(secao.id)} className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${secao.cor}`}>{secao.icone}</div>
                  <span className="font-semibold text-white">{secao.titulo}</span>
                </div>
                {aberto === secao.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
              
              {aberto === secao.id && (
                <div className="px-5 pb-5 pt-0 border-t border-slate-700">
                  <div className="pt-3">{secao.conteudo}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}