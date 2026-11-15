"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Lock, Megaphone, Wrench, UserCircle, 
  FileText, Users, ChevronDown, ChevronUp, BookOpen, ShieldAlert, ChevronRight
} from "lucide-react";

export default function AjudaPage() {
  const [aberto, setAberto] = useState<string | null>("acesso");
  const [isSindico, setIsSindico] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checarPerfil() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (data?.role === "sindico") setIsSindico(true);
      }
      setLoading(false);
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
      icone: <Lock className="w-5 h-5 text-purple-600" />,
      cor: "bg-purple-100",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm">
          <li><strong>Login:</strong> Use o e-mail e a senha que você cadastrou no primeiro acesso.</li>
          <li><strong>Meu Perfil:</strong> No menu inicial, acesse "Meu Perfil" para atualizar seu número de WhatsApp. É muito importante preencher o <strong>Ponto de Referência</strong> (ex: portão azul) e o <strong>Link do Google Maps</strong>, para facilitar a entrega de encomendas.</li>
          <li><strong>Contato de Recados:</strong> Se a administração precisar falar com você e não conseguir, ligará para o "Telefone de Recados" que você cadastrou no seu perfil.</li>
        </ul>
      )
    },
    {
      id: "avisos",
      titulo: "2. Mural de Avisos",
      icone: <Megaphone className="w-5 h-5 text-blue-600" />,
      cor: "bg-blue-100",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm">
          <li>Fique por dentro das manutenções, assembleias e comunicados oficiais do condomínio.</li>
          <li><strong>Anexos:</strong> Se aparecer um ícone de clipe de papel 📎 ao lado do título do aviso, significa que há um documento (como uma Ata ou Edital). Clique no botão <strong>"Visualizar Anexo"</strong> para abrir o arquivo direto no seu celular.</li>
        </ul>
      )
    },
    {
      id: "chamados",
      titulo: "3. Chamados de Manutenção",
      icone: <Wrench className="w-5 h-5 text-orange-600" />,
      cor: "bg-orange-100",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm">
          <li>Encontrou um problema na área comum (lâmpada queimada, vazamento, portão com defeito)? Vá em <strong>Chamados</strong> e clique em <strong>"Abrir Chamado"</strong>.</li>
          <li>Escolha o tipo de serviço (Ex: Elétrica), selecione o sub-serviço, descreva o problema e informe o local exato.</li>
          <li>Você pode acompanhar o status do chamado (Aberto, Em Andamento ou Resolvido) e ver qual profissional foi designado.</li>
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
          <li>Precisa de um pedreiro, eletricista, piscineiro ou serralheiro de confiança? Acesse este menu para ver a lista de profissionais <strong>homologados e indicados pelo condomínio</strong>.</li>
          <li>Veja a especialidade, CPF/CNPJ e endereço. Para chamar o profissional, basta clicar no botão verde do <strong>WhatsApp</strong> ou no botão de <strong>Ligar</strong>.</li>
        </ul>
      )
    },
    {
      id: "documentos",
      titulo: "5. Documentos do Condomínio",
      icone: <FileText className="w-5 h-5 text-emerald-600" />,
      cor: "bg-emerald-100",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm">
          <li>Acesse a pasta virtual do condomínio a qualquer momento.</li>
          <li>Encontre Atas de Assembleia, o Regimento Interno e Contratos, todos organizados por categorias para facilitar a sua busca.</li>
          <li>Você pode visualizar os documentos ou baixá-los no seu celular.</li>
        </ul>
      )
    },
    {
      id: "moradores",
      titulo: "6. Lista de Moradores",
      icone: <Users className="w-5 h-5 text-slate-600" />,
      cor: "bg-slate-200",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm">
          <li>Uma lista com os contatos dos vizinhos para facilitar a comunicação.</li>
          <li>É útil para avisar sobre uma encomenda entregue no local errado, por exemplo.</li>
          <li>Você pode clicar no botão "WhatsApp" para mandar uma mensagem direta. <em>(Use com respeito à privacidade dos vizinhos).</em></li>
        </ul>
      )
    }
  ];

  return (
    <div className="flex-1 w-full flex flex-col items-center p-4 md:p-12 bg-slate-50/50 min-h-screen">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        
        {/* CABEÇALHO DO GUIA COM BOTÃO DE VOLTAR DESTACADO */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
          <Link href="/protected">
            <Button variant="outline" className="flex items-center gap-2 text-slate-700 bg-white hover:bg-slate-100 border-slate-300 shadow-sm">
              <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 border-l-0 sm:border-l sm:pl-4 border-slate-200">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-7 h-7 text-blue-600" /> Guia do Morador
              </h1>
              <p className="text-sm text-slate-500 mt-1">Tudo o que você precisa saber para usar o aplicativo.</p>
            </div>
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
            <div 
              key={secao.id} 
              className="bg-white border rounded-xl shadow-sm overflow-hidden transition-all"
            >
              <button 
                onClick={() => toggleItem(secao.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${secao.cor}`}>
                    {secao.icone}
                  </div>
                  <span className="font-semibold text-slate-800">{secao.titulo}</span>
                </div>
                {aberto === secao.id ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              
              {aberto === secao.id && (
                <div className="px-5 pb-5 pt-0 border-t border-slate-100">
                  <div className="pt-3">
                    {secao.conteudo}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-6 pb-8">
          <p className="text-sm text-slate-500">
            Dúvidas adicionais? Entre em contato com a administração do condomínio.
          </p>
        </div>

      </div>
    </div>
  );
}