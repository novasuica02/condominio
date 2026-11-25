
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import {
  Plus,
  Pencil,
  X,
  Save,
  Loader2,
  Building2,
  Users,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Power,
} from "lucide-react";

type Area = {
  id: number;
  nome: string;
  descricao: string | null;
  modalidade: string;
  capacidade_maxima: number | null;
  limite_mensal_unidade: number;
  prazo_cancelamento_horas: number;
  antecedencia_maxima_dias: number;
  taxa_utilizacao: number;
  exige_aprovacao_padrao: boolean;
  checkin_obrigatorio: boolean;
  ativo: boolean;
};

type Props = {
  areas: Area[];
  meuCargo: string;
  condominioId: number;
};

const formularioInicial = {
  nome: "",
  descricao: "",
  modalidade: "reserva",
  capacidade_maxima: "",
  limite_mensal_unidade: "2",
  prazo_cancelamento_horas: "2",
  antecedencia_maxima_dias: "30",
  taxa_utilizacao: "0",
  exige_aprovacao_padrao: false,
  checkin_obrigatorio: false,
};

export default function AreasComunsClient({
  areas: areasIniciais,
  meuCargo,
  condominioId,
}: Props) {
  const supabase = createClient();

  const [areas, setAreas] = useState(areasIniciais);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [areaEditando, setAreaEditando] = useState<number | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const limparFormulario = () => {
    setFormulario(formularioInicial);
    setAreaEditando(null);
    setModalAberto(false);
    setErro("");
  };

  const abrirCadastro = () => {
    limparFormulario();
    setModalAberto(true);
  };

  const abrirEdicao = (area: Area) => {
    setFormulario({
      nome: area.nome,
      descricao: area.descricao ?? "",
      modalidade: area.modalidade,
      capacidade_maxima: area.capacidade_maxima?.toString() ?? "",
      limite_mensal_unidade: area.limite_mensal_unidade.toString(),
      prazo_cancelamento_horas: area.prazo_cancelamento_horas.toString(),
      antecedencia_maxima_dias: area.antecedencia_maxima_dias.toString(),
      taxa_utilizacao: area.taxa_utilizacao.toString(),
      exige_aprovacao_padrao: area.exige_aprovacao_padrao,
      checkin_obrigatorio: area.checkin_obrigatorio,
    });
    setAreaEditando(area.id);
    setModalAberto(true);
    setErro("");
  };

  const atualizarCampo = (
    campo: keyof typeof formularioInicial,
    valor: string | boolean
  ) => {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  };

  const salvarArea = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCarregando(true);
    setErro("");
    setMensagem("");

    if (!formulario.nome.trim()) {
      setErro("Informe o nome da área.");
      setCarregando(false);
      return;
    }

    if (
      !Number.isInteger(Number(formulario.limite_mensal_unidade)) ||
      Number(formulario.limite_mensal_unidade) < 0 ||
      !Number.isInteger(Number(formulario.prazo_cancelamento_horas)) ||
      Number(formulario.prazo_cancelamento_horas) < 0 ||
      !Number.isInteger(Number(formulario.antecedencia_maxima_dias)) ||
      Number(formulario.antecedencia_maxima_dias) < 0 ||
      Number(formulario.taxa_utilizacao) < 0
    ) {
      setErro("Confira os limites, prazos e a taxa informados.");
      setCarregando(false);
      return;
    }

    const capacidade = formulario.capacidade_maxima.trim()
      ? Number(formulario.capacidade_maxima)
      : null;

    if (
      capacidade !== null &&
      (!Number.isInteger(capacidade) || capacidade <= 0)
    ) {
      setErro("A capacidade máxima deve ser um número inteiro positivo.");
      setCarregando(false);
      return;
    }

    const dados = {
      nome: formulario.nome.trim(),
      descricao: formulario.descricao.trim() || null,
      modalidade: formulario.modalidade,
      capacidade_maxima: capacidade,
      limite_mensal_unidade: Number(formulario.limite_mensal_unidade),
      prazo_cancelamento_horas: Number(formulario.prazo_cancelamento_horas),
      antecedencia_maxima_dias: Number(formulario.antecedencia_maxima_dias),
      taxa_utilizacao: Number(formulario.taxa_utilizacao),
      exige_aprovacao_padrao: formulario.exige_aprovacao_padrao,
      checkin_obrigatorio: formulario.checkin_obrigatorio,
    };

    let resultado;

    if (areaEditando !== null) {
      resultado = await supabase
        .from("areas_comuns")
        .update(dados)
        .eq("id", areaEditando)
        .eq("condominio_id", condominioId);
    } else {
      resultado = await supabase
        .from("areas_comuns")
        .insert({
          ...dados,
          condominio_id: condominioId,
          ativo: true,
        });
    }

    if (resultado.error) {
      setErro("Não foi possível salvar. " + resultado.error.message);
      setCarregando(false);
      return;
    }

    const { data: atualizadas, error: erroConsulta } = await supabase
      .from("areas_comuns")
      .select(`
        id,
        nome,
        descricao,
        modalidade,
        capacidade_maxima,
        limite_mensal_unidade,
        prazo_cancelamento_horas,
        antecedencia_maxima_dias,
        taxa_utilizacao,
        exige_aprovacao_padrao,
        checkin_obrigatorio,
        ativo
      `)
      .eq("condominio_id", condominioId)
      .order("nome", { ascending: true });

    if (erroConsulta) {
      setErro("Área salva, mas não foi possível atualizar a listagem.");
      setCarregando(false);
      return;
    }

    setAreas(atualizadas ?? []);
    setMensagem(
      areaEditando !== null
        ? "Área atualizada com sucesso!"
        : "Área cadastrada com sucesso!"
    );
    limparFormulario();
    setCarregando(false);
  };

  const alternarAtivacao = async (area: Area) => {
    const acao = area.ativo ? "desativar" : "ativar";

    if (!window.confirm(`Deseja realmente ${acao} a área "${area.nome}"?`)) {
      return;
    }

    setCarregando(true);
    setErro("");
    setMensagem("");

    const { error } = await supabase
      .from("areas_comuns")
      .update({ ativo: !area.ativo })
      .eq("id", area.id)
      .eq("condominio_id", condominioId);

    if (error) {
      setErro("Não foi possível alterar a situação: " + error.message);
      setCarregando(false);
      return;
    }

    setAreas((atuais) =>
      atuais.map((item) =>
        item.id === area.id ? { ...item, ativo: !area.ativo } : item
      )
    );

    setMensagem(`Área ${area.ativo ? "desativada" : "ativada"} com sucesso!`);
    setCarregando(false);
  };

  const modalidadeTexto = (modalidade: string) => {
    if (modalidade === "reserva") return "Com reserva";
    if (modalidade === "livre") return "Uso livre";
    if (modalidade === "ocupacao") return "Por ocupação";
    return modalidade;
  };

  const totalAtivas = areas.filter((area) => area.ativo).length;
  const totalInativas = areas.filter((area) => !area.ativo).length;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header global */}
      <div className="w-full flex flex-col items-center px-4 pt-2 pb-0 md:px-12 md:pt-4 md:pb-0">
        <div className="w-full max-w-4xl">
          <Header
            showBackButton={true}
            backUrl="/admin"
            backText="Voltar"
          />
        </div>
      </div>

      <main className="flex-1 w-full flex flex-col items-center px-4 pt-0 pb-4 md:px-12 md:pt-0 md:pb-12 bg-slate-900 min-h-screen">
        <div className="w-full max-w-4xl flex flex-col gap-3 text-white">

          {/* Cabeçalho e resumo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                <Building2 size={20} />
              </div>

              <div className="min-w-0">
                <h1 className="text-xl font-bold leading-tight">
                  Áreas Comuns
                </h1>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400">
                  <span>
                    Total: <strong className="text-white">{areas.length}</strong>
                  </span>
                  <span>
                    Ativas: <strong className="text-emerald-400">{totalAtivas}</strong>
                  </span>
                  <span>
                    Inativas: <strong className="text-slate-300">{totalInativas}</strong>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={abrirCadastro}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-sm font-semibold transition shrink-0"
            >
              <Plus size={17} />
              Nova área
            </button>
          </div>

          {/* Mensagens */}
          {mensagem && (
            <div className="rounded-lg border border-emerald-700 bg-emerald-950/40 p-3 text-sm text-emerald-300">
              {mensagem}
            </div>
          )}

          {erro && !modalAberto && (
            <div className="rounded-lg border border-red-700 bg-red-950/40 p-3 text-sm text-red-300">
              {erro}
            </div>
          )}

          {/* Lista de áreas */}
          {areas.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
              <Building2 size={36} className="mx-auto text-slate-500 mb-3" />
              <h2 className="text-lg font-semibold mb-2">
                Nenhuma área cadastrada
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                Comece cadastrando a primeira área comum do condomínio.
              </p>
              <button
                onClick={abrirCadastro}
                className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-sm font-semibold"
              >
                Cadastrar primeira área
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {areas.map((area) => (
                <div
                  key={area.id}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-4"
                >
                  {/* Nome e situação */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                        <Building2 size={19} />
                      </div>

                      <div className="min-w-0">
                        <h2 className="font-bold text-base leading-tight break-words">
                          {area.nome}
                        </h2>
                        <span
                          className={`inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full ${
                            area.ativo
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {area.ativo ? "Ativa" : "Inativa"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {area.descricao && (
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      {area.descricao}
                    </p>
                  )}

                  {/* Informações da área */}
                  <div className="mt-3 pt-3 border-t border-slate-700 space-y-2 text-xs">
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-400">Modalidade</span>
                      <span className="text-slate-200 text-right">
                        {modalidadeTexto(area.modalidade)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Users size={13} /> Capacidade
                      </span>
                      <span className="text-slate-200 text-right">
                        {area.capacidade_maxima ?? "Não definida"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <CalendarDays size={13} /> Limite mensal/unidade
                      </span>
                      <span className="text-slate-200 text-right">
                        {area.limite_mensal_unidade}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-slate-400">Taxa</span>
                      <span className="text-slate-200 text-right">
                        {Number(area.taxa_utilizacao).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-slate-400">Aprovação</span>
                      <span className="text-slate-200 text-right">
                        {area.exige_aprovacao_padrao ? "Obrigatória" : "Padrão"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-slate-400">Check-in</span>
                      <span className="text-slate-200 text-right">
                        {area.checkin_obrigatorio ? "Obrigatório" : "Não"}
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-700">
                    <button
                      onClick={() => abrirEdicao(area)}
                      disabled={carregando}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 px-2 py-2 text-xs font-medium disabled:opacity-50"
                    >
                      <Pencil size={14} />
                      Editar
                    </button>

                    <button
                      onClick={() => alternarAtivacao(area)}
                      disabled={carregando}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 px-2 py-2 text-xs font-medium disabled:opacity-50"
                    >
                      <Power size={14} />
                      {area.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal de cadastro e edição */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-800 border border-slate-700 rounded-xl my-auto max-h-[94dvh] flex flex-col">

            {/* Cabeçalho do modal */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-700 shrink-0">
              <div>
                <h2 className="text-lg font-bold">
                  {areaEditando !== null ? "Editar área" : "Nova área comum"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure as características e regras de utilização.
                </p>
              </div>

              <button
                onClick={limparFormulario}
                disabled={carregando}
                className="text-slate-400 hover:text-white p-1 disabled:opacity-50"
                aria-label="Fechar"
              >
                <X size={21} />
              </button>
            </div>

            {/* Formulário com rolagem */}
            <form
              onSubmit={salvarArea}
              className="p-4 space-y-4 overflow-y-auto"
            >
              {erro && (
                <div className="rounded-lg border border-red-700 bg-red-950/40 p-3 text-sm text-red-300">
                  {erro}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nome da área *
                </label>
                <input
                  required
                  value={formulario.nome}
                  onChange={(e) => atualizarCampo("nome", e.target.value)}
                  placeholder="Ex.: Salão de festas"
                  className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Descrição
                </label>
                <textarea
                  value={formulario.descricao}
                  onChange={(e) => atualizarCampo("descricao", e.target.value)}
                  rows={2}
                  placeholder="Informações sobre a área..."
                  className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2.5 text-sm outline-none focus:border-blue-500 resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Modalidade de utilização *
                </label>
                <select
                  value={formulario.modalidade}
                  onChange={(e) => atualizarCampo("modalidade", e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="reserva">Com reserva</option>
                  <option value="livre">Uso livre</option>
                  <option value="ocupacao">Por ocupação</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Capacidade máxima
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formulario.capacidade_maxima}
                    onChange={(e) =>
                      atualizarCampo("capacidade_maxima", e.target.value)
                    }
                    placeholder="Não definida"
                    className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Limite mensal por unidade *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formulario.limite_mensal_unidade}
                    onChange={(e) =>
                      atualizarCampo("limite_mensal_unidade", e.target.value)
                    }
                    className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Prazo de cancelamento (horas) *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formulario.prazo_cancelamento_horas}
                    onChange={(e) =>
                      atualizarCampo("prazo_cancelamento_horas", e.target.value)
                    }
                    className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Antecedência máxima (dias) *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formulario.antecedencia_maxima_dias}
                    onChange={(e) =>
                      atualizarCampo("antecedencia_maxima_dias", e.target.value)
                    }
                    className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Taxa de utilização (R$) *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={formulario.taxa_utilizacao}
                    onChange={(e) =>
                      atualizarCampo("taxa_utilizacao", e.target.value)
                    }
                    className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              {/* Regras adicionais */}
              <div className="space-y-3 rounded-lg bg-slate-900 border border-slate-700 p-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formulario.exige_aprovacao_padrao}
                    onChange={(e) =>
                      atualizarCampo("exige_aprovacao_padrao", e.target.checked)
                    }
                    className="w-4 h-4 mt-0.5 accent-blue-500 shrink-0"
                  />
                  <span className="text-sm">
                    Exigir aprovação para reservas por padrão
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formulario.checkin_obrigatorio}
                    onChange={(e) =>
                      atualizarCampo("checkin_obrigatorio", e.target.checked)
                    }
                    className="w-4 h-4 mt-0.5 accent-blue-500 shrink-0"
                  />
                  <span className="text-sm">
                    Exigir registro de entrada (check-in)
                  </span>
                </label>
              </div>

              {/* Botões */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={limparFormulario}
                  disabled={carregando}
                  className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={carregando}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  {carregando ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}
                  {carregando ? "Salvando..." : "Salvar área"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
