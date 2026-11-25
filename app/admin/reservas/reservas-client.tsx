
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Loader2,
  X,
  Check,
  Ban,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";

type Reserva = {
  id: number;
  area_id: number;
  periodo_id: number;
  morador_id: string;
  unidade_id: number;
  data_reserva: string;
  status: string;
  exige_aprovacao: boolean;
  valor_taxa: number;
  observacao: string | null;
  aprovado_por: string | null;
  aprovado_em: string | null;
  motivo_decisao: string | null;
  cancelado_por: string | null;
  cancelado_em: string | null;
  created_at: string;
  updated_at: string;
};

type Area = {
  id: number;
  nome: string;
  modalidade: string;
  ativo: boolean;
};

type Periodo = {
  id: number;
  area_id: number;
  nome: string;
  hora_inicio: string;
  hora_fim: string;
  ativo: boolean;
};

type Morador = {
  id: string;
  nome: string | null;
  unidade: string | null;
};

type Props = {
  reservas: Reserva[];
  areas: Area[];
  periodos: Periodo[];
  moradores: Morador[];
  condominioId: number;
};

type Acao = "aprovar" | "recusar" | "cancelar";

const STATUS: Record<string, { label: string; classe: string }> = {
  pendente: {
    label: "Pendente",
    classe: "bg-amber-900/40 text-amber-300 border-amber-800",
  },
  aprovada: {
    label: "Aprovada",
    classe: "bg-emerald-900/40 text-emerald-300 border-emerald-800",
  },
  aprovada_automaticamente: {
    label: "Aprovada automaticamente",
    classe: "bg-emerald-900/40 text-emerald-300 border-emerald-800",
  },
  recusada: {
    label: "Recusada",
    classe: "bg-red-900/40 text-red-300 border-red-800",
  },
  cancelada: {
    label: "Cancelada",
    classe: "bg-slate-800 text-slate-400 border-slate-700",
  },
  concluida: {
    label: "Concluída",
    classe: "bg-blue-900/40 text-blue-300 border-blue-800",
  },
};

