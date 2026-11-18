
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Lock,
  Megaphone,
  Wrench,
  UserCircle,
  FileText,
  Users,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ShieldAlert,
  ChevronRight,
  Mail,
  MessageCircle,
  ClipboardList,
} from "lucide-react";
import Header from "@/components/Header";

export default function AjudaPage() {
  const [aberto, setAberto] = useState<string | null>("acesso");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPrestador, setIsPrestador] = useState(false);

  useEffect(() => {
    async function checarPerfil() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        setIsAdmin(
          data?.role === "sindico" ||
          data?.role === "subsindico"
        );

        setIsPrestador(data?.role === "prestador");
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
          <li><strong>Login:</strong> utilize seu e-mail e senha cadastrados.</li>
          <li><strong>Meu Perfil:</strong> mantenha seus dados atualizados, incluindo telefone, WhatsApp, nome para recados, ponto de referência e link do Google Maps, quando disponíveis.</li>
          <li><strong>Mais de um morador:</strong> cada pessoa da residência pode ter seu próprio acesso, utilizando a mesma unidade, conforme o cadastro realizado pela administração.</li>
        </ul>
      ),
    },
    {
      id: "avisos",
      titulo: "2. Mural de Avisos",
      icone: <Megaphone className="w-5 h-5 text-blue-400" />,
      cor: "bg-blue-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Acompanhe comunicados, manutenções, assembleias e informações oficiais do condomínio.</li>
          <li>Quando houver um anexo, utilize a opção "Visualizar Anexo" para abrir o documento.</li>
          <li>Consulte também as atualizações publicadas nos avisos para acompanhar informações complementares.</li>
          <li>Os avisos são publicados pela administração do condomínio.</li>
        </ul>
      ),
    },
    {
      id: "chamados",
      titulo: "3. Chamados de Manutenção",
      icone: <Wrench className="w-5 h-5 text-orange-400" />,
      cor: "bg-orange-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li><strong>Abrir chamado:</strong> acesse "Chamados" e clique em "Abrir".</li>
          <li>Escolha o tipo de serviço, informe o título, descreva o problema e indique sua localização.</li>
          <li>Se desejar, utilize o botão de localização para informar sua posição pelo Google Maps.</li>
          <li><strong>Acompanhar:</strong> consulte seus chamados e acompanhe o status e o histórico das movimentações.</li>
          <li><strong>Aberto:</strong> chamado registrado e aguardando atendimento ou atribuição.</li>
          <li><strong>Em Andamento:</strong> atendimento em execução pelo prestador responsável.</li>
          <li><strong>Em Análise:</strong> situação utilizada quando o atendimento aguarda análise ou validação, conforme o fluxo do chamado.</li>
          <li><strong>Resolvido:</strong> chamado marcado como concluído.</li>
          <li>As opções de gerenciamento e alteração dependem do perfil de acesso.</li>
        </ul>
      ),
    },
    {
      id: "email",
      titulo: "4. Notificações por E-mail",
      icone: <Mail className="w-5 h-5 text-green-400" />,
      cor: "bg-green-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>O aplicativo pode enviar e-mails quando um chamado é aberto ou recebe movimentações.</li>
          <li>As mensagens podem informar abertura, atualização, troca de prestador e outros eventos configurados pela administração.</li>
          <li>Os destinatários são definidos nas configurações de notificações do condomínio.</li>
          <li>Moradores e prestadores recebem as mensagens destinadas ao seu perfil, conforme as preferências configuradas.</li>
          <li>Mantenha seu endereço de e-mail atualizado no cadastro para receber as comunicações.</li>
        </ul>
      ),
    },
    {
      id: "whatsapp",
      titulo: "5. Comunicação pelo WhatsApp",
      icone: <MessageCircle className="w-5 h-5 text-green-400" />,
      cor: "bg-green-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Na abertura de um chamado, o aplicativo pode preparar uma mensagem para os contatos de notificação disponíveis.</li>
          <li>A mensagem contém informações do chamado e o endereço do aplicativo para consulta.</li>
          <li>Quando a opção estiver disponível, clique em "Enviar pelo WhatsApp".</li>
          <li>O WhatsApp será aberto com a mensagem preenchida. É necessário confirmar o envio no próprio aplicativo.</li>
          <li>Para facilitar a comunicação, mantenha seu telefone e WhatsApp atualizados no perfil.</li>
        </ul>
      ),
    },
    {
      id: "prestador",
      titulo: "6. Orientações para Prestadores",
      icone: <ClipboardList className="w-5 h-5 text-orange-400" />,
      cor: "bg-orange-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>O acesso de prestador é destinado ao profissional ou empresa vinculada ao condomínio.</li>
          <li>O prestador visualiza os chamados atribuídos à sua responsabilidade.</li>
          <li>Deve consultar a descrição, a localização e o histórico do chamado antes de realizar o serviço.</li>
          <li>As atualizações devem ser registradas no próprio chamado, permitindo que a administração acompanhe o atendimento.</li>
          <li>O prestador não possui as mesmas permissões administrativas do síndico e do subsíndico.</li>
          <li>Quando a responsabilidade por um chamado é transferida, o acesso para atendimento acompanha a atribuição atual.</li>
        </ul>
      ),
    },
    {
      id: "profissionais",
      titulo: "7. Serviços Profissionais (Indicações)",
      icone: <UserCircle className="w-5 h-5 text-teal-400" />,
      cor: "bg-teal-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Consulte profissionais indicados pelo condomínio, como pedreiros, eletricistas e piscineiros.</li>
          <li>Utilize os botões de WhatsApp ou telefone disponíveis para entrar em contato diretamente.</li>
          <li>Essas indicações são destinadas a serviços particulares dos moradores e não representam necessariamente prestadores responsáveis pelos chamados do condomínio.</li>
        </ul>
      ),
    },
    {
      id: "documentos",
      titulo: "8. Documentos do Condomínio",
      icone: <FileText className="w-5 h-5 text-emerald-400" />,
      cor: "bg-emerald-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Acesse a área de documentos para consultar os arquivos disponibilizados pelo condomínio.</li>
          <li>Consulte atas de reuniões, regimento interno, contratos e demais documentos disponíveis.</li>
          <li>Você poderá visualizar ou baixar os documentos conforme as permissões de acesso.</li>
        </ul>
      ),
    },
    {
      id: "moradores",
      titulo: "9. Lista de Moradores",
      icone: <Users className="w-5 h-5 text-slate-400" />,
      cor: "bg-slate-700",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Consulte os contatos dos moradores disponíveis no aplicativo.</li>
          <li>Utilize os dados de contato e os atalhos de WhatsApp, quando disponíveis, para facilitar a comunicação entre vizinhos.</li>
        </ul>
      ),
    },
    {
      id: "permissoes",
      titulo: "10. Perfis e Permissões de Acesso",
      icone: <Lock className="w-5 h-5 text-purple-400" />,
      cor: "bg-purple-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li><strong>Morador:</strong> pode consultar os avisos e documentos disponíveis, atualizar seu perfil, consultar os contatos e abrir e acompanhar seus próprios chamados.</li>
          <li><strong>Prestador:</strong> pode acessar os chamados atribuídos a ele e registrar as informações de atendimento permitidas.</li>
          <li><strong>Síndico:</strong> possui permissões administrativas para gerenciar usuários, chamados, prestadores, avisos e configurações do condomínio.</li>
          <li><strong>Subsíndico:</strong> possui as mesmas permissões administrativas do síndico nas funcionalidades de gestão.</li>
          <li>As permissões são controladas pelo perfil de cada usuário. Por isso, algumas opções do menu podem não aparecer para todos.</li>
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
              <BookOpen className="w-7 h-7 text-blue-500" />
              Guia de Ajuda
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Orientações para moradores e prestadores utilizarem o aplicativo.
            </p>
          </div>
        </div>

        {isAdmin && (
          <Link href="/ajuda/sindico" className="block">
            <div className="bg-red-600 hover:bg-red-700 transition-colors rounded-xl shadow-md p-6 flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full text-white">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-xl">
                    Manual do Síndico e Subsíndico
                  </h2>
                  <p className="text-red-100 text-sm mt-1">
                    Acesse o guia de gestão, cadastros e permissões.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        )}

        {isPrestador && (
          <div className="bg-orange-900/20 border border-orange-700/50 p-4 rounded-xl text-orange-200 text-sm">
            Este guia também contém orientações específicas para prestadores
            de serviços. Consulte a seção "Orientações para Prestadores".
          </div>
        )}

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
