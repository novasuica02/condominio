
"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Pencil,
  Trash2,
  Phone,
  MessageCircle,
  Save,
  X,
  Star,
  Eye,
  EyeOff,
} from "lucide-react";

type TelefoneUtil = {
  id: number;
  condominio_id: number;
  nome: string;
  categoria: string;
  telefone: string;
  telefone_adicional_1: string | null;
  telefone_adicional_2: string | null;
  whatsapp: string | null;
  descricao: string | null;
  prioritario: boolean;
  ordem: number;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
};

type Formulario = {
  nome: string;
  categoria: string;
  telefone: string;
  telefone_adicional_1: string;
  telefone_adicional_2: string;
  whatsapp: string;
  descricao: string;
  prioritario: boolean;
  ordem: number;
  ativo: boolean;
};

const formularioVazio: Formulario = {
  nome: "",
  categoria: "",
  telefone: "",
  telefone_adicional_1: "",
  telefone_adicional_2: "",
  whatsapp: "",
  descricao: "",
  prioritario: false,
  ordem: 0,
  ativo: true,
};

const CATEGORIAS_PADRAO = [
  "Condomínio",
  "Emergência",
  "Saúde",
  "Serviços públicos",
  "Serviços locais",
  "Outros",
];

const OPCAO_NOVA_CATEGORIA = "__NOVA_CATEGORIA__";

