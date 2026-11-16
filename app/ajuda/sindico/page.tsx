"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Megaphone, Wrench, UserCircle, FileText, Users, Shield, ChevronDown, ChevronUp, Settings, AlertTriangle, ChevronRight
} from "lucide-react";
import Header from "@/components/Header";
import Link from "next/link";

export default function ManualSindicoPage() {
  const [aberto, setAberto] = useState<string | null>("avisos");

  const toggleItem = (id: string) => {
    setAberto(aberto === id ? null : id);
  };

  const secoes = [
    {
      id: "avisos",
      titulo: "1. Mural de Avisos e WhatsApp",
      icone: <Megaphone className="w-5 h-5 text-blue-400" />,
      cor: "bg-blue-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li><strong>Criar Aviso:</strong> Clique em "Novo Aviso", digite o título, a mensagem e anexe um arquivo se necessário.</li>
          <li><strong>Editar Aviso:</strong> Clique no botão "Editar" ao lado do aviso para alterar o texto ou o anexo.</li>
          <li><strong>Disparar WhatsApp:</strong> Ao lado do botão "Novo Aviso", clique em "Disparar WhatsApp". Selecione o aviso, escolha quais moradores devem receber e o sistema simulará o envio em massa.</li>
        </ul>
      )
    },
    {
      id: "chamados",
      titulo: "2. Gestão de Chamados",
      icone: <Wrench className="w-5 h-5 text-orange-400" />,
      cor: "bg-orange-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Você vê todos os chamados no menu "Chamados".</li>
          <li>Clique em "Gerenciar" para mudar o status, definir um SLA (prazo) e atribuir um <strong>Prestador</strong>.</li>
          <li><strong>Tipos e Sub-serviços:</strong> Clique em "Tipos" no topo da tela de chamados para criar as categorias (Hidráulica, Elétrica) e os sub-serviços.</li>
          <li>Você pode definir um prestador padrão para cada sub-serviço (ex: "Vazamento" vai para o Zé).</li>
        </ul>
      )
    },
    {
      id: "prestadores",
      titulo: "3. Prestadores (Serviços Internos)",
      icone: <Users className="w-5 h-5 text-slate-400" />,
      cor: "bg-slate-700",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>São as empresas que o <strong>condomínio contrata</strong> (ex: elevador, limpeza, portão).</li>
          <li>No topo da tela de Chamados, clique em "Prestadores" para cadastrar.</li>
          <li>Para criar o login do prestador, crie o e-mail no painel do Supabase e depois preencha o e-mail no cadastro do app. O vínculo será feito automaticamente.</li>
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
          <li>Aqui você cadastra os profissionais de confiança para <strong>uso particular dos moradores</strong> (ex: pedreiro, eletricista, piscineiro).</li>
          {/* CORRIGIDO AQUI: Trocado o ">" por "→" */}
          <li>Vá em "Precisa de um Serviço?" → "Gerenciar Serviços" e preencha os dados.</li>
        </ul>
      )
    },
    {
      id: "documentos",
      titulo: "5. Documentos",
      icone: <FileText className="w-5 h-5 text-emerald-400" />,
      cor: "bg-emerald-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>No menu "Documentos", clique em "Enviar Documento".</li>
          <li>Crie categorias (ex: Atas, Contratos) clicando em "Gerenciar Tipos".</li>
        </ul>
      )
    },
    {
      id: "gestao",
      titulo: "6. Gestão de Acessos e Configurações",
      icone: <Shield className="w-5 h-5 text-blue-400" />,
      cor: "bg-blue-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>No menu "Gestão", você pode promover moradores a síndicos, gerenciar prestadores ou atualizar os dados do condomínio (nome, logo, endereço).</li>
          {/* CORRIGIDO AQUI TAMBÉM, SE HOUVER OUTROS ">" */}
        </ul>
      )
    }
  ];

  return (
    <div className="flex-1 w-full flex flex-col items-center p-4 md:p-12 bg-slate-900 min-h-screen">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        
        <Header />

        <div className="flex items-center gap-3 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Settings className="w-7 h-7 text-blue-500" /> Manual do Síndico
            </h1>
            <p className="text-sm text-slate-400 mt-1">Guia completo de gestão e administração do condomínio.</p>
          </div>
        </div>

        <div className="bg-orange-900/20 border border-orange-700/50 p-4 rounded-xl flex gap-3 text-orange-200 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>Este manual contém ferramentas de administração. Compartilhe apenas com pessoas autorizadas.</p>
        </div>

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