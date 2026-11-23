"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Lock, Megaphone, Wrench, UserCircle, FileText, Users,
  ChevronDown, ChevronUp, BookOpen, ShieldAlert, ChevronRight,
  Mail, MessageCircle, ClipboardList, CalendarClock, CheckCircle2,
  Paperclip, History, MapPin, Info, AlertTriangle, Store,
} from "lucide-react";
import Header from "@/components/Header";

export default function AjudaPage() {
  const [aberto, setAberto] = useState<string | null>("acesso");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPrestador, setIsPrestador] = useState(false);
  const [perfilCarregado, setPerfilCarregado] = useState(false);

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

        setIsAdmin(data?.role === "sindico" || data?.role === "subsindico");
        setIsPrestador(data?.role === "prestador");
      }
      setPerfilCarregado(true);
    }

    checarPerfil();
  }, []);

  const toggleItem = (id: string) => setAberto(aberto === id ? null : id);

  const secoesMorador = [
    {
      id: "acesso",
      titulo: "1. Acesso ao aplicativo e Meu Perfil",
      icone: <Lock className="w-5 h-5 text-purple-400" />,
      cor: "bg-purple-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Entre com o e-mail e a senha associados ao seu cadastro.</li>
          <li>Em Meu Perfil, confira e mantenha atualizados nome, telefone, WhatsApp, e-mail e demais informações disponíveis.</li>
          <li>Quando houver os campos correspondentes, informe nome para recados, telefone para recados, ponto de referência e link do Google Maps. Esses dados podem ajudar a administração e o prestador a localizar você ou o local do serviço.</li>
          <li>Cada pessoa que tiver cadastro próprio pode utilizar seu próprio login. Em caso de dificuldade de acesso, procure a administração do condomínio.</li>
          <li>Não compartilhe sua senha. Ao usar um computador ou celular compartilhado, encerre a sessão ao terminar.</li>
        </ul>
      ),
    },
    {
      id: "avisos",
      titulo: "2. Mural de avisos",
      icone: <Megaphone className="w-5 h-5 text-blue-400" />,
      cor: "bg-blue-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Acesse o Mural de Avisos para consultar comunicados oficiais, manutenções programadas, assembleias e orientações da administração.</li>
          <li>Abra cada aviso e leia o conteúdo completo, observando datas, horários, locais e providências solicitadas.</li>
          <li>Quando houver arquivo anexado, utilize a opção de visualizar ou abrir o anexo.</li>
          <li>Verifique se o aviso recebeu atualizações posteriores, pois podem existir complementos ou mudanças de orientação.</li>
          <li>Os avisos são publicados pela administração. Se houver dúvida sobre um comunicado, entre em contato pelos canais oficiais do condomínio.</li>
        </ul>
      ),
    },
    {
      id: "abrir-chamado",
      titulo: "3. Como abrir um chamado de manutenção",
      icone: <Wrench className="w-5 h-5 text-orange-400" />,
      cor: "bg-orange-900/50",
      conteudo: (
        <div className="space-y-3 text-slate-300 text-sm">
          <ol className="list-decimal pl-5 space-y-2">
            <li>Acesse Chamados e escolha a opção para abrir um novo chamado.</li>
            <li>Selecione o tipo de serviço e, quando disponível, o subserviço que melhor descreve o problema.</li>
            <li>Escreva um título curto e específico. Exemplo: “Vazamento embaixo da pia da cozinha”.</li>
            <li>Descreva o que aconteceu, quando começou, se é contínuo ou intermitente e se existe algum risco ou agravamento.</li>
            <li>Informe a localização com o máximo de precisão: unidade, cômodo, área comum ou ponto de referência.</li>
            <li>Se o recurso estiver disponível, utilize a localização do Google Maps para complementar o endereço ou ponto de atendimento.</li>
            <li>Anexe fotos ou documentos úteis. Confira se as imagens mostram o problema e se o arquivo selecionado é o correto.</li>
            <li>Revise as informações e envie o chamado. Depois, volte à lista para acompanhar o registro.</li>
          </ol>
          <p className="text-amber-200">Quanto mais clara for a descrição e a localização, menor a chance de o prestador precisar solicitar informações básicas antes de iniciar o atendimento.</p>
        </div>
      ),
    },
    {
      id: "acompanhar",
      titulo: "4. Como acompanhar o chamado e entender os status",
      icone: <History className="w-5 h-5 text-blue-400" />,
      cor: "bg-blue-900/50",
      conteudo: (
        <div className="space-y-3 text-slate-300 text-sm">
          <ol className="list-decimal pl-5 space-y-2">
            <li>Entre em Chamados e selecione o registro desejado. O morador consulta os chamados vinculados ao próprio usuário.</li>
            <li>Na tela de detalhes, confira a descrição, o responsável, o VCTO, os arquivos e o histórico de movimentações.</li>
            <li>Consulte o histórico sempre que houver uma atualização: ele mostra os registros feitos durante o atendimento.</li>
            <li>Se precisar complementar a solicitação, utilize o campo de atualização/comentário e anexe os arquivos pertinentes, quando disponíveis.</li>
          </ol>
          <p><strong>Significado dos status:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Aberto:</strong> solicitação registrada e aguardando encaminhamento ou início do atendimento.</li>
            <li><strong>Em Andamento:</strong> o prestador está executando o serviço ou precisa dar continuidade.</li>
            <li><strong>Em Análise:</strong> o prestador informou que concluiu o serviço e o chamado aguarda sua validação ou a da administração.</li>
            <li><strong>Resolvido:</strong> a resolução foi confirmada.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "vcto",
      titulo: "5. VCTO: previsão e alteração após negociação",
      icone: <CalendarClock className="w-5 h-5 text-amber-400" />,
      cor: "bg-amber-900/30",
      conteudo: (
        <div className="space-y-3 text-slate-300 text-sm">
          <p>VCTO é a data de vencimento/previsão indicada para o atendimento do chamado. Ela ajuda você a acompanhar quando o serviço está previsto.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>A previsão inicial é calculada automaticamente em dias úteis: abertura até 12h em dia útil prevê o próximo dia útil; abertura após 12h prevê o segundo dia útil. Chamados abertos no sábado ou domingo começam a contar a partir do próximo dia útil.</li>
            <li>O cálculo informado não considera feriados, salvo regra específica futura.</li>
            <li>Se o prestador informar que precisa de mais tempo, converse com ele e alinhe uma nova data com a administração, quando necessário.</li>
            <li>Depois de combinar a nova previsão, o morador pode atualizar o VCTO na tela de detalhes do chamado, quando a opção estiver disponível.</li>
            <li>O síndico e o subsíndico também podem ajustar a data. O prestador não altera diretamente o VCTO pelo aplicativo.</li>
            <li>Não altere a data sem acordo: a atualização deve refletir a previsão realmente combinada.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "avaliacao",
      titulo: "6. Conferir o atendimento: confirmar ou devolver",
      icone: <CheckCircle2 className="w-5 h-5 text-green-400" />,
      cor: "bg-green-900/30",
      conteudo: (
        <div className="space-y-3 text-slate-300 text-sm">
          <p>Quando o prestador registra que resolveu o problema, o chamado passa para Em Análise. Essa etapa existe para que você possa conferir o resultado.</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Abra o chamado e leia o registro do atendimento feito pelo prestador.</li>
            <li>Confira se o problema descrito na abertura realmente foi solucionado.</li>
            <li>Se estiver resolvido, utilize a opção de confirmar a resolução, quando disponível. O status passa a Resolvido.</li>
            <li>Se não estiver resolvido, escolha a opção de devolver para atendimento e descreva o motivo de forma objetiva. O chamado retorna para Em Andamento.</li>
          </ol>
          <p className="text-amber-200">Não confirme a resolução apenas porque houve uma visita. Confirme quando o problema estiver efetivamente solucionado. Se ainda houver falha, detalhe o que continua acontecendo.</p>
        </div>
      ),
    },
    {
      id: "comentarios-anexos",
      titulo: "7. Comentários, atualizações e anexos",
      icone: <Paperclip className="w-5 h-5 text-blue-400" />,
      cor: "bg-blue-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Você pode complementar as informações do chamado enquanto ele estiver em Aberto, Em Andamento ou Em Análise, conforme as opções disponíveis na tela.</li>
          <li>Use comentários para informar novos sintomas, horários em que o problema ocorre, restrições de acesso ou detalhes que ajudem o prestador.</li>
          <li>Inclua fotos ou documentos relacionados à atualização. Sempre confira se o arquivo foi anexado à movimentação correta.</li>
          <li>Os arquivos da abertura ficam associados ao chamado; os arquivos enviados em uma atualização devem aparecer junto daquela movimentação no histórico.</li>
          <li>Não anexe documentos pessoais ou informações que não sejam necessárias para a manutenção.</li>
        </ul>
      ),
    },
    {
      id: "email",
      titulo: "8. Notificações por e-mail",
      icone: <Mail className="w-5 h-5 text-green-400" />,
      cor: "bg-green-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>O aplicativo pode enviar e-mails sobre abertura e movimentações dos chamados, conforme os eventos e destinatários configurados pela administração.</li>
          <li>Mantenha seu e-mail atualizado no perfil e confira também as pastas de spam ou lixo eletrônico.</li>
          <li>Nem todo usuário necessariamente recebe todos os tipos de mensagem: os destinatários dependem das preferências administrativas por evento.</li>
          <li>Se não receber uma mensagem, consulte o chamado no aplicativo. O histórico é a referência para verificar se a movimentação foi registrada.</li>
        </ul>
      ),
    },
    {
      id: "whatsapp",
      titulo: "9. Comunicação pelo WhatsApp",
      icone: <MessageCircle className="w-5 h-5 text-green-400" />,
      cor: "bg-green-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Quando a opção estiver disponível, o aplicativo prepara uma mensagem com informações do chamado ou do aviso.</li>
          <li>Confira o número e o texto. O WhatsApp será aberto com a mensagem preenchida.</li>
          <li>O envio precisa ser confirmado por você no próprio WhatsApp; abrir a conversa não significa que a mensagem foi enviada.</li>
          <li>Mantenha o número de telefone e WhatsApp atualizados no perfil.</li>
        </ul>
      ),
    },
    {
      id: "documentos",
      titulo: "10. Documentos do condomínio",
      icone: <FileText className="w-5 h-5 text-emerald-400" />,
      cor: "bg-emerald-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Acesse Documentos para consultar os arquivos disponibilizados pela administração.</li>
          <li>Os arquivos podem incluir atas, regimento interno, contratos e outros documentos de interesse coletivo.</li>
          <li>Abra ou baixe o documento conforme as opções apresentadas na tela.</li>
          <li>Em caso de dúvida sobre a versão ou validade de um documento, confirme com a administração.</li>
        </ul>
      ),
    },
    {
      id: "moradores",
      titulo: "11. Lista de moradores e contatos",
      icone: <Users className="w-5 h-5 text-slate-400" />,
      cor: "bg-slate-700",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Consulte os contatos disponibilizados na área de moradores.</li>
          <li>Utilize telefone ou WhatsApp apenas para assuntos pertinentes e respeite a privacidade dos vizinhos.</li>
          <li>Se seus próprios dados estiverem incorretos, atualize o perfil ou solicite correção à administração.</li>
        </ul>
      ),
    },
    {
      id: "classificados",
      titulo: "12. Classificados: anúncios entre moradores",
      icone: <Store className="w-5 h-5 text-amber-400" />,
      cor: "bg-amber-900/40",
      conteudo: (
        <div className="space-y-3 text-slate-300 text-sm">
          <p>O módulo Classificados permite que moradores publiquem anúncios de compra, venda, procura, serviços, imóveis, doações e outros assuntos de interesse entre moradores. Ele não substitui os chamados de manutenção do condomínio.</p>
          <p><strong>Consultar e pesquisar anúncios</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Acesse Classificados para consultar as publicações ativas.</li>
            <li>Use a pesquisa por título ou descrição e os filtros de categoria para localizar anúncios.</li>
            <li>Confira a descrição e as informações de contato apresentadas na publicação. Combine diretamente com o anunciante os detalhes da negociação.</li>
          </ul>
          <p><strong>Publicar um anúncio</strong></p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Escolha a categoria e indique se está oferecendo algo ou procurando.</li>
            <li>Informe título e descrição. O título aceita até 100 caracteres e a descrição até 2.000.</li>
            <li>O valor é opcional. Informe nome e telefone/WhatsApp para contato, se desejar.</li>
            <li>É possível adicionar até 5 fotos, nos formatos JPG, PNG ou WEBP, com até 5 MB cada.</li>
            <li>Ao enviar, a publicação segue a configuração do condomínio: publicação automática ou envio para aprovação administrativa.</li>
          </ol>
          <p><strong>Meus anúncios e edição</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Em Meus Anúncios, acompanhe a situação das suas publicações, inclusive pendentes, ativas, rejeitadas, encerradas ou expiradas.</li>
            <li>Na edição, é possível alterar categoria, tipo, título, descrição, valor, contato e fotos. Também é possível remover fotos, adicionar outras e reorganizar a ordem; a primeira será a foto principal.</li>
            <li>A edição não altera o status nem renova a validade. Um anúncio expirado continua expirado depois de editado.</li>
            <li>Um anúncio em processo de exclusão não pode ser editado.</li>
          </ul>
          <p><strong>Validade e renovação</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>A validade é definida pela configuração do condomínio. Quando não houver valor configurado, o sistema utiliza 30 dias.</li>
            <li>Quando um anúncio expira, ele deixa de aparecer na lista pública. Consulte Meus Anúncios para verificar a situação e a opção Renovar, quando disponível.</li>
            <li>A renovação de um anúncio ativo ou expirado reinicia o período de validade. Conforme a configuração, a publicação pode voltar automaticamente como ativa ou ficar pendente de aprovação.</li>
            <li>Se a renovação ficar pendente, a nova publicação e a nova validade aguardam a aprovação. A exclusão programada é cancelada quando a renovação é solicitada.</li>
          </ul>
          <p className="text-amber-200">A edição e a renovação são ações diferentes: editar corrige o conteúdo; renovar solicita um novo período de publicação. O encerramento manual do anúncio não está descrito neste guia porque seu procedimento ainda não foi confirmado.</p>
        </div>
      ),
    },
    {
      id: "indicacoes",
      titulo: "13. Profissionais indicados para serviços particulares",
      icone: <UserCircle className="w-5 h-5 text-teal-400" />,
      cor: "bg-teal-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Consulte a área de profissionais indicados para encontrar contatos de prestadores de serviços particulares, como eletricistas, pedreiros e piscineiros.</li>
          <li>Use os atalhos de telefone ou WhatsApp quando disponíveis.</li>
          <li>Essas indicações não são a mesma coisa que os responsáveis cadastrados para atender chamados do condomínio. A contratação particular é tratada diretamente entre o morador e o profissional.</li>
        </ul>
      ),
    },
  ];

  const secoesPrestador = [
    {
      id: "p-acesso",
      titulo: "1. Acesso e identificação do prestador",
      icone: <Lock className="w-5 h-5 text-purple-400" />,
      cor: "bg-purple-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Entre com o e-mail e a senha vinculados ao seu cadastro de responsável.</li>
          <li>O acesso precisa estar associado corretamente ao cadastro do prestador/responsável feito pela administração.</li>
          <li>Se não conseguir entrar ou não visualizar um chamado esperado, confira se está utilizando a conta correta e solicite à administração que verifique o vínculo e a atribuição.</li>
          <li>O prestador não possui permissões administrativas gerais do síndico e do subsíndico.</li>
        </ul>
      ),
    },
    {
      id: "p-lista",
      titulo: "2. Consultar os chamados atribuídos",
      icone: <ClipboardList className="w-5 h-5 text-orange-400" />,
      cor: "bg-orange-900/50",
      conteudo: (
        <ol className="list-decimal pl-5 space-y-2 text-slate-300 text-sm">
          <li>Acesse Chamados para visualizar os registros atribuídos à sua responsabilidade atual.</li>
          <li>Abra cada chamado para consultar título, descrição, tipo e subserviço, localização, dados do solicitante, VCTO e histórico.</li>
          <li>Leia os anexos da abertura e as atualizações anteriores antes de se deslocar ou iniciar o serviço.</li>
          <li>Se um chamado que deveria estar sob sua responsabilidade não aparecer, contate a administração para confirmar a atribuição. A visualização acompanha o responsável atualmente associado ao chamado.</li>
        </ol>
      ),
    },
    {
      id: "p-atendimento",
      titulo: "3. Executar o serviço e registrar o atendimento",
      icone: <Wrench className="w-5 h-5 text-orange-400" />,
      cor: "bg-orange-900/50",
      conteudo: (
        <div className="space-y-3 text-slate-300 text-sm">
          <p>Depois de verificar o chamado e realizar a avaliação ou o serviço, registre o resultado no próprio aplicativo. Utilize a ação <strong>Registrar atendimento</strong>.</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Descreva o que foi verificado e executado. Evite registros vagos como “feito” ou “ok”.</li>
            <li>Informe se o problema foi resolvido.</li>
            <li>Se ainda não foi resolvido, explique o que foi feito, o que falta e se depende de peça, nova visita, autorização ou outro profissional.</li>
            <li>Se considerar resolvido, descreva o serviço concluído e os testes ou verificações realizados.</li>
            <li>Quando necessário e disponível, anexe fotos ou documentos que comprovem o atendimento.</li>
          </ol>
        </div>
      ),
    },
    {
      id: "p-status",
      titulo: "4. O que acontece depois do registro",
      icone: <CheckCircle2 className="w-5 h-5 text-green-400" />,
      cor: "bg-green-900/30",
      conteudo: (
        <div className="space-y-3 text-slate-300 text-sm">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Você informa que NÃO resolveu:</strong> o registro fica no histórico e o chamado permanece Em Andamento para continuidade.</li>
            <li><strong>Você informa que resolveu:</strong> o chamado passa para Em Análise. O morador ou a administração precisa conferir e confirmar a resolução.</li>
            <li><strong>Se o chamado for devolvido:</strong> ele retorna para Em Andamento. Leia o motivo informado, esclareça dúvidas com a administração/morador e realize a continuidade necessária.</li>
            <li><strong>Resolvido:</strong> é a confirmação final feita pelo morador ou pela administração. O prestador não encerra sozinho o chamado.</li>
          </ul>
          <p className="text-amber-200">Registrar que o serviço foi executado não equivale a confirmar que o problema foi resolvido. Seja preciso no relato para facilitar a validação.</p>
        </div>
      ),
    },
    {
      id: "p-vcto",
      titulo: "5. VCTO, prazos e necessidade de mais tempo",
      icone: <CalendarClock className="w-5 h-5 text-amber-400" />,
      cor: "bg-amber-900/30",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>VCTO é a data de vencimento/previsão do chamado. Consulte essa informação ao organizar os atendimentos.</li>
          <li>O prestador não altera diretamente o VCTO pelo aplicativo.</li>
          <li>Se precisar de prazo adicional, comunique a necessidade, explique o motivo e proponha uma data ao morador e/ou à administração.</li>
          <li>O morador, o síndico ou o subsíndico pode atualizar a data depois do alinhamento. Não considere uma alteração como aprovada até que ela esteja combinada e registrada.</li>
          <li>Informe com antecedência quando houver impedimento, falta de material, necessidade de peça ou dependência de terceiros.</li>
        </ul>
      ),
    },
    {
      id: "p-historico",
      titulo: "6. Histórico, comentários e anexos",
      icone: <Paperclip className="w-5 h-5 text-blue-400" />,
      cor: "bg-blue-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>O histórico é o registro das movimentações do chamado. Consulte-o antes de iniciar e sempre que retornar a um atendimento.</li>
          <li>Use os campos de atualização para comunicar andamento, impedimentos, necessidade de retorno e conclusão parcial.</li>
          <li>Anexe fotos do antes/depois, peças substituídas ou documentos relevantes quando isso ajudar a comprovar o serviço.</li>
          <li>Arquivos enviados durante uma atualização devem ficar relacionados à movimentação correspondente.</li>
          <li>Não inclua dados pessoais ou documentos que não tenham relação com o serviço.</li>
        </ul>
      ),
    },
    {
      id: "p-comunicacao",
      titulo: "7. Comunicação e notificações",
      icone: <Mail className="w-5 h-5 text-green-400" />,
      cor: "bg-green-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>O aplicativo pode enviar e-mails sobre chamados e movimentações, conforme as configurações da administração.</li>
          <li>Mantenha seu e-mail, telefone e WhatsApp atualizados no cadastro.</li>
          <li>Quando houver comunicação por WhatsApp, confira o destinatário e confirme o envio no próprio aplicativo.</li>
          <li>Mesmo que uma notificação não chegue, consulte o chamado no sistema para verificar a atribuição, o histórico e as informações atuais.</li>
        </ul>
      ),
    },
    {
      id: "p-conduta",
      titulo: "8. Boas práticas do atendimento",
      icone: <Info className="w-5 h-5 text-teal-400" />,
      cor: "bg-teal-900/50",
      conteudo: (
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
          <li>Leia o chamado completo antes de iniciar o serviço.</li>
          <li>Registre informações claras, respeitosas e objetivas.</li>
          <li>Avise sobre atrasos e impedimentos assim que forem identificados.</li>
          <li>Não marque como resolvido se o problema persistir ou se ainda houver etapa importante pendente.</li>
          <li>Se a atribuição estiver incorreta, solicite à administração que faça o ajuste.</li>
          <li>O aplicativo é o local de registro do atendimento: mantenha o histórico atualizado para que morador e administração acompanhem o serviço.</li>
        </ul>
      ),
    },
  ];

  const renderSecoes = (secoes: typeof secoesMorador) => (
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
  );

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
              Orientações para moradores e prestadores utilizarem o aplicativo Nova Suíça 02.
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
                  <h2 className="text-white font-bold text-xl">Manual do Síndico e Subsíndico</h2>
                  <p className="text-red-100 text-sm mt-1">Gestão de chamados, cadastros, responsáveis, prazos e configurações.</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        )}

        <div className="bg-blue-900/20 border border-blue-700/50 p-4 rounded-xl text-blue-200 text-sm">
          {isPrestador
            ? "Você está consultando o guia geral. Para orientações de execução e registro de serviços, abra a seção específica para prestadores."
            : "Selecione os tópicos para consultar os procedimentos. As opções disponíveis no aplicativo dependem do seu perfil de acesso."}
        </div>

        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4">
          <h2 className="text-white font-bold text-lg mb-2">Parte A — Manual do Morador</h2>
          <p className="text-slate-400 text-sm">Abertura de solicitações, acompanhamento, comunicação e validação dos serviços.</p>
        </div>
        {renderSecoes(secoesMorador)}

        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 mt-3">
          <h2 className="text-white font-bold text-lg mb-2">Parte B — Manual do Prestador</h2>
          <p className="text-slate-400 text-sm">Consulta dos chamados atribuídos, execução, registro do atendimento e comunicação de prazos.</p>
        </div>
        {renderSecoes(secoesPrestador)}

        {perfilCarregado && !isAdmin && !isPrestador && (
          <p className="text-xs text-slate-500 text-center">
            Este guia apresenta também orientações de prestadores para facilitar a compreensão do fluxo de atendimento.
          </p>
        )}
      </div>
    </div>
  );
}