export default function GerenciarTelefonesClient({
  contatosIniciais,
  condominioId,
}: {
  contatosIniciais: TelefoneUtil[];
  condominioId: number;
}) {
  const supabase = createClient();

  const [contatos, setContatos] = useState<TelefoneUtil[]>(
    contatosIniciais
  );

  const [formulario, setFormulario] =
    useState<Formulario>(formularioVazio);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [criandoCategoria, setCriandoCategoria] = useState(false);

  const categorias = Array.from(
    new Set([
      ...CATEGORIAS_PADRAO,
      ...contatos.map((c) => c.categoria?.trim()).filter(Boolean),
    ])
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  function abrirNovo() {
    setFormulario({
      ...formularioVazio,
      ordem: contatos.length + 1,
    });
    setEditandoId(null);
    setCriandoCategoria(false);
    setMensagem("");
    setErro("");
    setFormAberto(true);
  }

  function abrirEdicao(contato: TelefoneUtil) {
    const categoriaExiste = [
      ...CATEGORIAS_PADRAO,
      ...contatos.map((c) => c.categoria),
    ].some(
      (categoria) =>
        categoria?.toLowerCase() === contato.categoria?.toLowerCase()
    );

    setFormulario({
      nome: contato.nome,
      categoria: contato.categoria,
      telefone: contato.telefone,
      telefone_adicional_1: contato.telefone_adicional_1 || "",
      telefone_adicional_2: contato.telefone_adicional_2 || "",
      whatsapp: contato.whatsapp || "",
      descricao: contato.descricao || "",
      prioritario: contato.prioritario,
      ordem: contato.ordem,
      ativo: contato.ativo,
    });

    setCriandoCategoria(!categoriaExiste);
    setEditandoId(contato.id);
    setMensagem("");
    setErro("");
    setFormAberto(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function fecharFormulario() {
    setFormAberto(false);
    setEditandoId(null);
    setFormulario(formularioVazio);
    setCriandoCategoria(false);
    setErro("");
  }

  async function salvarContato(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setErro("");
    setMensagem("");

    if (!formulario.nome.trim()) {
      setErro("Informe o nome do contato.");
      return;
    }

    if (!formulario.categoria.trim()) {
      setErro("Selecione ou informe uma categoria.");
      return;
    }

    if (!formulario.telefone.trim()) {
      setErro("Informe o telefone principal.");
      return;
    }

    setSalvando(true);

    const dados = {
      nome: formulario.nome.trim(),
      categoria: formulario.categoria.trim(),
      telefone: formulario.telefone.trim(),
      telefone_adicional_1:
        formulario.telefone_adicional_1.trim() || null,
      telefone_adicional_2:
        formulario.telefone_adicional_2.trim() || null,
      whatsapp: formulario.whatsapp.trim() || null,
      descricao: formulario.descricao.trim() || null,
      prioritario: formulario.prioritario,
      ordem: Number(formulario.ordem) || 0,
      ativo: formulario.ativo,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editandoId !== null) {
        const { data, error } = await supabase
          .from("telefones_uteis")
          .update(dados)
          .eq("id", editandoId)
          .eq("condominio_id", condominioId)
          .select()
          .single();

        if (error) throw error;

        setContatos((anteriores) =>
          anteriores.map((contato) =>
            contato.id === editandoId
              ? (data as TelefoneUtil)
              : contato
          )
        );

        setMensagem("Contato atualizado com sucesso!");
      } else {
        const { data, error } = await supabase
          .from("telefones_uteis")
          .insert({
            ...dados,
            condominio_id: condominioId,
          })
          .select()
          .single();

        if (error) throw error;

        setContatos((anteriores) => [
          ...anteriores,
          data as TelefoneUtil,
        ]);

        setMensagem("Contato cadastrado com sucesso!");
      }

      fecharFormulario();
    } catch (error) {
      console.error("Erro ao salvar contato:", error);
      setErro(
        "Não foi possível salvar o contato. Verifique os dados e tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluirContato(contato: TelefoneUtil) {
    const confirmar = window.confirm(
      `Deseja realmente excluir o contato "${contato.nome}"?`
    );

    if (!confirmar) return;

    setErro("");
    setMensagem("");

    const { error } = await supabase
      .from("telefones_uteis")
      .delete()
      .eq("id", contato.id)
      .eq("condominio_id", condominioId);

    if (error) {
      console.error("Erro ao excluir contato:", error);
      setErro("Não foi possível excluir o contato.");
      return;
    }

    setContatos((anteriores) =>
      anteriores.filter((item) => item.id !== contato.id)
    );

    setMensagem("Contato excluído com sucesso!");
  }

  async function alternarAtivo(contato: TelefoneUtil) {
    setErro("");
    setMensagem("");

    const novoStatus = !contato.ativo;

    const { error } = await supabase
      .from("telefones_uteis")
      .update({
        ativo: novoStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contato.id)
      .eq("condominio_id", condominioId);

    if (error) {
      console.error("Erro ao alterar status:", error);
      setErro("Não foi possível alterar o status do contato.");
      return;
    }

    setContatos((anteriores) =>
      anteriores.map((item) =>
        item.id === contato.id
          ? { ...item, ativo: novoStatus }
          : item
      )
    );

    setMensagem(
      novoStatus
        ? "Contato ativado com sucesso!"
        : "Contato desativado com sucesso!"
    );
  }

  const contatosOrdenados = [...contatos].sort((a, b) => {
    if (a.ordem !== b.ordem) return a.ordem - b.ordem;
    return a.nome.localeCompare(b.nome);
  });

  return (
    <div className="space-y-6">
      {mensagem && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {erro}
        </div>
      )}

      {!formAberto && (
        <button
          type="button"
          onClick={abrirNovo}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-500"
        >
          <Plus size={19} />
          Novo telefone
        </button>
      )}

      {formAberto && (
        <section className="rounded-xl border border-slate-700 bg-slate-800 p-5 shadow-lg md:p-7">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">
              {editandoId !== null
                ? "Editar contato"
                : "Cadastrar novo contato"}
            </h2>

            <button
              type="button"
              onClick={fecharFormulario}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-700 hover:text-white"
              aria-label="Fechar formulário"
            >
              <X size={21} />
            </button>
          </div>

          <form onSubmit={salvarContato} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Nome do contato *
              </label>

              <input
                type="text"
                value={formulario.nome}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    nome: e.target.value,
                  })
                }
                placeholder="Ex.: Portaria"
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Categoria *
              </label>

              <select
                value={
                  criandoCategoria
                    ? OPCAO_NOVA_CATEGORIA
                    : formulario.categoria
                }
                onChange={(e) => {
                  const valor = e.target.value;

                  if (valor === OPCAO_NOVA_CATEGORIA) {
                    setCriandoCategoria(true);
                    setFormulario({
                      ...formulario,
                      categoria: "",
                    });
                  } else {
                    setCriandoCategoria(false);
                    setFormulario({
                      ...formulario,
                      categoria: valor,
                    });
                  }
                }}
                required={!criandoCategoria}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                <option value="">Selecione uma categoria</option>

                {categorias.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}

                <option value={OPCAO_NOVA_CATEGORIA}>
                  + Outra categoria...
                </option>
              </select>

              {criandoCategoria && (
                <div className="mt-3">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Nome da nova categoria
                  </label>

                  <input
                    type="text"
                    autoFocus
                    value={formulario.categoria}
                    onChange={(e) =>
                      setFormulario({
                        ...formulario,
                        categoria: e.target.value,
                      })
                    }
                    placeholder="Digite o nome da categoria"
                    required
                    className="w-full rounded-lg border border-blue-500 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-400"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setCriandoCategoria(false);
                      setFormulario({
                        ...formulario,
                        categoria: "",
                      });
                    }}
                    className="mt-2 text-sm text-slate-400 underline hover:text-white"
                  >
                    Voltar para as categorias existentes
                  </button>
                </div>
              )}

              <p className="mt-2 text-xs text-slate-400">
                Escolha uma categoria existente ou selecione Outra categoria para criar uma nova.
              </p>
            </div>

            <div className="space-y-4 rounded-lg border border-slate-700 bg-slate-900 p-4">
              <h3 className="font-semibold text-white">
                Telefones para ligação
              </h3>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Telefone principal *
                </label>

                <input
                  type="tel"
                  value={formulario.telefone}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      telefone: e.target.value,
                    })
                  }
                  placeholder="(19) 3859-2055"
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Telefone adicional 1
                </label>

                <input
                  type="tel"
                  value={formulario.telefone_adicional_1}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      telefone_adicional_1: e.target.value,
                    })
                  }
                  placeholder="Opcional"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Telefone adicional 2
                </label>

                <input
                  type="tel"
                  value={formulario.telefone_adicional_2}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      telefone_adicional_2: e.target.value,
                    })
                  }
                  placeholder="Opcional"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                WhatsApp
              </label>

              <input
                type="tel"
                value={formulario.whatsapp}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    whatsapp: e.target.value,
                  })
                }
                placeholder="Opcional"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Descrição
              </label>

              <textarea
                value={formulario.descricao}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    descricao: e.target.value,
                  })
                }
                rows={3}
                placeholder="Informações adicionais sobre o contato..."
                className="w-full resize-y rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Ordem de exibição
              </label>

              <input
                type="number"
                min="0"
                value={formulario.ordem}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    ordem: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
              />

              <p className="mt-1 text-xs text-slate-400">
                Menor número aparece primeiro.
              </p>
            </div>

            <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-900 p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={formulario.prioritario}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      prioritario: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-blue-600"
                />

                <span className="flex items-center gap-2 text-sm text-slate-200">
                  <Star size={17} className="text-amber-400" />
                  Destacar este contato
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={formulario.ativo}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      ativo: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-blue-600"
                />

                <span className="text-sm text-slate-200">
                  Contato ativo e visível ao público
                </span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={salvando}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={18} />
                {salvando ? "Salvando..." : "Salvar contato"}
              </button>

              <button
                type="button"
                onClick={fecharFormulario}
                disabled={salvando}
                className="rounded-lg border border-slate-600 px-5 py-3 text-slate-300 transition hover:bg-slate-700"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-xl border border-slate-700 bg-slate-800 p-5 shadow-lg md:p-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">
            Contatos cadastrados
          </h2>

          <span className="rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-300">
            {contatos.length} contato(s)
          </span>
        </div>

        {contatosOrdenados.length === 0 ? (
          <div className="py-10 text-center">
            <Phone size={36} className="mx-auto mb-3 text-slate-500" />

            <p className="font-medium text-slate-300">
              Nenhum contato cadastrado.
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Clique em Novo telefone para começar.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {contatosOrdenados.map((contato) => (
              <article
                key={contato.id}
                className={`rounded-xl border p-4 ${
                  contato.ativo
                    ? "border-slate-700 bg-slate-900"
                    : "border-slate-700/60 bg-slate-900/50 opacity-70"
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-white">
                        {contato.nome}
                      </h3>

                      {contato.prioritario && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1 text-xs text-amber-300">
                          <Star size={12} />
                          Destaque
                        </span>
                      )}

                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          contato.ativo
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-slate-700 text-slate-400"
                        }`}
                      >
                        {contato.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <p className="text-sm text-blue-300">
                      {contato.categoria}
                    </p>

                    <div className="mt-2 space-y-1 text-sm text-slate-400">
                      <p className="inline-flex items-center gap-1">
                        <Phone size={14} />
                        {contato.telefone}
                      </p>

                      {contato.telefone_adicional_1 && (
                        <p>
                          Telefone adicional 1: {contato.telefone_adicional_1}
                        </p>
                      )}

                      {contato.telefone_adicional_2 && (
                        <p>
                          Telefone adicional 2: {contato.telefone_adicional_2}
                        </p>
                      )}

                      {contato.whatsapp && (
                        <p className="inline-flex items-center gap-1">
                          <MessageCircle size={14} />
                          {contato.whatsapp}
                        </p>
                      )}
                    </div>

                    {contato.descricao && (
                      <p className="mt-2 text-sm text-slate-400">
                        {contato.descricao}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-slate-500">
                      Ordem: {contato.ordem}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => abrirEdicao(contato)}
                      title="Editar contato"
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600/15 px-3 py-2 text-sm text-blue-300 transition hover:bg-blue-600/30"
                    >
                      <Pencil size={16} />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => alternarAtivo(contato)}
                      title={contato.ativo ? "Desativar" : "Ativar"}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-600"
                    >
                      {contato.ativo ? (
                        <>
                          <EyeOff size={16} />
                          Desativar
                        </>
                      ) : (
                        <>
                          <Eye size={16} />
                          Ativar
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => excluirContato(contato)}
                      title="Excluir contato"
                      className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
