"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import {
  Plus,
  Trash2,
  UserCircle,
  Phone,
  MessageCircle,
  MapPin,
  FileText,
  Check,
  X,
  Clock,
  Pencil,
  Save,
  Power,
} from "lucide-react";

type Categoria = {
  id: number;
  nome: string;
  ativo: boolean;
};

type Profissional = {
  id: number;
  nome: string;
  especialidade: string;
  categoria_id: number | null;
  telefone: string | null;
  whatsapp: string | null;
  cpf_cnpj: string | null;
  endereco: string | null;
  observacao: string | null;
  status: string;
  condominio_id: number;
};

export default function GerenciarProfissionaisPage() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvandoCategoria, setSalvandoCategoria] = useState(false);

  const [condominioId, setCondominioId] = useState<number | null>(null);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [nome, setNome] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [endereco, setEndereco] = useState("");
  const [observacao, setObservacao] = useState("");

  const [novaCategoria, setNovaCategoria] = useState("");
  const [categoriaEditandoId, setCategoriaEditandoId] = useState<number | null>(null);
  const [categoriaEditandoNome, setCategoriaEditandoNome] = useState("");
  const [modalCategoriasAberto, setModalCategoriasAberto] = useState(false);

  // Carregar profissionais e todas as categorias do condomínio.
  // Categorias inativas continuam carregadas para preservar a identificação
  // dos profissionais que já estão vinculados a elas.
  const carregar = async () => {
    setLoading(true);
    setErro("");

    const supabase = createClient();

    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      setErro("Não foi possível identificar o usuário.");
      setLoading(false);
      return;
    }

    const { data: perfil, error: perfilError } = await supabase
      .from("profiles")
      .select("id, role, condominio_id")
      .eq("id", authData.user.id)
      .single();

    if (
      perfilError ||
      !perfil ||
      !["sindico", "subsindico"].includes(perfil.role)
    ) {
      setErro("Acesso permitido somente ao síndico ou subsíndico.");
      setLoading(false);
      return;
    }

    setUsuarioId(authData.user.id);
    setCondominioId(perfil.condominio_id);

    const {
      data: categoriasData,
      error: categoriasError,
    } = await supabase
      .from("categorias_profissionais")
      .select("id, nome, ativo")
      .eq("condominio_id", perfil.condominio_id)
      .order("nome");

    if (categoriasError) {
      setErro("Erro ao carregar categorias: " + categoriasError.message);
      setLoading(false);
      return;
    }

    const {
      data: profissionaisData,
      error: profissionaisError,
    } = await supabase
      .from("profissionais_indicados")
      .select("*")
      .eq("condominio_id", perfil.condominio_id)
      .order("nome");

    if (profissionaisError) {
      setErro(
        "Erro ao carregar profissionais: " +
          profissionaisError.message
      );
      setLoading(false);
      return;
    }

    setCategorias(categoriasData || []);
    setProfissionais(profissionaisData || []);
    setLoading(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const limparFormulario = () => {
    setNome("");
    setCategoriaId("");
    setTelefone("");
    setWhatsapp("");
    setCpfCnpj("");
    setEndereco("");
    setObservacao("");
  };

  const limparEdicaoCategoria = () => {
    setCategoriaEditandoId(null);
    setCategoriaEditandoNome("");
  };

  // Cadastrar ou editar categoria profissional.
  const handleSalvarCategoria = async (e: FormEvent) => {
    e.preventDefault();

    if (!condominioId) {
      setErro("Não foi possível identificar o condomínio.");
      return;
    }

    const nomeNormalizado = categoriaEditandoId !== null
      ? categoriaEditandoNome.trim()
      : novaCategoria.trim();

    if (!nomeNormalizado) {
      setErro("Informe o nome da categoria.");
      return;
    }

    const duplicada = categorias.some(
      (categoria) =>
        categoria.id !== categoriaEditandoId &&
        categoria.nome.trim().toLocaleLowerCase("pt-BR") ===
          nomeNormalizado.toLocaleLowerCase("pt-BR")
    );

    if (duplicada) {
      setErro("Já existe uma categoria com esse nome neste condomínio.");
      return;
    }

    setSalvandoCategoria(true);
    setErro("");
    setSucesso("");

    const supabase = createClient();

    const resultado = categoriaEditandoId !== null
      ? await supabase
          .from("categorias_profissionais")
          .update({ nome: nomeNormalizado })
          .eq("id", categoriaEditandoId)
          .eq("condominio_id", condominioId)
      : await supabase
          .from("categorias_profissionais")
          .insert({
            nome: nomeNormalizado,
            ativo: true,
            condominio_id: condominioId,
          });

    if (resultado.error) {
      setErro("Não foi possível salvar a categoria: " + resultado.error.message);
      setSalvandoCategoria(false);
      return;
    }

    setNovaCategoria("");
    limparEdicaoCategoria();
    setSucesso(
      categoriaEditandoId !== null
        ? "Categoria atualizada com sucesso."
        : "Categoria cadastrada e ativada com sucesso."
    );

    await carregar();
    setSalvandoCategoria(false);
  };

  // Ativar ou desativar categoria sem apagar os vínculos existentes.
  const handleAlternarCategoria = async (categoria: Categoria) => {
    if (!condominioId) return;

    const acao = categoria.ativo ? "desativar" : "ativar";
    if (
      !confirm(
        `Deseja realmente ${acao} a categoria "${categoria.nome}"?`
      )
    ) {
      return;
    }

    setErro("");
    setSucesso("");

    const supabase = createClient();

    const { error } = await supabase
      .from("categorias_profissionais")
      .update({ ativo: !categoria.ativo })
      .eq("id", categoria.id)
      .eq("condominio_id", condominioId);

    if (error) {
      setErro("Não foi possível alterar a categoria: " + error.message);
      return;
    }

    setSucesso(
      categoria.ativo
        ? "Categoria desativada. Os profissionais vinculados foram preservados."
        : "Categoria ativada com sucesso."
    );

    await carregar();
  };

  // Cadastrar profissional diretamente como aprovado pelo administrador.
  const handleCriar = async (e: FormEvent) => {
    e.preventDefault();

    if (!condominioId || !usuarioId) {
      setErro("Não foi possível identificar o condomínio ou usuário.");
      return;
    }

    if (!categoriaId) {
      setErro("Selecione uma categoria profissional.");
      return;
    }

    if (!telefone.trim() && !whatsapp.trim()) {
      setErro("Informe pelo menos um telefone ou WhatsApp.");
      return;
    }

    const categoria = categorias.find(
      (c) => c.id === Number(categoriaId) && c.ativo
    );

    if (!categoria) {
      setErro("Categoria selecionada inválida ou inativa.");
      return;
    }

    setSalvando(true);
    setErro("");
    setSucesso("");

    const supabase = createClient();

    const { error } = await supabase
      .from("profissionais_indicados")
      .insert({
        nome: nome.trim(),
        especialidade: categoria.nome,
        categoria_id: categoria.id,
        telefone: telefone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        cpf_cnpj: cpfCnpj.trim() || null,
        endereco: endereco.trim() || null,
        observacao: observacao.trim() || null,
        condominio_id: condominioId,
        indicado_por: usuarioId,
        aprovado_por: usuarioId,
        aprovado_em: new Date().toISOString(),
        status: "aprovado",
      });

    if (error) {
      setErro("Não foi possível cadastrar: " + error.message);
      setSalvando(false);
      return;
    }

    limparFormulario();
    setSucesso("Profissional cadastrado e publicado com sucesso!");

    await carregar();
    setSalvando(false);
  };

  // Aprovar indicação.
  const handleAprovar = async (id: number) => {
    if (!usuarioId || !condominioId) return;

    const supabase = createClient();

    setErro("");
    setSucesso("");

    const { error } = await supabase
      .from("profissionais_indicados")
      .update({
        status: "aprovado",
        aprovado_por: usuarioId,
        aprovado_em: new Date().toISOString(),
        motivo_rejeicao: null,
      })
      .eq("id", id)
      .eq("condominio_id", condominioId);

    if (error) {
      setErro("Erro ao aprovar: " + error.message);
      return;
    }

    setSucesso("Profissional aprovado e publicado!");
    await carregar();
  };

  // Rejeitar indicação.
  const handleRejeitar = async (id: number) => {
    if (!confirm("Deseja realmente rejeitar esta indicação?")) return;
    if (!usuarioId || !condominioId) return;

    const supabase = createClient();

    setErro("");
    setSucesso("");

    const { error } = await supabase
      .from("profissionais_indicados")
      .update({
        status: "rejeitado",
        aprovado_por: usuarioId,
        aprovado_em: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("condominio_id", condominioId);

    if (error) {
      setErro("Erro ao rejeitar: " + error.message);
      return;
    }

    setSucesso("Indicação rejeitada.");
    await carregar();
  };

  // Excluir profissional.
  const handleDeletar = async (id: number) => {
    if (!confirm("Apagar este profissional definitivamente?")) return;
    if (!condominioId) return;

    const supabase = createClient();

    setErro("");
    setSucesso("");

    const { error } = await supabase
      .from("profissionais_indicados")
      .delete()
      .eq("id", id)
      .eq("condominio_id", condominioId);

    if (error) {
      setErro("Erro ao excluir: " + error.message);
      return;
    }

    setSucesso("Profissional excluído.");
    await carregar();
  };

  const categoriaNome = (id: number | null) => {
    return categorias.find((c) => c.id === id)?.nome || "Categoria não identificada";
  };

  // Preparar número para ligação e WhatsApp.
  const normalizarNumero = (numero: string) => {
    let digitos = numero.replace(/\D/g, "");

    if (!digitos.startsWith("55")) {
      digitos = "55" + digitos;
    }

    return digitos;
  };

  // Contatos clicáveis.
  const renderContatos = (p: Profissional) => (
    <div className="flex flex-wrap gap-2 mt-1">
      {p.telefone && (
        <a
          href={`tel:+${normalizarNumero(p.telefone)}`}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-600"
        >
          <Phone className="w-4 h-4 text-blue-400" />
          Ligar: {p.telefone}
        </a>
      )}

      {p.whatsapp && (
        <a
          href={`https://wa.me/${normalizarNumero(p.whatsapp)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-green-800 bg-green-900/30 px-3 py-2 text-sm text-green-300 hover:bg-green-900/50"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp: {p.whatsapp}
        </a>
      )}
    </div>
  );

  const pendentes = profissionais.filter(
    (p) => p.status === "pendente"
  );

  const aprovados = profissionais.filter(
    (p) => p.status === "aprovado"
  );

  const rejeitados = profissionais.filter(
    (p) => p.status === "rejeitado"
  );

  const categoriasAtivas = categorias.filter((categoria) => categoria.ativo);

  return (
    <div className="flex-1 w-full flex flex-col items-center p-6 md:p-12 bg-slate-900 min-h-screen">
      {/* CABEÇALHO DO APLICATIVO */}
      <div className="w-full max-w-4xl">
        <Header
          showBackButton={true}
          backUrl="/profissionais"
          backText="Voltar"
        />
      </div>

      {/* PAINEL PRINCIPAL */}
      <div className="w-full max-w-4xl bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-700 shadow-lg">
        {/* TÍTULO */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-4">
          <div className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white">
              Gerenciar Serviços Profissionais
            </h1>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setModalCategoriasAberto(true);
              setErro("");
              setSucesso("");
            }}
            className="h-9 border-yellow-400 bg-yellow-500 px-3 text-sm font-semibold text-slate-950 hover:border-yellow-300 hover:bg-yellow-400"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Gerenciar Categorias
          </Button>
        </div>

        {/* MENSAGENS */}
        {!modalCategoriasAberto && erro && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-900/30 p-3 text-sm text-red-300">
            {erro}
          </div>
        )}

        {!modalCategoriasAberto && sucesso && (
          <div className="mb-4 rounded-lg border border-green-800 bg-green-900/30 p-3 text-sm text-green-300">
            {sucesso}
          </div>
        )}

        {/* MODAL DE GERENCIAMENTO DE CATEGORIAS */}
        {modalCategoriasAberto && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setModalCategoriasAberto(false);
                limparEdicaoCategoria();
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-modal-categorias"
              className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-600 bg-slate-800 p-4 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-700 pb-3">
                <div>
                  <h2
                    id="titulo-modal-categorias"
                    className="text-base font-semibold text-white"
                  >
                    Categorias de Profissionais
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Cadastre, edite ou altere o status das categorias.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setModalCategoriasAberto(false);
                    limparEdicaoCategoria();
                  }}
                  title="Fechar"
                  className="h-8 w-8 text-slate-300 hover:bg-slate-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <form
                onSubmit={handleSalvarCategoria}
                className="mb-3 flex flex-col gap-2 sm:flex-row"
              >
                <Input
                  placeholder={
                    categoriaEditandoId !== null
                      ? "Editar nome da categoria"
                      : "Nome da nova categoria"
                  }
                  value={
                    categoriaEditandoId !== null
                      ? categoriaEditandoNome
                      : novaCategoria
                  }
                  onChange={(e) =>
                    categoriaEditandoId !== null
                      ? setCategoriaEditandoNome(e.target.value)
                      : setNovaCategoria(e.target.value)
                  }
                  required
                  maxLength={80}
                  className="h-9 bg-slate-900 border-slate-700 text-sm text-white placeholder:text-slate-500"
                />

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={salvandoCategoria}
                    className="h-9 flex-1 px-3 text-xs sm:flex-none bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    {salvandoCategoria ? (
                      "Salvando..."
                    ) : categoriaEditandoId !== null ? (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar
                      </>
                    )}
                  </Button>

                  {categoriaEditandoId !== null && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={limparEdicaoCategoria}
                      className="h-9 px-3 text-xs border-slate-600 text-slate-200 hover:bg-slate-700"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>

              {erro && (
                <div className="mb-3 rounded-lg border border-red-800 bg-red-900/30 p-2.5 text-xs text-red-300">
                  {erro}
                </div>
              )}

              {sucesso && (
                <div className="mb-3 rounded-lg border border-green-800 bg-green-900/30 p-2.5 text-xs text-green-300">
                  {sucesso}
                </div>
              )}

              {loading ? (
                <p className="py-3 text-sm text-slate-400">
                  Carregando categorias...
                </p>
              ) : categorias.length === 0 ? (
                <p className="py-3 text-sm text-slate-400">
                  Nenhuma categoria cadastrada. Adicione a primeira acima.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {categorias.map((categoria) => (
                    <div
                      key={categoria.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-700 bg-slate-900/60 px-3 py-2"
                    >
                      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="text-sm font-medium text-slate-200">
                          {categoria.nome}
                        </p>
                        <span
                          className={`text-[11px] font-medium ${
                            categoria.ativo
                              ? "text-green-400"
                              : "text-slate-500"
                          }`}
                        >
                          {categoria.ativo ? "Ativa" : "Inativa"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Editar categoria"
                          onClick={() => {
                            setCategoriaEditandoId(categoria.id);
                            setCategoriaEditandoNome(categoria.nome);
                            setNovaCategoria("");
                            setErro("");
                            setSucesso("");
                          }}
                          className="h-8 w-8 text-blue-300 hover:bg-blue-900/30 hover:text-blue-200"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleAlternarCategoria(categoria)}
                          className={`h-8 px-2.5 text-xs ${
                            categoria.ativo
                              ? "border-amber-800 text-amber-300 hover:bg-amber-900/30"
                              : "border-green-800 text-green-300 hover:bg-green-900/30"
                          }`}
                        >
                          <Power className="mr-1.5 h-3.5 w-3.5" />
                          {categoria.ativo ? "Desativar" : "Ativar"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* FORMULÁRIO DE CADASTRO DE PROFISSIONAL */}
        <form
          onSubmit={handleCriar}
          className="mb-8 rounded-lg border border-slate-700 bg-slate-900/50 p-4"
        >
          <h2 className="mb-4 text-lg font-semibold text-white">
            Cadastrar Novo Profissional
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              placeholder="Nome / Empresa"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />

            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              required
              className="h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white"
            >
              <option value="">Selecione uma categoria</option>
              {categoriasAtivas.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>

            <Input
              placeholder="CPF ou CNPJ"
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />

            <Input
              placeholder="Telefone para ligação"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />

            <Input
              placeholder="WhatsApp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />

            <div className="flex items-center">
              <p className="text-xs text-slate-400">
                Informe pelo menos um contato: telefone ou WhatsApp.
              </p>
            </div>

            <Input
              placeholder="Endereço / Região"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="md:col-span-2 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />

            <Input
              placeholder="Observações (opcional)"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="md:col-span-2 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <Button
            type="submit"
            disabled={salvando || categoriasAtivas.length === 0}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white"
          >
            {salvando ? (
              "Salvando..."
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Profissional
              </>
            )}
          </Button>

          {categoriasAtivas.length === 0 && (
            <p className="mt-3 text-center text-sm text-amber-400">
              Cadastre ou ative uma categoria antes de incluir profissionais.
            </p>
          )}
        </form>

        {/* INDICAÇÕES PENDENTES */}
        <div className="mb-8 border-t border-slate-700 pt-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Clock className="h-5 w-5 text-amber-400" />
            Indicações Pendentes ({pendentes.length})
          </h2>

          {loading ? (
            <p className="py-4 text-center text-slate-400">Carregando...</p>
          ) : pendentes.length === 0 ? (
            <p className="py-4 text-sm text-slate-400">
              Nenhuma indicação aguardando aprovação.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {pendentes.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col gap-3 rounded-lg border border-amber-800 bg-slate-900/50 p-4"
                >
                  <div>
                    <h3 className="text-lg font-bold text-white">{p.nome}</h3>
                    <span className="text-sm font-medium text-blue-300">
                      {categoriaNome(p.categoria_id)}
                    </span>
                  </div>

                  {renderContatos(p)}

                  {p.endereco && (
                    <span className="flex items-center gap-2 text-sm text-slate-300">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      {p.endereco}
                    </span>
                  )}

                  <div className="mt-2 flex gap-2">
                    <Button
                      type="button"
                      onClick={() => handleAprovar(p.id)}
                      className="flex-1 bg-green-600 text-white hover:bg-green-500"
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Aprovar
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRejeitar(p.id)}
                      className="flex-1 border-red-700 text-red-300 hover:bg-red-900/30"
                    >
                      <X className="mr-1 h-4 w-4" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PROFISSIONAIS APROVADOS */}
        <div className="border-t border-slate-700 pt-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Profissionais Publicados ({aprovados.length})
          </h2>

          {loading ? (
            <p className="py-4 text-center text-slate-400">Carregando...</p>
          ) : aprovados.length === 0 ? (
            <p className="py-8 text-center text-slate-400">
              Nenhum profissional aprovado.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {aprovados.map((p) => (
                <div
                  key={p.id}
                  className="relative flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-800 p-4 shadow-sm"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletar(p.id)}
                    className="absolute right-2 top-2 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                    title="Excluir profissional"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <div className="pr-8">
                    <h3 className="text-lg font-bold text-white">{p.nome}</h3>
                    <span className="mt-1 inline-block w-fit rounded-full border border-blue-800 bg-blue-900/30 px-2 py-0.5 text-sm font-medium text-blue-300">
                      {categoriaNome(p.categoria_id)}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-col gap-1.5">
                    {p.cpf_cnpj && (
                      <span className="flex items-center gap-2 text-sm text-slate-300">
                        <FileText className="h-4 w-4 text-slate-500" />
                        {p.cpf_cnpj}
                      </span>
                    )}

                    {renderContatos(p)}

                    {p.endereco && (
                      <span className="flex items-center gap-2 text-sm text-slate-300">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        {p.endereco}
                      </span>
                    )}
                  </div>

                  {p.observacao && (
                    <div className="mt-2 rounded border border-slate-700 bg-slate-900/50 p-3 text-xs italic text-slate-300">
                      "{p.observacao}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INDICAÇÕES REJEITADAS */}
        {rejeitados.length > 0 && (
          <div className="mt-8 border-t border-slate-700 pt-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Indicações Rejeitadas ({rejeitados.length})
            </h2>

            <div className="flex flex-col gap-2">
              {rejeitados.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900/40 p-3"
                >
                  <div>
                    <p className="font-medium text-slate-200">{p.nome}</p>
                    <p className="text-xs text-slate-400">
                      {categoriaNome(p.categoria_id)}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletar(p.id)}
                    className="text-red-400 hover:bg-red-900/30 hover:text-red-300"
                    title="Excluir indicação"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
