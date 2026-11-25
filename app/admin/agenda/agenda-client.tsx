
"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  RefreshCw,
  Search,
  MapPin,
  Clock,
  Lock,
  ChevronLeft,
  ChevronRight,
  ListFilter,
} from "lucide-react";

type Evento = {
  id: number;
  area_id: number | null;
  titulo: string;
  descricao: string | null;
  tipo_evento: string;
  inicio_em: string;
  fim_em: string;
  local: string | null;
  bloqueia_area: boolean;
  status: string;
  criado_por: string | null;
  created_at: string;
  updated_at: string;
};

type Bloqueio = {
  id: number;
  area_id: number;
  periodo_id: number | null;
  data_inicio: string;
  data_fim: string;
  motivo: string;
  criado_por: string | null;
  ativo: boolean;
  created_at: string;
};

type Area = {
  id: number;
  nome: string;
  modalidade: string;
  ativo: boolean;
};

type Props = {
  eventos: Evento[];
  bloqueios: Bloqueio[];
  areas: Area[];
};

type DiaCalendario = {
  data: Date;
  chave: string;
  pertenceAoMes: boolean;
  hoje: boolean;
};

function chaveData(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function dataLocal(valor: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [ano, mes, dia] = valor.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  const data = new Date(valor);
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function formatarData(data: string) {
  return dataLocal(data).toLocaleDateString("pt-BR");
}

function formatarDataHora(data: string) {
  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarHora(data: string) {
  return new Date(data).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function nomeArea(id: number | null, areas: Area[]) {
  if (!id) return "Sem área vinculada";
  return areas.find((area) => area.id === id)?.nome ?? "Área não encontrada";
}

function eventoAtingeDia(evento: Evento, dia: Date) {
  const chave = chaveData(dia);
  const inicio = chaveData(dataLocal(evento.inicio_em));
  const fim = chaveData(dataLocal(evento.fim_em));
  return chave >= inicio && chave <= fim;
}

function bloqueioAtingeDia(bloqueio: Bloqueio, dia: Date) {
  const chave = chaveData(dia);
  return (
    chave >= chaveData(dataLocal(bloqueio.data_inicio)) &&
    chave <= chaveData(dataLocal(bloqueio.data_fim))
  );
}

export default function AgendaClient({
  eventos,
  bloqueios,
  areas,
}: Props) {
  const [hoje] = useState(() => new Date());

  const [aba, setAba] = useState<"calendario" | "eventos" | "bloqueios">(
    "calendario"
  );

  const [busca, setBusca] = useState("");
  const [areaSelecionada, setAreaSelecionada] = useState("todas");

  const [mesExibido, setMesExibido] = useState(
    new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  );

  const [diaSelecionado, setDiaSelecionado] = useState(chaveData(hoje));

  const termo = busca.toLowerCase().trim();

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((evento) => {
      const correspondeArea =
        areaSelecionada === "todas" ||
        String(evento.area_id ?? "") === areaSelecionada;

      const correspondeBusca =
        !termo ||
        evento.titulo.toLowerCase().includes(termo) ||
        (evento.local ?? "").toLowerCase().includes(termo) ||
        evento.tipo_evento.toLowerCase().includes(termo);

      return correspondeArea && correspondeBusca;
    });
  }, [eventos, areaSelecionada, termo]);

  const bloqueiosFiltrados = useMemo(() => {
    return bloqueios.filter((bloqueio) => {
      const correspondeArea =
        areaSelecionada === "todas" ||
        String(bloqueio.area_id) === areaSelecionada;

      const correspondeBusca =
        !termo ||
        bloqueio.motivo.toLowerCase().includes(termo) ||
        nomeArea(bloqueio.area_id, areas).toLowerCase().includes(termo);

      return correspondeArea && correspondeBusca;
    });
  }, [bloqueios, areaSelecionada, termo, areas]);

  const diasCalendario = useMemo<DiaCalendario[]>(() => {
    const ano = mesExibido.getFullYear();
    const mes = mesExibido.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const inicioGrade = new Date(ano, mes, 1 - primeiroDia.getDay());
    const chaveHoje = chaveData(hoje);

    return Array.from({ length: 42 }, (_, indice) => {
      const data = new Date(
        inicioGrade.getFullYear(),
        inicioGrade.getMonth(),
        inicioGrade.getDate() + indice
      );

      return {
        data,
        chave: chaveData(data),
        pertenceAoMes: data.getMonth() === mes,
        hoje: chaveData(data) === chaveHoje,
      };
    });
  }, [mesExibido, hoje]);

  const dataSelecionada = dataLocal(diaSelecionado);

  const eventosDoDia = useMemo(() => {
    const data = dataLocal(diaSelecionado);
    return eventosFiltrados.filter((evento) => eventoAtingeDia(evento, data));
  }, [eventosFiltrados, diaSelecionado]);

  const bloqueiosDoDia = useMemo(() => {
    const data = dataLocal(diaSelecionado);
    return bloqueiosFiltrados.filter((bloqueio) =>
      bloqueioAtingeDia(bloqueio, data)
    );
  }, [bloqueiosFiltrados, diaSelecionado]);

  function mudarMes(direcao: number) {
    setMesExibido(
      new Date(
        mesExibido.getFullYear(),
        mesExibido.getMonth() + direcao,
        1
      )
    );
  }

  function voltarParaHoje() {
    const agora = new Date();
    setMesExibido(new Date(agora.getFullYear(), agora.getMonth(), 1));
    setDiaSelecionado(chaveData(agora));
  }

  const tituloMes = mesExibido.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex-1 w-full flex flex-col items-center px-4 pt-0 pb-4 md:px-12 md:pt-0 md:pb-12 bg-slate-900 min-h-screen">
      <div className="w-full max-w-4xl flex flex-col gap-6 text-white">
        {/* Cabeçalho no padrão do Mural */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
              <CalendarDays size={25} />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white">
                Agenda do Condomínio
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Consulte eventos e bloqueios das áreas comuns.
              </p>
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-2 text-xs sm:text-sm font-medium transition"
          >
            <RefreshCw size={15} />
            Atualizar
          </button>
        </section>

        {/* Indicadores */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
            <p className="text-[10px] sm:text-xs text-slate-400">Eventos</p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {eventos.length}
            </p>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
            <p className="text-[10px] sm:text-xs text-slate-400">
              Bloqueios ativos
            </p>
            <p className="mt-1 text-xl font-bold text-amber-400 tabular-nums">
              {bloqueios.length}
            </p>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
            <p className="text-[10px] sm:text-xs text-slate-400">
              Áreas comuns
            </p>
            <p className="mt-1 text-xl font-bold text-emerald-400 tabular-nums">
              {areas.length}
            </p>
          </div>
        </div>

        {/* Filtros e abas */}
        <section className="rounded-xl border border-slate-700 bg-slate-800 p-3 space-y-3">
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setAba("calendario")}
              className={`rounded-md px-1.5 py-2 text-[10px] sm:text-xs font-medium transition ${
                aba === "calendario"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <CalendarDays size={14} className="inline mr-1" />
              Calendário
            </button>

            <button
              onClick={() => setAba("eventos")}
              className={`rounded-md px-1.5 py-2 text-[10px] sm:text-xs font-medium transition ${
                aba === "eventos"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <ListFilter size={14} className="inline mr-1" />
              Eventos ({eventos.length})
            </button>

            <button
              onClick={() => setAba("bloqueios")}
              className={`rounded-md px-1.5 py-2 text-[10px] sm:text-xs font-medium transition ${
                aba === "bloqueios"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <Lock size={14} className="inline mr-1" />
              Bloqueios ({bloqueios.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder={
                  aba === "bloqueios"
                    ? "Buscar bloqueio ou área..."
                    : "Buscar evento, local ou tipo..."
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs sm:text-sm text-white outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={areaSelecionada}
              onChange={(e) => setAreaSelecionada(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="todas">Todas as áreas comuns</option>
              {areas.map((area) => (
                <option key={area.id} value={String(area.id)}>
                  {area.nome}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Calendário */}
        {aba === "calendario" ? (
          <section className="space-y-3">
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold capitalize">
                    {tituloMes}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                    Selecione um dia para consultar.
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={voltarParaHoje}
                    className="rounded-md border border-slate-600 px-2 py-1.5 text-[11px] sm:text-xs hover:bg-slate-700"
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => mudarMes(-1)}
                    aria-label="Mês anterior"
                    className="rounded-md border border-slate-600 p-1.5 hover:bg-slate-700"
                  >
                    <ChevronLeft size={17} />
                  </button>
                  <button
                    onClick={() => mudarMes(1)}
                    aria-label="Próximo mês"
                    className="rounded-md border border-slate-600 p-1.5 hover:bg-slate-700"
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-[10px] sm:text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  Eventos
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Bloqueios
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full ring-2 ring-emerald-400" />
                  Hoje
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                  (dia) => (
                    <div
                      key={dia}
                      className="py-1 text-center text-[10px] sm:text-xs font-semibold text-slate-400"
                    >
                      {dia}
                    </div>
                  )
                )}

                {diasCalendario.map((dia) => {
                  const eventosDia = eventosFiltrados.filter((evento) =>
                    eventoAtingeDia(evento, dia.data)
                  );

                  const bloqueiosDia = bloqueiosFiltrados.filter((bloqueio) =>
                    bloqueioAtingeDia(bloqueio, dia.data)
                  );

                  const selecionado = dia.chave === diaSelecionado;
                  const quantidade = eventosDia.length + bloqueiosDia.length;

                  return (
                    <button
                      key={dia.chave}
                      onClick={() => setDiaSelecionado(dia.chave)}
                      className={`min-w-0 min-h-[43px] sm:min-h-[68px] rounded-md border p-1 text-left transition ${
                        selecionado
                          ? "border-blue-400 bg-blue-950/60"
                          : "border-slate-700 bg-slate-950 hover:border-slate-500"
                      } ${!dia.pertenceAoMes ? "opacity-35" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-0.5">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                            dia.hoje
                              ? "bg-emerald-500 text-white font-bold"
                              : selecionado
                              ? "bg-blue-600 text-white"
                              : "text-slate-300"
                          }`}
                        >
                          {dia.data.getDate()}
                        </span>

                        {quantidade > 0 && (
                          <span className="text-[9px] text-slate-400">
                            {quantidade}
                          </span>
                        )}
                      </div>

                      <div className="hidden sm:block mt-1 space-y-0.5">
                        {eventosDia.slice(0, 2).map((evento) => (
                          <div
                            key={`evento-${evento.id}`}
                            className="truncate rounded bg-blue-500/20 px-1 py-0.5 text-[9px] text-blue-200"
                            title={evento.titulo}
                          >
                            {evento.titulo}
                          </div>
                        ))}

                        {bloqueiosDia.slice(0, 2).map((bloqueio) => (
                          <div
                            key={`bloqueio-${bloqueio.id}`}
                            className="truncate rounded bg-amber-500/20 px-1 py-0.5 text-[9px] text-amber-200"
                            title={bloqueio.motivo}
                          >
                            {bloqueio.motivo}
                          </div>
                        ))}

                        {quantidade > 4 && (
                          <p className="text-[9px] text-slate-400">
                            +{quantidade - 4} mais
                          </p>
                        )}
                      </div>

                      {quantidade > 0 && (
                        <div className="flex sm:hidden gap-1 mt-1">
                          {eventosDia.length > 0 && (
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                          )}
                          {bloqueiosDia.length > 0 && (
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Registros do dia selecionado */}
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-3 sm:p-4 space-y-3">
              <div>
                <h3 className="text-sm sm:text-base font-semibold capitalize">
                  {dataSelecionada.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                  {eventosDoDia.length} evento(s) e {bloqueiosDoDia.length} bloqueio(s)
                </p>
              </div>

              {eventosDoDia.length === 0 && bloqueiosDoDia.length === 0 ? (
                <div className="rounded-lg border border-slate-700 bg-slate-900 p-5 text-center">
                  <CalendarDays
                    size={28}
                    className="mx-auto text-slate-500 mb-2"
                  />
                  <p className="text-sm font-medium">
                    Nenhum registro neste dia
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Não há eventos ou bloqueios para a data selecionada.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {eventosDoDia.map((evento) => (
                    <article
                      key={evento.id}
                      className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-blue-100">
                          {evento.titulo}
                        </h4>
                        <span className="rounded-full bg-blue-500/20 px-2.5 py-1 text-[10px] text-blue-200">
                          {evento.status}
                        </span>
                      </div>

                      <p className="text-xs text-blue-200/80">
                        {evento.tipo_evento}
                      </p>

                      {evento.descricao && (
                        <p className="text-xs sm:text-sm text-slate-300">
                          {evento.descricao}
                        </p>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs text-slate-300">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={14} />
                          {formatarHora(evento.inicio_em)} — {formatarHora(evento.fim_em)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={14} />
                          {evento.local || nomeArea(evento.area_id, areas)}
                        </span>
                      </div>

                      {evento.bloqueia_area && (
                        <p className="text-[11px] text-amber-300">
                          <Lock size={12} className="inline mr-1" />
                          Este evento bloqueia uma área comum.
                        </p>
                      )}
                    </article>
                  ))}

                  {bloqueiosDoDia.map((bloqueio) => (
                    <article
                      key={bloqueio.id}
                      className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-amber-100">
                          {nomeArea(bloqueio.area_id, areas)}
                        </h4>
                        <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] text-amber-200">
                          Bloqueio ativo
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300">
                        {bloqueio.motivo}
                      </p>

                      <p className="text-[11px] text-slate-400">
                        Período: {formatarData(bloqueio.data_inicio)} até{" "}
                        {formatarData(bloqueio.data_fim)}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : aba === "eventos" ? (
          <section className="space-y-2">
            {eventosFiltrados.length === 0 ? (
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 text-center">
                <CalendarDays
                  size={30}
                  className="mx-auto text-slate-500 mb-3"
                />
                <h2 className="text-sm font-semibold">
                  Nenhum evento encontrado
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Não existem eventos correspondentes aos filtros.
                </p>
              </div>
            ) : (
              eventosFiltrados.map((evento) => (
                <article
                  key={evento.id}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-3 sm:p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-semibold">
                        {evento.titulo}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {evento.tipo_evento}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-slate-700 px-2.5 py-1 text-[10px] text-slate-300">
                      {evento.status}
                    </span>
                  </div>

                  {evento.descricao && (
                    <p className="text-xs sm:text-sm text-slate-300">
                      {evento.descricao}
                    </p>
                  )}

                  <div className="flex flex-col gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-2">
                      <Clock size={14} />
                      {formatarDataHora(evento.inicio_em)} —{" "}
                      {formatarDataHora(evento.fim_em)}
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin size={14} />
                      {evento.local || nomeArea(evento.area_id, areas)}
                    </span>
                  </div>

                  {evento.bloqueia_area && (
                    <p className="text-xs text-amber-400">
                      <Lock size={13} className="inline mr-1" />
                      Este evento bloqueia uma área comum.
                    </p>
                  )}
                </article>
              ))
            )}
          </section>
        ) : (
          <section className="space-y-2">
            {bloqueiosFiltrados.length === 0 ? (
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 text-center">
                <Lock
                  size={30}
                  className="mx-auto text-slate-500 mb-3"
                />
                <h2 className="text-sm font-semibold">
                  Nenhum bloqueio encontrado
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Não existem bloqueios ativos correspondentes aos filtros.
                </p>
              </div>
            ) : (
              bloqueiosFiltrados.map((bloqueio) => (
                <article
                  key={bloqueio.id}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-3 sm:p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm sm:text-base font-semibold">
                      {nomeArea(bloqueio.area_id, areas)}
                    </h2>
                    <span className="shrink-0 rounded-full bg-amber-500/10 text-amber-400 px-2.5 py-1 text-[10px]">
                      Ativo
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300">
                    {bloqueio.motivo}
                  </p>

                  <div className="text-xs text-slate-400 flex flex-col sm:flex-row gap-1 sm:gap-4">
                    <span>Início: {formatarData(bloqueio.data_inicio)}</span>
                    <span>Fim: {formatarData(bloqueio.data_fim)}</span>
                  </div>
                </article>
              ))
            )}
          </section>
        )}
      </div>
    </div>
  );
}
