
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CalendarDays,
  Clock,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ban,
  Loader2,
  CalendarPlus,
} from "lucide-react";

type Area = {
  id: number;
  nome: string;
  descricao: string | null;
  modalidade: string;
  limite_mensal_unidade: number;
  prazo_cancelamento_horas: number;
  antecedencia_maxima_dias: number;
  taxa_utilizacao: number;
  exige_aprovacao_padrao: boolean;
};

type Reserva = {
  id: number;
  area_id: number;
  periodo_id: number;
  data_reserva: string;
  status: string;
  valor_taxa: number;
  observacao: string | null;
  motivo_decisao: string | null;
  created_at: string;
};

type Disponibilidade = {
  periodo_id: number;
  nome_periodo: string;
  data_disponibilidade: string;
  hora_inicio: string;
  hora_fim: string;
  ocupado: boolean;
  bloqueado: boolean;
  quantidade_intencoes: number;
  ocupacao_atual: number;
};

type Props = {
  areas: Area[];
  reservasIniciais: Reserva[];
  userId: string;
};

const STATUS: Record<string, { label: string; classe: string }> = {
  pendente: {
    label: "Aguardando aprovação",
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

function dataLocal(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarMoeda(valor: number) {
  return Number(valor ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ReservasMoradorClient({
  areas,
  reservasIniciais,
  userId,
}: Props) {
  const supabase = createClient();

  const hoje = dataLocal(new Date());
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() + 90);
  const maximoData = dataLocal(dataLimite);

  const [reservas, setReservas] = useState(reservasIniciais);
  const [areaId, setAreaId] = useState("");
  const [dataInicio, setDataInicio] = useState(hoje);
  const [dataFim, setDataFim] = useState(
    dataLocal(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))
  );
  const [disponibilidades, setDisponibilidades] = useState<
    Disponibilidade[]
  >([]);
  const [selecionada, setSelecionada] =
    useState<Disponibilidade | null>(null);
  const [observacao, setObservacao] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const areaSelecionada = areas.find(
    (area) => String(area.id) === areaId
  );

  const atualizarReservas = async () => {
    const { data, error } = await supabase
      .from("reservas_areas")
      .select(`
        id,
        area_id,
        periodo_id,
        data_reserva,
        status,
        valor_taxa,
        observacao,
        motivo_decisao,
        created_at
      `)
      .eq("morador_id", userId)
      .order("data_reserva", { ascending: false });

    if (error) {
      setErro("Não foi possível atualizar suas reservas.");
      return;
    }

    setReservas(data ?? []);
  };

  const consultarDisponibilidade = async () => {
    setErro("");
    setMensagem("");
    setSelecionada(null);
    setDisponibilidades([]);

    if (!areaId) {
      setErro("Selecione uma área comum.");
      return;
    }

    if (!dataInicio || !dataFim || dataFim < dataInicio) {
      setErro("Informe um período de datas válido.");
      return;
    }

    const inicio = new Date(`${dataInicio}T12:00:00`);
    const fim = new Date(`${dataFim}T12:00:00`);
    const diferenca = Math.ceil(
      (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diferenca > 90) {
      setErro("A consulta permite um intervalo máximo de 90 dias.");
      return;
    }

    setConsultando(true);

    const { data, error } = await supabase.rpc(
      "consultar_disponibilidade_areas",
      {
        p_area_id: Number(areaId),
        p_data_inicio: dataInicio,
        p_data_fim: dataFim,
      }
    );

    if (error) {
      setErro(error.message);
      setConsultando(false);
      return;
    }

    setDisponibilidades((data ?? []) as Disponibilidade[]);
    setConsultando(false);

    if (!data || data.length === 0) {
      setMensagem(
        "Não foram encontrados horários para essa área no período informado."
      );
    }
  };

  const solicitarReserva = async () => {
    if (!areaSelecionada || !selecionada) return;

    if (selecionada.ocupado || selecionada.bloqueado) {
      setErro("Este horário não está disponível.");
      return;
    }

    setProcessando(true);
    setErro("");
    setMensagem("");

    const { error } = await supabase.rpc("solicitar_reserva", {
      p_area_id: areaSelecionada.id,
      p_periodo_id: selecionada.periodo_id,
      p_data: selecionada.data_disponibilidade,
      p_observacao: observacao.trim() || null,
    });

    if (error) {
      setErro(error.message);
      setProcessando(false);
      return;
    }

    setMensagem("Sua solicitação de reserva foi registrada com sucesso.");
    setSelecionada(null);
    setObservacao("");
    setDisponibilidades([]);
    await atualizarReservas();
    setProcessando(false);
  };

  const cancelarReserva = async (reserva: Reserva) => {
    const confirmar = window.confirm(
      `Deseja realmente cancelar a reserva da data ${formatarData(
        reserva.data_reserva
      )}?`
    );

    if (!confirmar) return;

    setErro("");
    setMensagem("");
    setCancelandoId(reserva.id);

    const { error } = await supabase.rpc("cancelar_reserva", {
      p_reserva_id: reserva.id,
      p_motivo: "Cancelamento solicitado pelo morador",
    });

    if (error) {
      setErro(error.message);
      setCancelandoId(null);
      return;
    }

    setMensagem("Reserva cancelada com sucesso.");
    await atualizarReservas();
    setCancelandoId(null);
  };

  const obterArea = (id: number) =>
    areas.find((area) => area.id === id)?.nome ?? "Área não encontrada";

  const podeCancelar = (status: string) =>
    ["pendente", "aprovada", "aprovada_automaticamente"].includes(status);

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <div className="w-full max-w-4xl mx-auto px-4 pb-8 pt-3 space-y-5">
        <header className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CalendarDays size={21} className="text-blue-400" />
            Reservas de áreas comuns
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Consulte horários disponíveis e acompanhe suas solicitações.
          </p>
        </header>

        {mensagem && (
          <div className="p-3 rounded-xl bg-emerald-900/30 border border-emerald-700 text-emerald-300 text-sm">
            {mensagem}
          </div>
        )}

        {erro && (
          <div className="p-3 rounded-xl bg-red-900/30 border border-red-700 text-red-300 text-sm break-words">
            {erro}
          </div>
        )}

        <section className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-4">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <Search size={18} className="text-blue-400" />
              Consultar disponibilidade
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Escolha a área e o período para consultar os horários.
            </p>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Área comum
            </label>
            <select
              value={areaId}
              onChange={(e) => {
                setAreaId(e.target.value);
                setDisponibilidades([]);
                setSelecionada(null);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm"
            >
              <option value="">Selecione uma área</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nome}
                </option>
              ))}
            </select>
          </div>

          {areaSelecionada && (
            <div className="rounded-lg bg-slate-900 p-3 text-sm text-slate-300 space-y-1">
              {areaSelecionada.descricao && (
                <p>{areaSelecionada.descricao}</p>
              )}
              <p>
                Limite mensal por unidade:{" "}
                {areaSelecionada.limite_mensal_unidade}
              </p>
              <p>
                Antecedência máxima:{" "}
                {areaSelecionada.antecedencia_maxima_dias} dias
              </p>
              <p>
                Taxa de utilização:{" "}
                {formatarMoeda(areaSelecionada.taxa_utilizacao)}
              </p>
              <p>
                Aprovação:{" "}
                {areaSelecionada.exige_aprovacao_padrao
                  ? "Sujeita à aprovação"
                  : "Automática, conforme regras do sistema"}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Data inicial
              </label>
              <input
                type="date"
                value={dataInicio}
                min={hoje}
                max={maximoData}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Data final
              </label>
              <input
                type="date"
                value={dataFim}
                min={dataInicio || hoje}
                max={maximoData}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm"
              />
            </div>
          </div>

          <button
            onClick={consultarDisponibilidade}
            disabled={consultando || !areaId}
            className="w-full inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 rounded-lg px-4 py-3 text-sm font-semibold"
          >
            {consultando ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Search size={17} />
            )}
            {consultando ? "Consultando..." : "Consultar horários"}
          </button>
        </section>

        {disponibilidades.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-semibold">
              Horários encontrados ({disponibilidades.length})
            </h2>

            {disponibilidades.map((item, index) => {
              const indisponivel = item.ocupado || item.bloqueado;
              const selecionado =
                selecionada?.periodo_id === item.periodo_id &&
                selecionada?.data_disponibilidade ===
                  item.data_disponibilidade;

              return (
                <div
                  key={`${item.periodo_id}-${item.data_disponibilidade}-${index}`}
                  className={`bg-slate-800 border rounded-xl p-3 ${
                    selecionado
                      ? "border-blue-500"
                      : "border-slate-700"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold">{item.nome_periodo}</p>
                      <p className="text-sm text-slate-300 flex items-center gap-2">
                        <CalendarDays size={15} className="text-blue-400" />
                        {formatarData(item.data_disponibilidade)}
                      </p>
                      <p className="text-sm text-slate-300 flex items-center gap-2">
                        <Clock size={15} className="text-blue-400" />
                        {item.hora_inicio.slice(0, 5)} às{" "}
                        {item.hora_fim.slice(0, 5)}
                      </p>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-2">
                      {item.bloqueado ? (
                        <span className="text-xs text-red-300 bg-red-900/30 border border-red-800 rounded-full px-3 py-1">
                          Bloqueado
                        </span>
                      ) : item.ocupado ? (
                        <span className="text-xs text-amber-300 bg-amber-900/30 border border-amber-800 rounded-full px-3 py-1">
                          Ocupado
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-800 rounded-full px-3 py-1">
                          Disponível
                        </span>
                      )}

                      {!indisponivel && (
                        <button
                          onClick={() => {
                            setSelecionada(item);
                            setErro("");
                          }}
                          className={`text-sm rounded-lg px-3 py-2 font-semibold ${
                            selecionado
                              ? "bg-blue-600"
                              : "bg-slate-700 hover:bg-slate-600"
                          }`}
                        >
                          {selecionado ? "Selecionado" : "Escolher horário"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {selecionada && areaSelecionada && (
          <section className="bg-slate-800 border border-blue-700 rounded-xl p-4 space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <CalendarPlus size={18} className="text-blue-400" />
              Confirmar solicitação
            </h2>

            <div className="text-sm text-slate-300 space-y-1">
              <p>
                <strong>Área:</strong> {areaSelecionada.nome}
              </p>
              <p>
                <strong>Data:</strong>{" "}
                {formatarData(selecionada.data_disponibilidade)}
              </p>
              <p>
                <strong>Horário:</strong>{" "}
                {selecionada.hora_inicio.slice(0, 5)} às{" "}
                {selecionada.hora_fim.slice(0, 5)}
              </p>
              <p>
                <strong>Taxa:</strong>{" "}
                {formatarMoeda(areaSelecionada.taxa_utilizacao)}
              </p>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Observação (opcional)
              </label>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Alguma informação sobre sua solicitação..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setSelecionada(null)}
                disabled={processando}
                className="flex-1 bg-slate-700 hover:bg-slate-600 rounded-lg px-4 py-3 text-sm"
              >
                Voltar
              </button>

              <button
                onClick={solicitarReserva}
                disabled={processando}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 rounded-lg px-4 py-3 text-sm font-semibold"
              >
                {processando ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={17} />
                )}
                {processando ? "Enviando..." : "Solicitar reserva"}
              </button>
            </div>
          </section>
        )}

        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Minhas reservas</h2>
            <button
              onClick={atualizarReservas}
              className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white"
            >
              <RefreshCw size={14} />
              Atualizar
            </button>
          </div>

          {reservas.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
              <CalendarDays
                size={32}
                className="mx-auto text-slate-500 mb-2"
              />
              <p className="text-sm text-slate-300">
                Você ainda não possui reservas.
              </p>
            </div>
          ) : (
            reservas.map((reserva) => {
              const status = STATUS[reserva.status] ?? {
                label: reserva.status,
                classe: "bg-slate-800 text-slate-300 border-slate-700",
              };

              return (
                <article
                  key={reserva.id}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">
                      {obterArea(reserva.area_id)}
                    </h3>
                    <span
                      className={`text-xs border rounded-full px-3 py-1 ${status.classe}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
                    <span className="flex items-center gap-2">
                      <CalendarDays size={15} className="text-blue-400" />
                      {formatarData(reserva.data_reserva)}
                    </span>
                    <span>
                      Taxa: {formatarMoeda(reserva.valor_taxa)}
                    </span>
                  </div>

                  {reserva.observacao && (
                    <p className="text-sm text-slate-400">
                      Observação: {reserva.observacao}
                    </p>
                  )}

                  {reserva.motivo_decisao && (
                    <p className="text-sm text-slate-400">
                      Informação: {reserva.motivo_decisao}
                    </p>
                  )}

                  {podeCancelar(reserva.status) && (
                    <button
                      onClick={() => cancelarReserva(reserva)}
                      disabled={cancelandoId === reserva.id}
                      className="inline-flex items-center justify-center gap-2 bg-slate-700 hover:bg-red-900/60 disabled:opacity-50 rounded-lg px-3 py-2 text-xs text-slate-200"
                    >
                      {cancelandoId === reserva.id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Ban size={15} />
                      )}
                      {cancelandoId === reserva.id
                        ? "Cancelando..."
                        : "Cancelar reserva"}
                    </button>
                  )}
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
