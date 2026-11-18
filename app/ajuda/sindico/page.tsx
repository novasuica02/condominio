
"use client";

import { useState } from "react";
import {
  Megaphone,
  Wrench,
  UserCircle,
  FileText,
  Users,
  Shield,
  ChevronDown,
  ChevronUp,
  Settings,
  AlertTriangle,
  Mail,
  MessageCircle,
  Bell,
} from "lucide-react";
import Header from "@/components/Header";

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
          <li><strong>Criar aviso:</strong> clique em "Novo Aviso", informe o título, escreva a mensagem e anexe um documento, se necessário.</li>
          <li><strong>Editar aviso:</strong> utilize o botão "Editar" para alterar o conteúdo ou substituir o anexo.</li>
          <li><strong>Histórico:</strong> é possível acrescentar atualizações aos avisos, inclusive com novos documentos.</li>
          <li><strong>Disparar WhatsApp:</strong> utilize a opção "Disparar WhatsApp", selecione o aviso e escolha os moradores que receberão a mensagem.</li>
          <li><strong>Confirmação:</strong> o WhatsApp abre com a mensagem preparada. É necessário confirmar o envio no próprio aplicativo.</li>
        </ul>
      ),
    },
    {
      id: "chamados",
      titulo: "2. Gestão de Chamados",
      icone: <Wrench className="w-5 h-5 text-orange-400" />,
      cor: "bg-orange-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Consulte os chamados registrados pelos moradores no menu "Chamados".</li>
          <li><strong>Gerenciar:</strong> acesse um chamado para consultar seus dados e realizar as operações disponíveis ao perfil administrativo.</li>
          <li><strong>Atribuir prestador:</strong> selecione o profissional responsável pelo atendimento ou altere a atribuição, quando necessário.</li>
          <li><strong>SLA:</strong> defina o prazo previsto para atendimento ou solução.</li>
          <li><strong>Histórico:</strong> acompanhe os comentários e as movimentações registradas no chamado.</li>
          <li><strong>Status:</strong> acompanhe as situações Aberto, Em Andamento, Em Análise e Resolvido, conforme o fluxo disponível no aplicativo.</li>
          <li><strong>Tipos e sub-serviços:</strong> cadastre categorias como Hidráulica e Elétrica e seus respectivos serviços.</li>
          <li>É possível definir um prestador padrão para determinado sub-serviço.</li>
        </ul>
      ),
    },
    {
      id: "notificacoes",
      titulo: "3. Notificações por E-mail",
      icone: <Mail className="w-5 h-5 text-green-400" />,
      cor: "bg-green-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>O aplicativo envia notificações por e-mail relacionadas à abertura e às movimentações dos chamados.</li>
          <li><strong>Abertura:</strong> informa os destinatários selecionados sobre um novo chamado.</li>
          <li><strong>Atualização:</strong> comunica a movimentação realizada no chamado.</li>
          <li><strong>Troca de prestador:</strong> permite notificar os envolvidos na alteração da responsabilidade.</li>
          <li>Também existem configurações para eventos como Em Análise, Resolvido e Devolvido.</li>
          <li><strong>Configurar destinatários:</strong> acesse "Configurações de Notificações" para definir quem deve receber cada tipo de mensagem: síndico, subsíndico, morador ou prestador.</li>
          <li>As preferências são individuais por evento. Assim, receber uma notificação de abertura não significa necessariamente receber todas as demais.</li>
          <li>O envio de e-mail é independente da gravação da movimentação: uma eventual falha no e-mail não deve desfazer a alteração do chamado.</li>
        </ul>
      ),
    },
    {
      id: "whatsapp",
      titulo: "4. Notificações pelo WhatsApp",
      icone: <MessageCircle className="w-5 h-5 text-green-400" />,
      cor: "bg-green-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Na abertura de um chamado, o sistema prepara mensagens para os contatos disponíveis, incluindo síndicos e prestador responsável, quando houver.</li>
          <li>A mensagem contém o número do chamado, título, morador, localização, descrição e endereço do aplicativo.</li>
          <li>O responsável escolhe o destinatário e clica em "Enviar pelo WhatsApp".</li>
          <li>O WhatsApp abre com o texto preenchido. O envio precisa ser confirmado pelo usuário.</li>
          <li>O sistema utiliza o telefone ou WhatsApp cadastrado no perfil ou no cadastro do prestador.</li>
        </ul>
      ),
    },
    {
      id: "prestadores",
      titulo: "5. Prestadores de Serviços",
      icone: <Users className="w-5 h-5 text-slate-400" />,
      cor: "bg-slate-700",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Cadastre empresas e profissionais contratados pelo condomínio, como manutenção de elevadores, limpeza e portões.</li>
          <li>Acesse "Prestadores" na tela de Chamados.</li>
          <li>Cadastre nome, especialidade, telefone e demais informações necessárias.</li>
          <li>O cadastro pode ser vinculado a um usuário do aplicativo para permitir o acesso do prestador.</li>
          <li>O prestador acessa os chamados atribuídos à sua responsabilidade.</li>
        </ul>
      ),
    },
    {
      id: "profissionais",
      titulo: "6. Serviços Profissionais (Indicações)",
      icone: <UserCircle className="w-5 h-5 text-teal-400" />,
      cor: "bg-teal-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Cadastre profissionais indicados para uso particular dos moradores, como pedreiros, eletricistas e piscineiros.</li>
          <li>Acesse "Precisa de um Serviço?" e depois "Gerenciar Serviços".</li>
          <li>Esses profissionais são indicações e não devem ser confundidos com os prestadores responsáveis pelos chamados do condomínio.</li>
        </ul>
      ),
    },
    {
      id: "documentos",
      titulo: "7. Documentos do Condomínio",
      icone: <FileText className="w-5 h-5 text-emerald-400" />,
      cor: "bg-emerald-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Envie e organize documentos do condomínio.</li>
          <li>Gerencie categorias, como Atas, Contratos e Regimento Interno.</li>
          <li>Os documentos ficam disponíveis conforme as permissões de acesso do aplicativo.</li>
        </ul>
      ),
    },
    {
      id: "acessos",
      titulo: "8. Gestão de Usuários e Permissões",
      icone: <Shield className="w-5 h-5 text-blue-400" />,
      cor: "bg-blue-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li><strong>Síndico:</strong> possui acesso administrativo às funcionalidades de gestão do condomínio.</li>
          <li><strong>Subsíndico:</strong> possui as mesmas permissões administrativas do síndico nas funcionalidades de gestão.</li>
          <li><strong>Morador:</strong> acessa as funcionalidades destinadas aos moradores, incluindo avisos, documentos, perfil e chamados próprios.</li>
          <li><strong>Prestador:</strong> acessa os chamados atribuídos a ele e as funcionalidades de atendimento permitidas ao seu perfil.</li>
          <li>No menu "Gestão", os administradores podem gerenciar usuários e atualizar os dados do condomínio, conforme as opções disponíveis.</li>
        </ul>
      ),
    },
    {
      id: "configuracoes",
      titulo: "9. Configurações do Condomínio",
      icone: <Settings className="w-5 h-5 text-purple-400" />,
      cor: "bg-purple-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Gerencie informações institucionais do condomínio, como nome, logotipo e endereço.</li>
          <li>Acesse as configurações de notificações para controlar os destinatários dos e-mails por evento.</li>
          <li>As configurações administrativas são destinadas ao síndico e ao subsíndico.</li>
        </ul>
      ),
    },
  ];

  return (
    <div className="flex-1 w-full flex flex-col items-center p-4 md:p-12 bg-slate-900 min-h-screen">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <Header />

        <div className="flex items-center gap-3 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Settings className="w-7 h-7 text-blue-500" />
              Manual do Síndico e Subsíndico
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Guia de administração, gestão de chamados, comunicação e permissões do condomínio.
            </p>
          </div>
        </div>

        <div className="bg-orange-900/20 border border-orange-700/50 p-4 rounded-xl flex gap-3 text-orange-200 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>
            Este manual contém orientações sobre ferramentas administrativas.
            O acesso às funções depende do perfil e das permissões cadastradas.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {secoes.map((secao) => (
            <div key={secao.id} className="bg-slate-800 border border-slate-700 rounded-xl shadow-sm overflow-hidden transition-all">
              <button
                onClick={() => toggleItem(secao.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${secao.cor}`}>
                    {secao.icone}
                  </div>
                  <span className="font-semibold text-white">{secao.titulo}</span>
                </div>
                {aberto === secao.id
                  ? <ChevronUp className="w-5 h-5 text-slate-400" />
                  : <ChevronDown className="w-5 h-5 text-slate-400" />}
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
