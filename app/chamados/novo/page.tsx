"use client";

import { useState, useEffect, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Send,
  MapPin,
  MessageCircle,
  CheckCircle,
  Mail,
} from "lucide-react";

type NotificacaoWhatsApp = {
  id: string;
  nome: string;
  tipo: string;
  telefone: string;
  link: string;
};

function normalizarTelefone(telefone: string) {
  let numero = telefone.replace(/\D/g, "");

  if (!numero) return "";

  if (!numero.startsWith("55")) {
    numero = "55" + numero;
  }

  return numero;
}

function criarLinkWhatsApp(telefone: string, mensagem: string) {
  const numero = normalizarTelefone(telefone);

  if (numero.length < 12 || numero.length > 13) {
    return "";
  }

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

export default function NovoChamadoPage() {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [subId, setSubId] = useState("");
  const [tipos, setTipos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [chamadoRegistrado, setChamadoRegistrado] = useState(false);
  const [numeroChamado, setNumeroChamado] = useState<number | null>(null);
  const [avisoEmail, setAvisoEmail] = useState("");
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [notificacoesWhatsApp, setNotificacoesWhatsApp] =
    useState<NotificacaoWhatsApp[]>([]);
  const [avisoWhatsApp, setAvisoWhatsApp] = useState("");

  useEffect(() => {
    async function carregar() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("tipos_servico")
        .select("*, sub_servicos(*, prestador_id)")
        .order("nome");

      if (error) {
        console.error("Erro ao carregar tipos de serviço:", error);
        return;
      }

      if (data && data.length > 0) {
        setTipos(data);
        setTipoId(data[0].id.toString());
      }
    }

    carregar();
  }, []);

  const tipoSelecionado = tipos.find(
    (t) => t.id.toString() === tipoId
  );

  const subServicos = tipoSelecionado?.sub_servicos || [];

  const subSelecionado = subServicos.find(
    (s: any) => s.id.toString() === subId
  );

  const handlePegarLocalizacao = () => {
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta geolocalização.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        setLocalizacao(
          `https://www.google.com/maps?q=${latitude},${longitude}`
        );
      },
      () => {
        alert(
          "Não foi possível obter a localização. Verifique se o GPS está ligado."
        );
      }
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("Usuário não autenticado.");
        return;
      }

      // 1. Busca os dados do usuário que abriu o chamado.
      const { data: perfil, error: perfilError } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", user.id)
        .single();

      if (perfilError || !perfil) {
        alert("Não foi possível localizar seu perfil.");
        return;
      }

      // 2. Identifica o prestador do serviço selecionado.
      const prestadorId = subSelecionado?.prestador_id
        ? Number(subSelecionado.prestador_id)
        : null;

      // 3. Grava o chamado e recupera seu ID.
      const { data: chamado, error } = await supabase
        .from("chamados")
        .insert([
          {
            autor_id: user.id,
            titulo,
            descricao,
            localizacao,
            tipo_servico_id: Number(tipoId),
            sub_servico_id: subId ? Number(subId) : null,
            prestador_id: prestadorId,
            prestador_inicial_id: prestadorId,
            status: prestadorId ? "em_andamento" : "aberto",
          },
        ])
        .select("id")
        .single();

      if (error) {
        console.error("Erro ao criar chamado:", error);
        alert("Erro ao criar chamado: " + error.message);
        return;
      }

      setNumeroChamado(chamado.id);

      // 4. Envia os e-mails automaticamente.
      try {
        const resposta = await fetch("/api/enviar-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chamadoId: chamado.id,
            evento: "abertura",
          }),
        });

        const resultado = await resposta.json().catch(() => null);

        if (!resposta.ok) {
          setAvisoEmail(
            resultado?.erro ||
              "Não foi possível enviar as notificações por e-mail."
          );
        } else {
          setEmailEnviado(true);
        }
      } catch (emailError) {
        console.error("Erro ao solicitar envio de e-mail:", emailError);

        setAvisoEmail(
          "Não foi possível conectar ao serviço de envio de e-mail."
        );
      }

      // 5. Prepara os destinatários do WhatsApp.
      try {
        const { data: sindicos } = await supabase
          .from("profiles")
          .select("id, nome, telefone, whatsapp")
          .eq("role", "sindico");

        const contatos: {
          id: string;
          nome: string;
          tipo: string;
          telefone: string;
        }[] = [];

        // Adiciona os síndicos, exceto quem abriu o chamado.
        for (const sindico of sindicos || []) {
          if (sindico.id === user.id) continue;

          const telefone = sindico.whatsapp || sindico.telefone;

          if (telefone) {
            contatos.push({
              id: String(sindico.id),
              nome: sindico.nome || "Síndico",
              tipo: "Síndico",
              telefone,
            });
          }
        }

        // Adiciona o prestador responsável, se houver.
        if (prestadorId) {
          const { data: prestador } = await supabase
            .from("prestadores")
            .select("id, nome, telefone")
            .eq("id", prestadorId)
            .maybeSingle();

          if (prestador?.telefone) {
            contatos.push({
              id: `prestador-${prestador.id}`,
              nome: prestador.nome || "Prestador",
              tipo: "Prestador",
              telefone: prestador.telefone,
            });
          }
        }

        const mensagem = [
          "*CONDOMÍNIO NOVA SUÍÇA 02*",
          "",
          "*Novo chamado registrado!*",
          "",
          `*Chamado:* #${chamado.id}`,
          `*Título:* ${titulo}`,
          `*Morador:* ${perfil.nome || "Não informado"}`,
          `*Localização:* ${localizacao || "Não informada"}`,
          "",
          `*Descrição:* ${descricao || "Não informada"}`,
          "",
          "Consulte o aplicativo para acompanhar os detalhes.",
          "",
          "Consulte o chamado pelo aplicativo:",
          "",
          "https://ns.sotoyotas.com.br",
        ].join("\n");

        const numerosUtilizados = new Set<string>();
        const lista: NotificacaoWhatsApp[] = [];

        for (const contato of contatos) {
          const numero = normalizarTelefone(contato.telefone);

          if (!numero || numerosUtilizados.has(numero)) continue;

          numerosUtilizados.add(numero);

          const link = criarLinkWhatsApp(
            contato.telefone,
            mensagem
          );

          if (!link) continue;

          lista.push({
            ...contato,
            link,
          });
        }

        setNotificacoesWhatsApp(lista);

        if (lista.length === 0) {
          setAvisoWhatsApp(
            "Nenhum telefone válido foi encontrado para notificação."
          );
        }
      } catch (whatsError) {
        console.error("Erro ao preparar WhatsApp:", whatsError);

        setAvisoWhatsApp(
          "O chamado foi salvo, mas não foi possível preparar os contatos do WhatsApp."
        );
      }

      // 6. Mostra a tela de confirmação.
      setChamadoRegistrado(true);
    } catch (error) {
      console.error("Erro inesperado:", error);
      alert("Ocorreu um erro inesperado ao registrar o chamado.");
    } finally {
      setLoading(false);
    }
  };

  // Tela apresentada depois que o chamado foi salvo.
  if (chamadoRegistrado) {
    return (
      <div className="flex-1 w-full flex flex-col items-center p-4 md:p-12 bg-slate-900 min-h-screen">
        <div className="w-full max-w-2xl bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="w-9 h-9 text-green-500" />

            <div>
              <h1 className="text-xl font-bold text-white">
                Chamado registrado!
              </h1>

              <p className="text-sm text-slate-400">
                Número do chamado: #{numeroChamado}
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-slate-700 p-4 mb-6">
            <div className="flex items-center gap-2 text-white mb-2">
              <Mail className="w-5 h-5 text-green-400" />
              <strong>Notificações por e-mail</strong>
            </div>

            {emailEnviado ? (
              <p className="text-sm text-green-400">
                E-mails enviados com sucesso!
              </p>
            ) : (
              <p className="text-sm text-yellow-400">
                {avisoEmail ||
                  "Não foi possível confirmar o envio dos e-mails."}
              </p>
            )}
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-6 h-6 text-green-500" />

              <h2 className="text-lg font-bold text-white">
                Avisar pelo WhatsApp
              </h2>
            </div>

            <p className="text-sm text-slate-400 mb-4">
              Escolha os destinatários. O WhatsApp abrirá com a mensagem
              pronta. Você só precisará tocar em Enviar.
            </p>

            {avisoWhatsApp && (
              <div className="bg-yellow-900/40 border border-yellow-700 rounded-lg p-3 text-sm text-yellow-300 mb-4">
                {avisoWhatsApp}
              </div>
            )}

            <div className="flex flex-col gap-3">
              {notificacoesWhatsApp.map((contato) => (
                <div
                  key={contato.id}
                  className="border border-slate-600 rounded-lg p-4"
                >
                  <div className="mb-3">
                    <p className="text-white font-semibold">
                      {contato.nome}
                    </p>

                    <p className="text-xs text-slate-400">
                      {contato.tipo} • {contato.telefone}
                    </p>
                  </div>

                  <a
                    href={contato.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-md bg-green-600 hover:bg-green-500 text-white font-medium py-3 px-4"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Enviar pelo WhatsApp
                  </a>
                </div>
              ))}
            </div>
          </div>

          <Link href="/chamados">
            <Button className="w-full h-11 bg-orange-600 hover:bg-orange-500 text-white">
              Voltar para os chamados
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center p-4 md:p-12 bg-slate-900 min-h-screen">
      <div className="w-full max-w-2xl bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-700 shadow-lg">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-700 pb-4">
          <Link href="/chamados">
            <Button
              variant="ghost"
              size="icon"
              className="-ml-2 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>

          <h1 className="text-xl font-bold text-white">
            Abrir Chamado
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block text-slate-300">
              Tipo de Serviço
            </label>

            <select
              className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm"
              value={tipoId}
              onChange={(e) => {
                setTipoId(e.target.value);
                setSubId("");
              }}
              required
            >
              {tipos.length === 0 && (
                <option value="">Carregando...</option>
              )}

              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>

          {subServicos.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-1 block text-slate-300">
                O que exatamente está acontecendo?
              </label>

              <select
                className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm"
                value={subId}
                onChange={(e) => setSubId(e.target.value)}
              >
                <option value="">Selecione (Opcional)</option>

                {subServicos.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1 block text-slate-300">
              Título do Problema
            </label>

            <Input
              required
              placeholder="Ex: Vazamento na pia da cozinha"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block text-slate-300">
              Descrição detalhada (Opcional)
            </label>

            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block text-slate-300">
              Localização
            </label>

            <div className="flex gap-2">
              <Input
                placeholder="Descreva o local ou cole o link do Maps"
                value={localizacao}
                onChange={(e) => setLocalizacao(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />

              <button
                type="button"
                onClick={handlePegarLocalizacao}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 rounded-md border border-slate-600 flex items-center justify-center"
                title="Pegar minha localização atual"
              >
                <MapPin className="w-5 h-5" />
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-4 bg-orange-600 hover:bg-orange-500 text-white h-11 text-base"
          >
            {loading ? (
              "Registrando..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Registrar Chamado
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}