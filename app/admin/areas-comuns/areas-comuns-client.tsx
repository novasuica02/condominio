
"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import {
  ArrowLeft,
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
        item.id === area.id ? { ...item, ativo: !item.ativo } : item
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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 md:px-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft size={18} />
          Voltar para Gestão
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Áreas Comuns
            </h1>
            <p className="text-slate-400 mt-2">
              Cadastre e configure os espaços do condomínio.
            </p>
          </div>

          <button
            onClick={abrirCadastro}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-3 font-semibold transition"
          >
            <Plus size={19} />
            Nova área
          </button>
        </div>

        {mensagem && (
          <div className="mb-5 rounded-xl border border-emerald-700 bg-emerald-950/40 p-4 text-emerald-300">
            {mensagem}
          </div>
        )}

        {erro && !modalAberto && (
          <div className="mb-5 rounded-xl border border-red-700 bg-red-950/40 p-4 text-red-300">
            {erro}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <Building2 className="text-blue-400 mb-3" size={24} />
            <p className="text-slate-400 text-sm">Total de áreas</p>
            <p className="text-2xl font-bold">{areas.length}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <CheckCircle2 className="text-emerald-400 mb-3" size={24} />
            <p className="text-slate-400 text-sm">Áreas ativas</p>
            <p className="text-2xl font-bold">
              {areas.filter((area) => area.ativo).length}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <XCircle className="text-slate-500 mb-3" size={24} />
            <p className="text-slate-400 text-sm">Áreas inativas</p>
            <p className="text-2xl font-bold">
              {areas.filter((area) => !area.ativo).length}
            </p>
          </div>
        </div>

        {areas.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
            <Building2 size={42} className="mx-auto text-slate-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Nenhuma área cadastrada
            </h2>
            <p className="text-slate-400 mb-5">
              Comece cadastrando a primeira área comum do condomínio.
            </p>
            <button
              onClick={abrirCadastro}
              className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-3 font-semibold"
            >
              Cadastrar primeira área
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {areas.map((area) => (
              <div
                key={area.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                    <Building2 size={25} />
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      area.ativo
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {area.ativo ? "Ativa" : "Inativa"}
                  </span>
                </div>

                <h2 className="text-xl font-bold">{area.nome}</h2>

                {area.descricao && (
                  <p className="text-sm text-slate-400 mt-2">
                    {area.descricao}
                  </p>
                )}

                <div className="mt-5 space-y-3 text-sm text-slate-300">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Modalidade</span>
                    <span>{modalidadeTexto(area.modalidade)}</span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Users size={15} /> Capacidade
                    </span>
                    <span>
                      {area.capacidade_maxima ?? "Não definida"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500 flex items-center gap-2">
                      <CalendarDays size={15} /> Limite mensal/unidade
                    </span>
                    <span>{area.limite_mensal_unidade}</span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Taxa</span>
                    <span>
                      {Number(area.taxa_utilizacao).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Aprovação</span>
                    <span>
                      {area.exige_aprovacao_padrao ? "Obrigatória" : "Padrão"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Check-in</span>
                    <span>
                      {area.checkin_obrigatorio ? "Obrigatório" : "Não"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-slate-800">
                  <button
                    onClick={() => abrirEdicao(area)}
                    disabled={carregando}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-2 text-sm disabled:opacity-50"
                  >
                    <Pencil size={16} />
                    Editar
                  </button>

                  <button
                    onClick={() => alternarAtivacao(area)}
                    disabled={carregando}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-2 text-sm disabled:opacity-50"
                  >
                    <Power size={16} />
                    {area.ativo ? "Desativar" : "Ativar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold">
                  {areaEditando !== null ? "Editar área" : "Nova área comum"}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Configure as características e regras de utilização.
                </p>
              </div>

              <button
                onClick={limparFormulario}
                className="text-slate-400 hover:text-white"
                aria-label="Fechar"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={salvarArea} className="p-5 space-y-5">
              {erro && (
                <div className="rounded-lg border border-red-700 bg-red-950/40 p-3 text-sm text-red-300">
                  {erro}
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Nome da área *
                </label>
                <input
                  required
                  value={formulario.nome}
                  onChange={(e) => atualizarCampo("nome", e.target.value)}
                  placeholder="Ex.: Salão de festas"
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formulario.descricao}
                  onChange={(e) => atualizarCampo("descricao", e.target.value)}
                  rows={3}
                  placeholder="Informações sobre a área..."
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Modalidade de utilização *
                </label>
                <select
                  value={formulario.modalidade}
                  onChange={(e) => atualizarCampo("modalidade", e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="reserva">Com reserva</option>
                  <option value="livre">Uso livre</option>
                  <option value="ocupacao">Por ocupação</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Capacidade máxima
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formulario.capacidade_maxima}
                    onChange={(e) => atualizarCampo("capacidade_maxima", e.target.value)}
                    placeholder="Não definida"
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Limite mensal por unidade *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formulario.limite_mensal_unidade}
                    onChange={(e) => atualizarCampo("limite_mensal_unidade", e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Prazo de cancelamento (horas) *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formulario.prazo_cancelamento_horas}
                    onChange={(e) => atualizarCampo("prazo_cancelamento_horas", e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Antecedência máxima (dias) *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formulario.antecedencia_maxima_dias}
                    onChange={(e) => atualizarCampo("antecedencia_maxima_dias", e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Taxa de utilização (R$) *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={formulario.taxa_utilizacao}
                    onChange={(e) => atualizarCampo("taxa_utilizacao", e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3"
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-xl bg-slate-950 border border-slate-800 p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formulario.exige_aprovacao_padrao}
                    onChange={(e) => atualizarCampo("exige_aprovacao_padrao", e.target.checked)}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <span className="text-sm">
                    Exigir aprovação para reservas por padrão
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formulario.checkin_obrigatorio}
                    onChange={(e) => atualizarCampo("checkin_obrigatorio", e.target.checked)}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <span className="text-sm">
                    Exigir registro de entrada (check-in)
                  </span>
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={limparFormulario}
                  disabled={carregando}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 px-5 py-3"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={carregando}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-5 py-3 font-semibold disabled:opacity-50"
                >
                  {carregando ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
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