export default function ReservasClient({
  reservas: reservasIniciais,
  areas,
  periodos,
  moradores,
  condominioId,
}: Props) {
  const supabase = createClient();

  const [reservas, setReservas] = useState(reservasIniciais);
  const [filtroStatus, setFiltroStatus] = useState("todas");
  const [filtroArea, setFiltroArea] = useState("todas");
  const [busca, setBusca] = useState("");
  const [modalAcao, setModalAcao] = useState<{
    reserva: Reserva;
    acao: Acao;
  } | null>(null);
  const [motivo, setMotivo] = useState("");
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [atualizando, setAtualizando] = useState(false);

  const obterArea = (id: number) =>
    areas.find((area) => area.id === id)?.nome ?? "Área não encontrada";

  const obterPeriodo = (id: number) =>
    periodos.find((periodo) => periodo.id === id);

  const obterMorador = (id: string) =>
    moradores.find((morador) => morador.id === id);

  const formatarData = (data: string) => {
    const [ano, mes, dia] = data.slice(0, 10).split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const formatarMoeda = (valor: number) =>
    Number(valor ?? 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const pendentes = reservas.filter((r) => r.status === "pendente").length;

  const aprovadas = reservas.filter((r) =>
    ["aprovada", "aprovada_automaticamente"].includes(r.status)
  ).length;

  const recusadas = reservas.filter((r) => r.status === "recusada").length;

  const filtradas = reservas.filter((reserva) => {
    const correspondeStatus =
      filtroStatus === "todas" || reserva.status === filtroStatus;

    const correspondeArea =
      filtroArea === "todas" || String(reserva.area_id) === filtroArea;

    const morador = obterMorador(reserva.morador_id);
    const nome = morador?.nome ?? "";
    const unidade = morador?.unidade ?? "";

    const correspondeBusca =
      !busca ||
      nome.toLowerCase().includes(busca.toLowerCase()) ||
      unidade.toLowerCase().includes(busca.toLowerCase()) ||
      String(reserva.id).includes(busca);

    return correspondeStatus && correspondeArea && correspondeBusca;
  });

  const abrirAcao = (reserva: Reserva, acao: Acao) => {
    setErro("");
    setMensagem("");
    setMotivo("");
    setModalAcao({ reserva, acao });
  };

  const fecharAcao = () => {
    if (processando) return;
    setModalAcao(null);
    setMotivo("");
  };

  const executarAcao = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!modalAcao) return;

    setProcessando(true);
    setErro("");
    setMensagem("");

    const { reserva, acao } = modalAcao;

    const resultado =
      acao === "aprovar"
        ? await supabase.rpc("aprovar_reserva", {
            p_reserva_id: reserva.id,
          })
        : acao === "recusar"
          ? await supabase.rpc("recusar_reserva", {
              p_reserva_id: reserva.id,
              p_motivo: motivo.trim() || null,
            })
          : await supabase.rpc("cancelar_reserva", {
              p_reserva_id: reserva.id,
              p_motivo: motivo.trim() || null,
            });

    if (resultado.error) {
      setErro(resultado.error.message);
      setProcessando(false);
      return;
    }

    const { data, error: erroConsulta } = await supabase
      .from("reservas_areas")
      .select(`
        id,
        area_id,
        periodo_id,
        morador_id,
        unidade_id,
        data_reserva,
        status,
        exige_aprovacao,
        valor_taxa,
        observacao,
        aprovado_por,
        aprovado_em,
        motivo_decisao,
        cancelado_por,
        cancelado_em,
        created_at,
        updated_at
      `)
      .eq("condominio_id", condominioId)
      .order("data_reserva", { ascending: false });

    if (erroConsulta) {
      setErro(
        "A ação foi realizada, mas não foi possível atualizar a listagem. Atualize a página."
      );
      setProcessando(false);
      return;
    }

    setReservas(data ?? []);
    setMensagem(
      acao === "aprovar"
        ? "Reserva aprovada com sucesso!"
        : acao === "recusar"
          ? "Reserva recusada com sucesso!"
          : "Reserva cancelada com sucesso!"
    );

    setModalAcao(null);
    setMotivo("");
    setProcessando(false);
  };

  const atualizarLista = async () => {
    setAtualizando(true);
    setErro("");
    setMensagem("");

    const { data, error } = await supabase
      .from("reservas_areas")
      .select(`
        id,
        area_id,
        periodo_id,
        morador_id,
        unidade_id,
        data_reserva,
        status,
        exige_aprovacao,
        valor_taxa,
        observacao,
        aprovado_por,
        aprovado_em,
        motivo_decisao,
        cancelado_por,
        cancelado_em,
        created_at,
        updated_at
      `)
      .eq("condominio_id", condominioId)
      .order("data_reserva", { ascending: false });

    if (error) {
      setErro(error.message);
    } else {
      setReservas(data ?? []);
      setMensagem("Lista atualizada.");
    }

    setAtualizando(false);
  };

  const acaoTexto = modalAcao?.acao;

  return (
    <main className="flex-1 w-full flex flex-col items-center p-4 md:p-8 bg-slate-900 min-h-screen text-white">
      <div className="w-full max-w-4xl flex flex-col gap-5">
        <div className="bg-slate-800 p-5 md:p-6 rounded-xl border border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-3 text-sm"
              >
                <ArrowLeft size={16} />
                Voltar à gestão
              </Link>

              <h1 className="text-xl md:text-2xl font-bold">
                Gestão de Reservas
              </h1>

              <p className="text-slate-400 text-sm mt-1">
                Acompanhe e gerencie as solicitações das áreas comuns.
              </p>
            </div>

            <button
              onClick={atualizarLista}
              disabled={atualizando}
              className="inline-flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-4 py-2.5 rounded-lg text-sm"
            >
              <RefreshCw
                size={16}
                className={atualizando ? "animate-spin" : ""}
              />
              Atualizar lista
            </button>
          </div>
        </div>

        {mensagem && (
          <div className="p-3 rounded-xl bg-emerald-900/30 border border-emerald-700 text-emerald-300 text-sm">
            {mensagem}
          </div>
        )}

        {erro && !modalAcao && (
          <div className="p-3 rounded-xl bg-red-900/30 border border-red-700 text-red-300 text-sm">
            {erro}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 md:p-4">
            <p className="text-slate-400 text-xs md:text-sm">
              Total de reservas
            </p>
            <p className="text-2xl font-bold mt-1">{reservas.length}</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 md:p-4">
            <p className="text-slate-400 text-xs md:text-sm">Pendentes</p>
            <p className="text-2xl font-bold mt-1 text-amber-300">
              {pendentes}
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 md:p-4">
            <p className="text-slate-400 text-xs md:text-sm">Aprovadas</p>
            <p className="text-2xl font-bold mt-1 text-emerald-300">
              {aprovadas}
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 md:p-4">
            <p className="text-slate-400 text-xs md:text-sm">Recusadas</p>
            <p className="text-2xl font-bold mt-1 text-red-300">
              {recusadas}
            </p>
          </div>
        </div>

        <section className="bg-slate-800 border border-slate-700 rounded-xl p-3 md:p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar morador, unidade ou número..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-3 text-sm text-white"
              />
            </div>

            <select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
            >
              <option value="todas">Todas as áreas</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nome}
                </option>
              ))}
            </select>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
            >
              <option value="todas">Todos os status</option>
              <option value="pendente">Pendentes</option>
              <option value="aprovada">Aprovadas</option>
              <option value="aprovada_automaticamente">
                Aprovadas automaticamente
              </option>
              <option value="recusada">Recusadas</option>
              <option value="cancelada">Canceladas</option>
              <option value="concluida">Concluídas</option>
            </select>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          {filtradas.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
              <CalendarDays
                size={38}
                className="mx-auto text-slate-500 mb-3"
              />
              <h2 className="text-lg font-semibold">
                Nenhuma reserva encontrada
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Não existem reservas correspondentes aos filtros selecionados.
              </p>
            </div>
          ) : (
            filtradas.map((reserva) => {
              const morador = obterMorador(reserva.morador_id);
              const periodo = obterPeriodo(reserva.periodo_id);
              const status =
                STATUS[reserva.status] ?? {
                  label: reserva.status,
                  classe: "bg-slate-700 text-slate-300 border-slate-600",
                };

              const podeDecidir = reserva.status === "pendente";
              const podeCancelar = [
                "pendente",
                "aprovada",
                "aprovada_automaticamente",
              ].includes(reserva.status);

              return (
                <article
                  key={reserva.id}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs text-slate-400">
                          Reserva #{reserva.id}
                        </span>

                        <span
                          className={`text-xs px-2.5 py-1 rounded-full border ${status.classe}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold">
                        {obterArea(reserva.area_id)}
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-300">
                          <CalendarDays
                            size={16}
                            className="text-blue-400 shrink-0"
                          />
                          {formatarData(reserva.data_reserva)}
                        </div>

                        <div className="flex items-center gap-2 text-slate-300">
                          <Clock
                            size={16}
                            className="text-blue-400 shrink-0"
                          />
                          {periodo
                            ? `${periodo.nome} · ${periodo.hora_inicio.slice(0, 5)} às ${periodo.hora_fim.slice(0, 5)}`
                            : "Período não encontrado"}
                        </div>

                        <div className="text-slate-300">
                          Morador:{" "}
                          <span className="text-white">
                            {morador?.nome ?? "Não identificado"}
                          </span>
                        </div>

                        <div className="text-slate-300">
                          Unidade:{" "}
                          <span className="text-white">
                            {morador?.unidade ?? "Não informada"}
                          </span>
                        </div>

                        <div className="text-slate-300">
                          Taxa:{" "}
                          <span className="text-white">
                            {formatarMoeda(reserva.valor_taxa)}
                          </span>
                        </div>

                        <div className="text-slate-300">
                          Aprovação:{" "}
                          <span className="text-white">
                            {reserva.exige_aprovacao
                              ? "Necessária"
                              : "Automática"}
                          </span>
                        </div>
                      </div>

                      {reserva.observacao && (
                        <div className="mt-3 p-3 bg-slate-900 rounded-lg text-sm text-slate-300">
                          <span className="text-slate-400">Observação:</span>{" "}
                          {reserva.observacao}
                        </div>
                      )}

                      {reserva.motivo_decisao && (
                        <div className="mt-2 p-3 bg-slate-900 rounded-lg text-sm text-slate-300">
                          <span className="text-slate-400">
                            Motivo da decisão:
                          </span>{" "}
                          {reserva.motivo_decisao}
                        </div>
                      )}
                    </div>

                    {(podeDecidir || podeCancelar) && (
                      <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                        {podeDecidir && (
                          <>
                            <button
                              onClick={() => abrirAcao(reserva, "aprovar")}
                              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-sm font-semibold"
                            >
                              <Check size={16} />
                              Aprovar
                            </button>

                            <button
                              onClick={() => abrirAcao(reserva, "recusar")}
                              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-red-900/50 hover:bg-red-900 text-red-300 text-sm"
                            >
                              <XCircle size={16} />
                              Recusar
                            </button>
                          </>
                        )}

                        {podeCancelar && (
                          <button
                            onClick={() => abrirAcao(reserva, "cancelar")}
                            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm"
                          >
                            <Ban size={16} />
                            Cancelar reserva
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>

      {modalAcao && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg my-auto shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div>
                <h2 className="text-lg font-bold">
                  {acaoTexto === "aprovar"
                    ? "Aprovar reserva"
                    : acaoTexto === "recusar"
                      ? "Recusar reserva"
                      : "Cancelar reserva"}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Reserva #{modalAcao.reserva.id}
                </p>
              </div>

              <button
                onClick={fecharAcao}
                disabled={processando}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={executarAcao} className="p-4 space-y-4">
              {erro && (
                <div className="p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-sm">
                  {erro}
                </div>
              )}

              <div className="p-3 bg-slate-900 rounded-lg text-sm text-slate-300 space-y-2">
                <p>
                  <strong>Área:</strong>{" "}
                  {obterArea(modalAcao.reserva.area_id)}
                </p>
                <p>
                  <strong>Data:</strong>{" "}
                  {formatarData(modalAcao.reserva.data_reserva)}
                </p>
                <p>
                  <strong>Morador:</strong>{" "}
                  {obterMorador(modalAcao.reserva.morador_id)?.nome ??
                    "Não identificado"}
                </p>
              </div>

              {acaoTexto !== "aprovar" && (
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Motivo (opcional)
                  </label>
                  <textarea
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Informe o motivo..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white resize-none text-sm"
                  />
                </div>
              )}

              {acaoTexto === "aprovar" && (
                <p className="text-sm text-slate-400">
                  Confirma a aprovação desta reserva?
                </p>
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={fecharAcao}
                  disabled={processando}
                  className="px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm"
                >
                  Voltar
                </button>

                <button
                  type="submit"
                  disabled={processando}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 ${
                    acaoTexto === "aprovar"
                      ? "bg-emerald-700 hover:bg-emerald-600"
                      : "bg-red-800 hover:bg-red-700"
                  }`}
                >
                  {processando ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : acaoTexto === "aprovar" ? (
                    <CheckCircle2 size={17} />
                  ) : (
                    <AlertCircle size={17} />
                  )}

                  {processando
                    ? "Processando..."
                    : acaoTexto === "aprovar"
                      ? "Confirmar aprovação"
                      : acaoTexto === "recusar"
                        ? "Confirmar recusa"
                        : "Confirmar cancelamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
