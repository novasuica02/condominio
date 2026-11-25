
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Pencil,
  X,
  Save,
  Loader2,
  Clock,
  CalendarDays,
  Power,
} from "lucide-react";

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
  dias_semana: number[];
  intervalo_limpeza_minutos: number;
  ordem: number;
  ativo: boolean;
};

type Props = {
  areas: Area[];
  periodos: Periodo[];
  condominioId: number;
};

const DIAS = [
  { numero: 0, nome: "Domingo" },
  { numero: 1, nome: "Segunda-feira" },
  { numero: 2, nome: "Terça-feira" },
  { numero: 3, nome: "Quarta-feira" },
  { numero: 4, nome: "Quinta-feira" },
  { numero: 5, nome: "Sexta-feira" },
  { numero: 6, nome: "Sábado" },
];

const formularioInicial = {
  area_id: "",
  nome: "",
  hora_inicio: "08:00",
  hora_fim: "12:00",
  dias_semana: [0, 1, 2, 3, 4, 5, 6] as number[],
  intervalo_limpeza_minutos: "0",
  ordem: "1",
};

export default function PeriodosClient({
  areas,
  periodos: periodosIniciais,
  condominioId,
}: Props) {
  const supabase = createClient();

  const [periodos, setPeriodos] = useState(periodosIniciais);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [modalAberto, setModalAberto] = useState(false);
  const [periodoEditando, setPeriodoEditando] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const abrirNovo = () => {
    setFormulario({
      ...formularioInicial,
      area_id: areas.length ? String(areas[0].id) : "",
      ordem: String(periodos.length + 1),
    });
    setPeriodoEditando(null);
    setMensagem("");
    setErro("");
    setModalAberto(true);
  };

  const abrirEdicao = (periodo: Periodo) => {
    setFormulario({
      area_id: String(periodo.area_id),
      nome: periodo.nome,
      hora_inicio: periodo.hora_inicio.slice(0, 5),
      hora_fim: periodo.hora_fim.slice(0, 5),
      dias_semana: periodo.dias_semana ?? [],
      intervalo_limpeza_minutos: String(
        periodo.intervalo_limpeza_minutos ?? 0
      ),
      ordem: String(periodo.ordem ?? 1),
    });

    setPeriodoEditando(periodo.id);
    setMensagem("");
    setErro("");
    setModalAberto(true);
  };

  const fecharModal = () => {
    if (salvando) return;
    setModalAberto(false);
    setPeriodoEditando(null);
  };

  const alternarDia = (dia: number) => {
    setFormulario((atual) => ({
      ...atual,
      dias_semana: atual.dias_semana.includes(dia)
        ? atual.dias_semana.filter((item) => item !== dia)
        : [...atual.dias_semana, dia].sort((a, b) => a - b),
    }));
  };

  const atualizarCampo = (
    campo: keyof typeof formulario,
    valor: string
  ) => {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  };

  const salvarPeriodo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro("");
    setMensagem("");

    if (!formulario.area_id) {
      setErro("Selecione uma área comum.");
      return;
    }

    if (!formulario.nome.trim()) {
      setErro("Informe o nome do período.");
      return;
    }

    if (formulario.dias_semana.length === 0) {
      setErro("Selecione pelo menos um dia da semana.");
      return;
    }

    if (formulario.hora_fim <= formulario.hora_inicio) {
      setErro("O horário de término deve ser posterior ao início.");
      return;
    }

    const intervalo = Number(formulario.intervalo_limpeza_minutos);
    const ordem = Number(formulario.ordem);

    if (!Number.isInteger(intervalo) || intervalo < 0) {
      setErro("Informe um intervalo de limpeza válido.");
      return;
    }

    if (!Number.isInteger(ordem) || ordem < 1) {
      setErro("A ordem deve ser um número inteiro maior que zero.");
      return;
    }

    setSalvando(true);

    const dados = {
      condominio_id: condominioId,
      area_id: Number(formulario.area_id),
      nome: formulario.nome.trim(),
      hora_inicio: formulario.hora_inicio,
      hora_fim: formulario.hora_fim,
      dias_semana: formulario.dias_semana,
      intervalo_limpeza_minutos: intervalo,
      ordem,
    };

    const resultado = periodoEditando
      ? await supabase
          .from("periodos_areas")
          .update(dados)
          .eq("id", periodoEditando)
          .eq("condominio_id", condominioId)
      : await supabase.from("periodos_areas").insert(dados);

    if (resultado.error) {
      setErro(resultado.error.message);
      setSalvando(false);
      return;
    }

    const { data, error: erroConsulta } = await supabase
      .from("periodos_areas")
      .select(`
        id,
        area_id,
        nome,
        hora_inicio,
        hora_fim,
        dias_semana,
        intervalo_limpeza_minutos,
        ordem,
        ativo
      `)
      .eq("condominio_id", condominioId)
      .order("ordem", { ascending: true });

    if (erroConsulta) {
      setErro("O período foi salvo, mas não foi possível atualizar a listagem.");
      setSalvando(false);
      return;
    }

    setPeriodos((data ?? []) as Periodo[]);
    setModalAberto(false);
    setPeriodoEditando(null);
    setMensagem(
      periodoEditando
        ? "Período atualizado com sucesso!"
        : "Período cadastrado com sucesso!"
    );
    setSalvando(false);
  };

  const alternarAtivo = async (periodo: Periodo) => {
    setErro("");
    setMensagem("");

    const { error } = await supabase
      .from("periodos_areas")
      .update({ ativo: !periodo.ativo })
      .eq("id", periodo.id)
      .eq("condominio_id", condominioId);

    if (error) {
      setErro(error.message);
      return;
    }

    setPeriodos((atuais) =>
      atuais.map((item) =>
        item.id === periodo.id
          ? { ...item, ativo: !item.ativo }
          : item
      )
    );

    setMensagem(
      periodo.ativo
        ? "Período desativado com sucesso."
        : "Período ativado com sucesso."
    );
  };

  const nomeArea = (areaId: number) =>
    areas.find((area) => area.id === areaId)?.nome ?? "Área não encontrada";

  const diasFormatados = (dias: number[]) => {
    if (!dias || dias.length === 0) return "Nenhum dia selecionado";

    if (dias.length === 7) return "Todos os dias";

    return DIAS.filter((dia) => dias.includes(dia.numero))
      .map((dia) => dia.nome)
      .join(", ");
  };

  const periodosOrdenados = [...periodos].sort((a, b) => {
    const comparacao = a.area_id - b.area_id;
    return comparacao !== 0 ? comparacao : a.ordem - b.ordem;
  });

  return (
    <div className="flex-1 w-full flex flex-col items-center bg-slate-900 min-h-screen text-white">
      <div className="w-full flex flex-col items-center px-4 pt-4 pb-0 md:px-12 md:pt-12 md:pb-0">
        <div className="w-full max-w-4xl">
          <Header showBackButton={true} backUrl="/admin" backText="Voltar" />
        </div>
      </div>

      <div className="w-full flex flex-col items-center px-4 pt-0 pb-4 md:px-12 md:pt-0 md:pb-12">
        <div className="w-full max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Horários e Períodos
              </h1>

              <p className="text-slate-400 mt-2">
                Configure os horários de utilização das áreas comuns.
              </p>
            </div>

            <button
              onClick={abrirNovo}
              disabled={areas.length === 0}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-3 rounded-xl font-semibold"
            >
              <Plus size={19} />
              Novo Período
            </button>
          </div>

          {mensagem && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-900/30 border border-emerald-700 text-emerald-300">
              {mensagem}
            </div>
          )}

          {erro && !modalAberto && (
            <div className="mb-5 p-4 rounded-xl bg-red-900/30 border border-red-700 text-red-300">
              {erro}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className="text-slate-400 text-sm">Áreas disponíveis</p>
              <p className="text-3xl font-bold mt-2">{areas.length}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className="text-slate-400 text-sm">Total de períodos</p>
              <p className="text-3xl font-bold mt-2">{periodos.length}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className="text-slate-400 text-sm">Períodos ativos</p>
              <p className="text-3xl font-bold mt-2">
                {periodos.filter((p) => p.ativo).length}
              </p>
            </div>
          </div>

          {areas.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
              <CalendarDays size={42} className="mx-auto text-slate-500 mb-4" />
              <h2 className="text-xl font-semibold">
                Nenhuma área disponível
              </h2>
              <p className="text-slate-400 mt-2">
                Cadastre uma área comum antes de configurar seus períodos.
              </p>
              <Link
                href="/admin/areas-comuns"
                className="inline-block mt-5 text-blue-400 hover:text-blue-300"
              >
                Ir para Áreas Comuns
              </Link>
            </div>
          ) : periodosOrdenados.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
              <Clock size={42} className="mx-auto text-slate-500 mb-4" />
              <h2 className="text-xl font-semibold">
                Nenhum período cadastrado
              </h2>
              <p className="text-slate-400 mt-2">
                Comece cadastrando os horários de utilização das áreas comuns.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {areas.map((area) => {
                const periodosDaArea = periodosOrdenados.filter(
                  (p) => p.area_id === area.id
                );

                if (periodosDaArea.length === 0) return null;

                return (
                  <section
                    key={area.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
                  >
                    <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold">{area.nome}</h2>
                        <p className="text-sm text-slate-400 mt-1">
                          {periodosDaArea.length} período(s) configurado(s)
                        </p>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-800">
                      {periodosDaArea.map((periodo) => (
                        <div
                          key={periodo.id}
                          className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="font-semibold text-lg">
                                {periodo.nome}
                              </h3>

                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  periodo.ativo
                                    ? "bg-emerald-900/40 text-emerald-300"
                                    : "bg-slate-800 text-slate-400"
                                }`}
                              >
                                {periodo.ativo ? "Ativo" : "Inativo"}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-sm text-slate-300">
                              <span className="inline-flex items-center gap-2">
                                <Clock size={15} className="text-blue-400" />
                                {periodo.hora_inicio.slice(0, 5)} às{" "}
                                {periodo.hora_fim.slice(0, 5)}
                              </span>

                              <span className="inline-flex items-center gap-2">
                                <CalendarDays
                                  size={15}
                                  className="text-blue-400"
                                />
                                {diasFormatados(periodo.dias_semana)}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 mt-2">
                              Intervalo de limpeza:{" "}
                              {periodo.intervalo_limpeza_minutos} minutos
                              {" · "}
                              Ordem: {periodo.ordem}
                            </p>
                          </div>

                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => abrirEdicao(periodo)}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
                            >
                              <Pencil size={15} />
                              Editar
                            </button>

                            <button
                              onClick={() => alternarAtivo(periodo)}
                              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                                periodo.ativo
                                  ? "bg-red-950/50 hover:bg-red-900/60 text-red-300"
                                  : "bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300"
                              }`}
                            >
                              <Power size={15} />
                              {periodo.ativo ? "Desativar" : "Ativar"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {modalAberto && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl my-auto shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-bold">
                    {periodoEditando ? "Editar Período" : "Novo Período"}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Configure os dias e horários de utilização.
                  </p>
                </div>

                <button
                  onClick={fecharModal}
                  disabled={salvando}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
                >
                  <X size={21} />
                </button>
              </div>

              <form onSubmit={salvarPeriodo} className="p-5 space-y-5">
                {erro && (
                  <div className="p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-sm">
                    {erro}
                  </div>
                )}

                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Área comum
                  </label>
                  <select
                    value={formulario.area_id}
                    onChange={(e) => atualizarCampo("area_id", e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
                  >
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Nome do período
                  </label>
                  <input
                    type="text"
                    value={formulario.nome}
                    onChange={(e) => atualizarCampo("nome", e.target.value)}
                    placeholder="Ex.: Período da manhã"
                    required
                    maxLength={100}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      Horário de início
                    </label>
                    <input
                      type="time"
                      value={formulario.hora_inicio}
                      onChange={(e) =>
                        atualizarCampo("hora_inicio", e.target.value)
                      }
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      Horário de término
                    </label>
                    <input
                      type="time"
                      value={formulario.hora_fim}
                      onChange={(e) =>
                        atualizarCampo("hora_fim", e.target.value)
                      }
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-3">
                    Dias de funcionamento
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DIAS.map((dia) => {
                      const selecionado = formulario.dias_semana.includes(
                        dia.numero
                      );

                      return (
                        <button
                          key={dia.numero}
                          type="button"
                          onClick={() => alternarDia(dia.numero)}
                          className={`p-3 rounded-lg border text-sm transition-colors ${
                            selecionado
                              ? "bg-blue-600/20 border-blue-500 text-blue-300"
                              : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500"
                          }`}
                        >
                          {dia.nome}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs text-slate-500 mt-2">
                    Selecione todos os dias em que este período estará disponível.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      Intervalo para limpeza (minutos)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formulario.intervalo_limpeza_minutos}
                      onChange={(e) =>
                        atualizarCampo(
                          "intervalo_limpeza_minutos",
                          e.target.value
                        )
                      }
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-2">
                      Ordem de exibição
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={formulario.ordem}
                      onChange={(e) => atualizarCampo("ordem", e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={fecharModal}
                    disabled={salvando}
                    className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={salvando}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 font-semibold"
                  >
                    {salvando ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    {salvando ? "Salvando..." : "Salvar Período"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
