
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  LogOut,
  Building2,
  HelpCircle,
  BookOpen,
  Bell,
  BellRing,
  Clock,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HeaderProps {
  showBackButton?: boolean;
  backUrl?: string;
  backText?: string;
}

interface Notificacao {
  id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida_em: string | null;
  created_at: string;
  url_destino: string | null;
}

export default function Header({
  showBackButton = true,
  backUrl = "/protected",
  backText = "Menu",
}: HeaderProps) {
  const router = useRouter();
  const popupRef = useRef<HTMLDivElement>(null);

  const [nomeUsuario, setNomeUsuario] = useState("");
  const [config, setConfig] = useState<any>(null);
  const [role, setRole] = useState("");
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);

  const [popupAberto, setPopupAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregandoNotificacoes, setCarregandoNotificacoes] = useState(false);
  const [processandoId, setProcessandoId] = useState<number | null>(null);
  const [erroNotificacoes, setErroNotificacoes] = useState("");

  const [usuarioId, setUsuarioId] = useState("");
  const [condominioId, setCondominioId] = useState<number | null>(null);

  // Carrega somente as notificações não lidas
  async function carregarNotificacoes(
    moradorId: string,
    condId: number
  ) {
    const supabase = createClient();

    setCarregandoNotificacoes(true);
    setErroNotificacoes("");

    const { data, error } = await supabase
      .from("notificacoes_morador")
      .select("id, tipo, titulo, mensagem, lida_em, created_at, url_destino")
      .eq("condominio_id", condId)
      .eq("morador_id", moradorId)
      .is("lida_em", null)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Erro ao carregar notificações:", error);
      setErroNotificacoes("Não foi possível carregar as notificações.");
      setCarregandoNotificacoes(false);
      return;
    }

    setNotificacoes((data || []) as Notificacao[]);

    const { count, error: countError } = await supabase
      .from("notificacoes_morador")
      .select("id", { count: "exact", head: true })
      .eq("condominio_id", condId)
      .eq("morador_id", moradorId)
      .is("lida_em", null);

    if (countError) {
      console.error("Erro ao atualizar contador:", countError);
    } else {
      setNotificacoesNaoLidas(count || 0);
    }

    setCarregandoNotificacoes(false);
  }

  // Carrega os dados do usuário e do condomínio
  useEffect(() => {
    async function carregarDados() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("nome, email, role, condominio_id")
        .eq("id", user.id)
        .single();

      if (!profile) return;

      setNomeUsuario(
        profile.nome || profile.email || user.email || "Usuário"
      );

      setRole(profile.role || "");
      setUsuarioId(user.id);
      setCondominioId(profile.condominio_id);

      const { data: cfg } = await supabase
        .from("condominio_config")
        .select("*")
        .eq("condominio_id", profile.condominio_id)
        .maybeSingle();

      if (cfg) {
        setConfig(cfg);
      }

      await carregarNotificacoes(user.id, profile.condominio_id);
    }

    carregarDados();
  }, []);

  // Fecha o popup ao clicar fora ou pressionar ESC
  useEffect(() => {
    if (!popupAberto) return;

    function fecharAoClicarFora(event: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setPopupAberto(false);
      }
    }

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPopupAberto(false);
      }
    }

    document.addEventListener("mousedown", fecharAoClicarFora);
    document.addEventListener("keydown", fecharComEscape);

    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, [popupAberto]);

  // Abre ou fecha o popup
  async function alternarPopup() {
    const novoEstado = !popupAberto;
    setPopupAberto(novoEstado);

    if (novoEstado && usuarioId && condominioId !== null) {
      await carregarNotificacoes(usuarioId, condominioId);
    }
  }

  // Marca como lida e abre o destino
  async function abrirNotificacao(notificacao: Notificacao) {
    if (processandoId !== null) return;

    setProcessandoId(notificacao.id);

    const supabase = createClient();

    const { error } = await supabase
      .from("notificacoes_morador")
      .update({ lida_em: new Date().toISOString() })
      .eq("id", notificacao.id)
      .eq("morador_id", usuarioId)
      .is("lida_em", null);

    if (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      alert("Não foi possível marcar a notificação como lida.");
      setProcessandoId(null);
      return;
    }

    // Remove a notificação imediatamente do popup
    setNotificacoes((anteriores) =>
      anteriores.filter((item) => item.id !== notificacao.id)
    );

    // Atualiza o contador
    setNotificacoesNaoLidas((anterior) => Math.max(0, anterior - 1));

    const destino =
      notificacao.url_destino &&
      notificacao.url_destino.startsWith("/") &&
      !notificacao.url_destino.startsWith("//")
        ? notificacao.url_destino
        : "/avisos";

    setPopupAberto(false);
    setProcessandoId(null);

    router.push(destino);
  }

  const isAdmin = role === "sindico" || role === "subsindico";

  return (
    <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm w-full mb-6">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Link href={backUrl}>
            <Button
              variant="outline"
              className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white h-8 px-3 text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> {backText}
            </Button>
          </Link>
        )}

        <div className="flex items-center gap-2">
          {config?.logo_url ? (
            <img
              src={config.logo_url}
              alt="Logo"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="bg-blue-600 p-1.5 rounded-md text-white">
              <Building2 className="w-5 h-5" />
            </div>
          )}

          <span className="font-bold text-white hidden sm:block">
            {config?.nome || "Condomínio"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-xs text-slate-400 hidden sm:block">
          {nomeUsuario}
        </span>

        {/* Central de notificações */}
        {role !== "" && (
          <div className="relative" ref={popupRef}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={alternarPopup}
              aria-label={`Notificações: ${notificacoesNaoLidas} não lidas`}
              aria-expanded={popupAberto}
              className={`relative bg-transparent border-slate-500 text-yellow-300 hover:bg-yellow-400/20 hover:text-yellow-200 px-2 ${
                popupAberto ? "bg-yellow-400/20 border-yellow-300" : ""
              }`}
            >
              <Bell className="w-4 h-4" />

              {notificacoesNaoLidas > 0 && (
                <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold border-2 border-slate-800">
                  {notificacoesNaoLidas > 99
                    ? "99+"
                    : notificacoesNaoLidas}
                </span>
              )}
            </Button>

            {popupAberto && (
              <div className="absolute right-0 top-full mt-3 w-[min(360px,calc(100vw-32px))] bg-slate-900 border border-yellow-400 rounded-xl shadow-2xl z-50 overflow-hidden">

                {/* Cabeçalho amarelo-claro */}
                <div className="bg-yellow-300 p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-slate-900 font-bold text-base">
                      Notificações
                    </h3>
                    <p className="text-slate-900 text-xs mt-1 font-medium">
                      {notificacoesNaoLidas} não lida(s)
                    </p>
                  </div>

                  <BellRing className="w-6 h-6 text-slate-900" />
                </div>

                <div className="max-h-[380px] overflow-y-auto">
                  {carregandoNotificacoes ? (
                    <div className="p-8 flex flex-col items-center gap-2 text-white">
                      <Loader2 className="w-6 h-6 animate-spin text-yellow-300" />
                      <span className="text-sm">
                        Carregando notificações...
                      </span>
                    </div>
                  ) : erroNotificacoes ? (
                    <div className="p-5 text-center text-red-300 text-sm">
                      {erroNotificacoes}
                    </div>
                  ) : notificacoes.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-10 h-10 text-yellow-300 mx-auto mb-3" />
                      <p className="text-white font-bold">
                        Você não tem novas notificações
                      </p>
                      <p className="text-white/70 text-xs mt-2">
                        Quando houver novidades, elas aparecerão aqui.
                      </p>
                    </div>
                  ) : (
                    notificacoes.map((notificacao) => {
                      const carregando = processandoId === notificacao.id;

                      return (
                        <button
                          key={notificacao.id}
                          type="button"
                          disabled={processandoId !== null}
                          onClick={() => abrirNotificacao(notificacao)}
                          className="w-full text-left p-4 border-b border-yellow-500/40 last:border-b-0 bg-yellow-400 hover:bg-yellow-300 transition-colors disabled:opacity-60"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full shrink-0 bg-amber-950/10 text-amber-950">
                              <BellRing className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-amber-950">
                                  {notificacao.titulo}
                                </p>

                                <span className="w-2 h-2 rounded-full bg-amber-950 shrink-0" />
                              </div>

                              <p className="text-xs text-amber-950 font-medium mt-1 line-clamp-2">
                                {notificacao.mensagem}
                              </p>

                              <div className="flex items-center gap-1 mt-2 text-[11px] text-amber-950">
                                <Clock className="w-3 h-3" />
                                {format(
                                  new Date(notificacao.created_at),
                                  "dd/MM/yyyy 'às' HH:mm",
                                  { locale: ptBR }
                                )}
                              </div>
                            </div>

                            {carregando && (
                              <Loader2 className="w-4 h-4 text-amber-950 animate-spin shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Rodapé azul-marinho */}
                <div className="p-3 border-t border-slate-700 text-center bg-slate-800">
                  <p className="text-xs text-white">
                    Exibindo até 5 notificações pendentes
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ajuda geral */}
        {role !== "" && (
          <Link href="/ajuda">
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white px-2 sm:px-3"
            >
              <HelpCircle className="w-4 h-4 sm:mr-2" />
              <span>Ajuda</span>
            </Button>
          </Link>
        )}

        {/* Manual administrativo */}
        {isAdmin && (
          <Link href="/ajuda/sindico">
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white px-2 sm:px-3"
            >
              <BookOpen className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Manual do Síndico</span>
              <span className="sm:hidden">Manual</span>
            </Button>
          </Link>
        )}

        {/* Sair */}
        <form action="/auth/logout" method="post">
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
