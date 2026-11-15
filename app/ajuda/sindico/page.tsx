"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Megaphone, Wrench, UserCircle, 
  FileText, Users, Shield, ChevronDown, ChevronUp, Settings, MessageCircle, AlertTriangle
} from "lucide-react";

export default function ManualSindicoPage() {
  const [aberto, setAberto] = useState<string | null>("avisos");

  const toggleItem = (id: string) => {
    setAberto(aberto === id ? null : id);
  };

  const secoes = [
    {
      id: "avisos",
      titulo: "1. Mural de Avisos e WhatsApp",
      icone: <Megaphone className="w-5 h-5 text-blue-600" />,
      cor: "bg-blue-100",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm">
          <li><strong>Criar Aviso:</strong> Clique em "Novo Aviso", digite o título, a mensagem e anexe um arquivo (PDF ou Imagem) se necessário.</li>
          <li><strong>Editar Aviso:</strong> Na lista de avisos, clique no botão "Editar" ao lado do aviso que deseja alterar. Você pode mudar o texto e substituir o anexo.</li>
          <li><strong>Disparar WhatsApp:</strong> Ao lado do botão "Novo Aviso", clique em "Disparar WhatsApp". Selecione o aviso, escolha quais moradores devem receber e o sistema simulará o envio em massa.</li>
        </ul>
      )
    },
    {
      id: "chamados",
      titulo: "2. Gestão de Chamados",
      icone: <Wrench className="w-5 h-5 text-orange-600" />,
      cor: "bg-orange-100",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm">
          <li><strong>Visualizar:</strong> Você vê todos os chamados abertos pelos moradores no menu "Chamados".</li>
          <li><strong>Gerenciar:</strong> Clique no botão "Gerenciar" ao lado do chamado. Lá você pode mudar o status (Em Andamento / Resolvido), definir uma data limite (SLA) e atribuir um <strong>Prestador Interno</strong> para resolver o problema.</li>
          <li><strong>Tipos e Sub-serviços:</strong> No topo da tela de chamados, clique em "Tipos" para cadastrar as categorias (Hidráulica, Elétrica) e os sub-serviços (Vazamento, Curto-circuito).</li>
        </ul>
      )
    },
    {
      id: "prestadores",
      titulo: "3. Prestadores (Serviços Internos)",
      icone: <Users className="w-5 h-5 text-slate-600" />,
      cor: "bg-slate-200",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm">
          <li>São as empresas ou profissionais que o <strong>condomínio contrata</strong> (ex: elevador, limpeza, portão).</li>
          <li>No topo da tela de Chamados, clique em "Prestadores" para cadastrar o Nome, Especialidade, CPF/CNPJ, Telefone e Endereço.</li>
          <li>Esses prestadores ficarão disponíveis para serem vinculados aos chamados dos moradores.</li>
        </ul>
      )
    },
    {
      id: "profissionais",
      titulo: "4. Serviços Profissionais (Indicações)",
      icone: <UserCircle className="w-5 h-5 text-teal-600" />,
      cor: "bg-teal-100",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm">
          <li>Aqui você cadastra os profissionais de confiança para <strong>uso particular dos moradores</strong> (ex: pedreiro, eletricista, piscineiro).</li>
          <li>Acesse o menu "Profissionais" e clique no botão verde "Gerenciar Serviços".</li>
          <li>Preencha Nome, Especialidade, CPF/CNPJ, Telefone e Endereço. O morador verá essa lista e poderá chamar o profissional no WhatsApp.</li>
        </ul>
      )
    },
    {
      id: "documentos",
      titulo: "5. Documentos",
      icone: <FileText className="w-5 h-5 text-emerald-600" />,
      cor: "bg-emerald-100",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm">
          <li>No menu "Documentos", clique em "Enviar Documento".</li>
          <li>Crie categorias (ex: Atas, Contratos) clicando em "Gerenciar Tipos".</li>
          <li>Os moradores poderão visualizar e baixar os arquivos de forma organizada.</li>
        </ul>
      )
    },
    {
      id: "gestao",
      titulo: "6. Gestão de Acessos",
      icone: <Shield className="w-5 h-5 text-blue-700" />,
      cor: "bg-blue-50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm">
          <li>No menu "Gestão", você pode promover moradores a síndicos ou remover privilégios de administradores antigos.</li>
          <li><strong>Atenção:</strong> Tome cuidado ao conceder acesso de síndico. Um usuário com esse perfil pode excluir dados e gerenciar todas as áreas.</li>
        </ul>
      )
    }
  ];

  return (
    <div className="flex-1 w-full flex flex-col items-center p-4 md:p-12 bg-slate-50/50 min-h-screen">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        
        <div className="flex items-center gap-3 bg-white p-6 rounded-xl border shadow-sm">
          <Link href="/protected">
            <Button variant="ghost" size="icon" className="text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Settings className="w-7 h-7 text-blue-600" /> Manual do Síndico
            </h1>
            <p className="text-sm text-slate-500 mt-1">Guia completo de gestão e administração do condomínio.</p>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex gap-3 text-orange-800 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>Este manual contém ferramentas de administração. Compartilhe apenas com pessoas autorizadas.</p>
        </div>

        <div className="flex flex-col gap-3">
          {secoes.map((secao) => (
            <div key={secao.id} className="bg-white border rounded-xl shadow-sm overflow-hidden transition-all">
              <button onClick={() => toggleItem(secao.id)} className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${secao.cor}`}>{secao.icone}</div>
                  <span className="font-semibold text-slate-800">{secao.titulo}</span>
                </div>
                {aberto === secao.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
              
              {aberto === secao.id && (
                <div className="px-5 pb-5 pt-0 border-t border-slate-100">
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