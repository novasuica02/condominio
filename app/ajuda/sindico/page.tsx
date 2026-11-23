"use client";

import { useState } from "react";
import {
  Megaphone, Wrench, UserCircle, FileText, Users, Shield,
  ChevronDown, ChevronUp, Settings, AlertTriangle, Mail,
  MessageCircle, Bell, ClipboardList, CalendarClock, CheckCircle2,
  Tags, Building2, Paperclip, History, UserCog, Info, Store,
} from "lucide-react";
import Header from "@/components/Header";

export default function ManualSindicoPage() {
  const [aberto, setAberto] = useState<string | null>("chamados");

  const toggleItem = (id: string) => setAberto(aberto === id ? null : id);

  const secoes = [
    {
      id: "visao-geral",
      titulo: "1. Visão geral e responsabilidades administrativas",
      icone: <Building2 className="w-5 h-5 text-blue-400" />,
      cor: "bg-blue-900/50",
      conteudo: (
        <div className="space-y-3 text-slate-300 text-sm">
          <p>O síndico e o subsíndico possuem as mesmas permissões administrativas nas funcionalidades de gestão do aplicativo.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Administrar avisos, chamados, documentos, usuários e cadastros de responsáveis.</li>
            <li>Configurar tipos de serviço, subserviços e responsáveis padrão.</li>
            <li>Acompanhar o histórico dos chamados e validar a conclusão dos atendimentos.</li>
            <li>Gerenciar as informações institucionais e as preferências de notificação disponíveis.</li>
          </ul>
          <p className="text-amber-200">As opções exibidas podem variar conforme a tela e as permissões efetivamente liberadas no aplicativo.</p>
        </div>
      ),
    },
    {
      id: "avisos",
      titulo: "2. Mural de avisos e comunicação com moradores",
      icone: <Megaphone className="w-5 h-5 text-blue-400" />,
      cor: "bg-blue-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li><strong>Criar:</strong> entre em Novo Aviso, informe um título objetivo e redija o comunicado com data, local e orientações relevantes.</li>
          <li><strong>Anexar:</strong> inclua arquivos de apoio, como comunicados, circulares ou documentos. Confira se o arquivo correto foi selecionado.</li>
          <li><strong>Editar:</strong> use a opção de edição do aviso para corrigir informações ou substituir o anexo.</li>
          <li><strong>Atualizar:</strong> quando houver informação complementar, utilize o recurso de atualização/histórico do aviso, se disponível, em vez de deixar os moradores sem contexto.</li>
          <li><strong>WhatsApp:</strong> selecione o aviso e os destinatários. O aplicativo prepara o texto e abre o WhatsApp; o envio só ocorre depois da confirmação no próprio WhatsApp.</li>
          <li>Antes de publicar, revise título, texto, datas, destinatários e anexos. O aviso é um canal oficial de comunicação do condomínio.</li>
        </ul>
      ),
    },
    {
      id: "chamados",
      titulo: "3. Gestão de chamados: abertura, triagem e acompanhamento",
      icone: <Wrench className="w-5 h-5 text-orange-400" />,
      cor: "bg-orange-900/50",
      conteudo: (
        <div className="space-y-3 text-slate-300 text-sm">
          <p>Na área Chamados, a administração pode consultar os registros dos moradores, abrir um chamado quando necessário e acessar os detalhes para acompanhar ou administrar o atendimento.</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Abra a lista de Chamados e localize o registro. Utilize os filtros disponíveis para facilitar a consulta.</li>
            <li>Entre no chamado para conferir título, descrição, tipo e subserviço, localização, morador solicitante, arquivos da abertura e histórico.</li>
            <li>Verifique se a descrição e a localização permitem identificar corretamente o problema. Se necessário, solicite informações complementares pelo próprio chamado.</li>
            <li>Confira o responsável atual e o vencimento (VCTO). A atribuição deve corresponder à especialidade e à responsabilidade pelo serviço.</li>
            <li>Acompanhe as movimentações até a validação final. Não considere um atendimento encerrado apenas porque o prestador informou que terminou.</li>
          </ol>
          <p><strong>Status do fluxo:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Aberto:</strong> chamado registrado, aguardando encaminhamento ou início do atendimento.</li>
            <li><strong>Em Andamento:</strong> atendimento em execução ou aguardando continuidade do prestador.</li>
            <li><strong>Em Análise:</strong> prestador registrou atendimento como resolvido e o chamado aguarda validação do morador ou da administração.</li>
            <li><strong>Resolvido:</strong> resolução confirmada pelo morador ou pela administração.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "responsaveis",
      titulo: "4. Responsáveis, categorias e atribuição de chamados",
      icone: <Users className="w-5 h-5 text-slate-400" />,
      cor: "bg-slate-700",
      conteudo: (
        <div className="space-y-3 text-slate-300 text-sm">
          <p>O cadastro de responsáveis reúne prestadores, administração, funcionários, gestão condominial e empresas terceirizadas, conforme as categorias cadastradas.</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Acesse a área de Prestadores/Responsáveis disponível na gestão de chamados.</li>
            <li>Selecione a categoria adequada e cadastre o nome e os dados de contato solicitados.</li>
            <li>Quando a pessoa precisar entrar no aplicativo, faça o vínculo com o usuário/login correspondente. O cadastro de responsável e a conta de acesso precisam estar corretamente associados.</li>
            <li>Ao administrar um chamado, confira o responsável atual e altere-o quando a execução precisar ser transferida.</li>
            <li>Após a troca, confira se o novo responsável recebeu a atribuição e se os dados do chamado continuam corretos.</li>
          </ol>
          <p><strong>Atenção:</strong> o responsável pelo chamado é diferente de um profissional indicado para contratação particular pelo morador. As indicações não substituem a atribuição formal de um chamado do condomínio.</p>
        </div>
      ),
    },
    {
      id: "tipos",
      titulo: "5. Tipos de serviço, subserviços e responsável padrão",
      icone: <Tags className="w-5 h-5 text-teal-400" />,
      cor: "bg-teal-900/50",
      conteudo: (
        <div className="space-y-3 text-slate-300 text-sm">
          <p>Essa configuração organiza os assuntos que o morador pode selecionar ao abrir um chamado e ajuda a encaminhar a solicitação ao responsável adequado.</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Abra a configuração de Tipos de Serviço.</li>
            <li>Cadastre ou revise o tipo principal, por exemplo, Hidráulica, Elétrica ou Elevadores.</li>
            <li>Dentro do tipo, cadastre subserviços mais específicos, com nomes que ajudem o morador a identificar o problema.</li>
            <li>Quando apropriado, associe ao subserviço um responsável padrão. Esse vínculo facilita o encaminhamento inicial do chamado.</li>
            <li>Revise periodicamente os nomes e responsáveis para evitar opções duplicadas ou desatualizadas.</li>
          </ol>
          <p>O responsável padrão é uma referência de encaminhamento. A administração deve conferir a atribuição efetiva no chamado e ajustá-la quando necessário.</p>
        </div>
      ),
    },
    {
      id: "vcto",
      titulo: "6. VCTO: previsão, prazo e negociação",
      icone: <CalendarClock className="w-5 h-5 text-amber-400" />,
      cor: "bg-amber-900/30",
      conteudo: (
        <div className="space-y-3 text-slate-300 text-sm">
          <p><strong>VCTO</strong> é a data de vencimento/previsão registrada para o atendimento do chamado. Ela serve para orientar o acompanhamento e a comunicação com o morador.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>O prazo inicial é calculado automaticamente em dias úteis, considerando o horário de abertura: até 12h em dia útil, a previsão inicial é o próximo dia útil; após 12h, considera-se o segundo dia útil. Aberturas no fim de semana começam a contar a partir do próximo dia útil.</li>
            <li>O cálculo descrito não considera feriados, salvo se houver regra específica implementada futuramente.</li>
            <li>O síndico e o subsíndico podem ajustar o VCTO quando houver negociação ou necessidade justificada, assim como o morador.</li>
            <li>O prestador não altera diretamente o VCTO no aplicativo. Se precisar de mais prazo, deve comunicar a necessidade e combinar a nova previsão com o morador/administração.</li>
            <li>Registre a nova data somente depois de alinhá-la com o responsável e o morador. A alteração deve ficar clara no acompanhamento do chamado.</li>
          </ul>
          <p className="text-amber-200">A data é uma previsão operacional. Mudanças devem ser comunicadas com transparência e acompanhadas pelo histórico do chamado.</p>
        </div>
      ),
    },
    {
      id: "atendimento",
      titulo: "7. Registrar atendimento, analisar e devolver",
      icone: <ClipboardList className="w-5 h-5 text-orange-400" />,
      cor: "bg-orange-900/50",
      conteudo: (
        <div className="space-y-3 text-slate-300 text-sm">
          <p>O prestador utiliza a ação <strong>Registrar atendimento</strong>. Ele informa o que foi executado e se considera o problema resolvido.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Prestador informa que NÃO resolveu:</strong> registra o que fez, o que falta ou de que depende. O chamado permanece Em Andamento para continuidade.</li>
            <li><strong>Prestador informa que resolveu:</strong> registra o serviço realizado e o chamado passa para Em Análise. Isso não significa encerramento automático.</li>
            <li><strong>Validar:</strong> morador ou síndico/subsíndico confere o resultado. Se estiver resolvido, confirma a resolução e o status passa a Resolvido.</li>
            <li><strong>Devolver:</strong> se o problema persistir, escolha a opção de devolver para atendimento e informe obrigatoriamente o motivo. O chamado retorna para Em Andamento.</li>
          </ul>
          <p><strong>Boa prática:</strong> antes de confirmar ou devolver, leia o registro do prestador e os comentários do morador. Descreva o motivo da devolução de forma objetiva para orientar a próxima visita.</p>
        </div>
      ),
    },
    {
      id: "historico-anexos",
      titulo: "8. Histórico, comentários e anexos",
      icone: <History className="w-5 h-5 text-blue-400" />,
      cor: "bg-blue-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>O histórico registra as movimentações e permite acompanhar a evolução do chamado.</li>
          <li>Leia os registros anteriores antes de alterar responsável, prazo ou situação.</li>
          <li>Arquivos enviados na abertura aparecem associados ao chamado; arquivos enviados durante uma atualização devem acompanhar a respectiva movimentação.</li>
          <li>Use anexos para documentar fotos do problema, comprovantes, relatórios e evidências úteis ao atendimento.</li>
          <li>Evite anexar documentos sem relação com o chamado e não inclua dados pessoais desnecessários.</li>
          <li>Os anexos de chamados são armazenados em área privada e acessados por usuários autorizados.</li>
        </ul>
      ),
    },
    {
      id: "email",
      titulo: "9. Notificações por e-mail",
      icone: <Mail className="w-5 h-5 text-green-400" />,
      cor: "bg-green-900/50",
      conteudo: (
        <div className="space-y-3 text-slate-300 text-sm">
          <p>O sistema pode enviar e-mails para comunicar a abertura e as movimentações dos chamados. Os eventos e destinatários dependem das preferências configuradas.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Consulte Configurações de Notificações para verificar quais perfis recebem cada evento.</li>
            <li>As preferências podem ser específicas para abertura, atualização, troca de responsável, Em Análise, Resolvido e Devolvido, conforme as opções disponíveis.</li>
            <li>Confira se os e-mails dos usuários estão corretos antes de investigar falhas de entrega.</li>
            <li>O registro da movimentação no aplicativo é independente do envio do e-mail. Se uma mensagem não chegar, consulte primeiro o histórico do chamado.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "whatsapp",
      titulo: "10. WhatsApp",
      icone: <MessageCircle className="w-5 h-5 text-green-400" />,
      cor: "bg-green-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>O aplicativo pode preparar mensagens relacionadas à abertura de chamados e a contatos disponíveis.</li>
          <li>Confira o destinatário e o conteúdo antes de prosseguir.</li>
          <li>O WhatsApp abre com a mensagem preenchida; a pessoa precisa confirmar o envio no próprio WhatsApp.</li>
          <li>O recurso não deve ser tratado como envio automático. Mantenha telefones e números de WhatsApp atualizados nos cadastros.</li>
        </ul>
      ),
    },
    {
      id: "documentos",
      titulo: "11. Documentos do condomínio",
      icone: <FileText className="w-5 h-5 text-emerald-400" />,
      cor: "bg-emerald-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Utilize a área Documentos para publicar arquivos oficiais e organizá-los por categoria, como atas, contratos e regimento interno.</li>
          <li>Antes de enviar, confira o título, a categoria e o arquivo selecionado.</li>
          <li>Substitua ou atualize documentos quando houver nova versão, evitando manter orientações antigas como se fossem atuais.</li>
          <li>Os usuários visualizam os documentos conforme as permissões configuradas no aplicativo.</li>
        </ul>
      ),
    },
    {
      id: "classificados",
      titulo: "12. Classificados: administração, publicação e renovação",
      icone: <Store className="w-5 h-5 text-amber-400" />,
      cor: "bg-amber-900/40",
      conteudo: (
        <div className="space-y-3 text-slate-300 text-sm">
          <p>Classificados é o espaço de anúncios entre moradores. Não deve ser confundido com os chamados de manutenção nem com o cadastro de Profissionais Indicados, que serve para divulgar contatos de profissionais para serviços particulares.</p>
          <p><strong>Configurações do módulo</strong></p>
          <ul className="list-disc pl-5 space-y-2">
            <li>A configuração do condomínio define o prazo de validade dos anúncios por meio de <code>classificados_validade_dias</code>. Se não houver valor configurado, a função de renovação utiliza 30 dias.</li>
            <li>A configuração <code>classificados_aprovacao</code> determina se a publicação segue o modo automático ou exige aprovação administrativa.</li>
            <li>O comportamento efetivo deve ser conferido na configuração vigente do condomínio. Não presuma que todos os anúncios serão publicados automaticamente ou que todos dependerão de aprovação.</li>
          </ul>
          <p><strong>Acompanhamento das situações</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Pendente:</strong> aguarda aprovação quando a configuração exige análise administrativa.</li>
            <li><strong>Ativo:</strong> publicação disponível aos moradores até o fim da validade.</li>
            <li><strong>Rejeitado:</strong> publicação não aprovada; quando houver motivo registrado, ele pode ser consultado pelo anunciante.</li>
            <li><strong>Encerrado:</strong> situação exibida na área Meus Anúncios.</li>
            <li><strong>Expirado:</strong> prazo de publicação terminou e o anúncio deixa de aparecer na listagem pública.</li>
          </ul>
          <p><strong>Renovação</strong></p>
          <ul className="list-disc pl-5 space-y-2">
            <li>A função de renovação aceita anúncios com status Ativo ou Expirado, desde que não estejam em processo de exclusão.</li>
            <li>O morador autor pode renovar o próprio anúncio. A administração do condomínio também pode executar a renovação, conforme a permissão administrativa.</li>
            <li>Quando a renovação é feita pela administração, o anúncio volta a Ativo. Quando solicitada pelo morador, o resultado depende da configuração: modo automático ativa a publicação; modo com aprovação deixa o anúncio Pendente.</li>
            <li>Na ativação, o sistema registra a nova data de publicação e calcula a validade usando o prazo configurado (padrão de 30 dias). Se ficar pendente, a data de publicação e a validade permanecem sem preenchimento até a aprovação.</li>
            <li>A renovação cancela a data de exclusão programada, registra a data da renovação, incrementa o contador de renovações e limpa eventual motivo de rejeição anterior.</li>
          </ul>
          <p><strong>Diferença entre editar e renovar</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Editar altera categoria, tipo, título, descrição, valor, contato e fotos, sem modificar status, validade ou histórico de renovação.</li>
            <li>Renovar solicita novo período de publicação e pode alterar o status conforme as regras acima.</li>
            <li>Anúncios em processo de exclusão não podem ser editados nem renovados pela função analisada.</li>
          </ul>
          <p className="text-amber-200">O procedimento de encerramento manual e a rotina administrativa de exclusão definitiva não foram incluídos como instruções operacionais porque ainda não foram confirmados no código analisado.</p>
        </div>
      ),
    },
    {
      id: "indicacoes",
      titulo: "13. Profissionais indicados aos moradores",
      icone: <UserCircle className="w-5 h-5 text-teal-400" />,
      cor: "bg-teal-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Cadastre profissionais que podem ser consultados pelos moradores para serviços particulares.</li>
          <li>Informe especialidade e contatos úteis, mantendo os dados atualizados.</li>
          <li>Essas indicações não equivalem à contratação pelo condomínio nem à atribuição de chamados de manutenção.</li>
        </ul>
      ),
    },
    {
      id: "usuarios",
      titulo: "14. Usuários, perfis e permissões",
      icone: <Shield className="w-5 h-5 text-blue-400" />,
      cor: "bg-blue-900/50",
      conteudo: (
        <div className="space-y-3 text-slate-300 text-sm">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Síndico e subsíndico:</strong> mesmas permissões administrativas nas funções de gestão.</li>
            <li><strong>Morador:</strong> acessa os recursos destinados aos moradores, abre e acompanha os próprios chamados, comenta, anexa arquivos e participa da validação da resolução.</li>
            <li><strong>Prestador:</strong> acessa os chamados atribuídos a ele e registra os atendimentos permitidos. Não possui acesso administrativo geral e não altera diretamente o VCTO.</li>
          </ul>
          <p>Na área de Gestão, utilize as opções disponíveis para administrar acessos e dados institucionais. Confira o perfil antes de conceder ou alterar permissões.</p>
        </div>
      ),
    },
    {
      id: "config",
      titulo: "15. Configurações do condomínio",
      icone: <Settings className="w-5 h-5 text-purple-400" />,
      cor: "bg-purple-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Revise os dados institucionais, como nome, logotipo e endereço, quando esses campos estiverem disponíveis.</li>
          <li>Revise as configurações de notificação e os destinatários por evento.</li>
          <li>Após qualquer alteração, confira se os dados foram salvos e se a apresentação do aplicativo continua correta.</li>
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
              Guia detalhado de administração, chamados, responsáveis, prazos e comunicação do condomínio.
            </p>
          </div>
        </div>
        <div className="bg-orange-900/20 border border-orange-700/50 p-4 rounded-xl flex gap-3 text-orange-200 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>O síndico e o subsíndico possuem as mesmas permissões administrativas. Utilize o histórico dos chamados para manter decisões, prazos e atendimentos documentados.</p>
        </div>
        <div className="flex flex-col gap-3">
          {secoes.map((secao) => (
            <div key={secao.id} className="bg-slate-800 border border-slate-700 rounded-xl shadow-sm overflow-hidden transition-all">
              <button
                onClick={() => toggleItem(secao.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${secao.cor}`}>{secao.icone}</div>
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
