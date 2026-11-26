
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

  // Carregar profissionais e categorias do condomínio
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
      .eq("ativo", true)
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

  // Cadastrar profissional diretamente como aprovado pelo administrador
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
      (c) => c.id === Number(categoriaId)
    );

    if (!categoria) {
      setErro("Categoria selecionada inválida.");
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

  // Aprovar indicação
  const handleAprovar = async (id: number) => {
    if (!usuarioId) return;

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

  // Rejeitar indicação
  const handleRejeitar = async (id: number) => {
    if (!confirm("Deseja realmente rejeitar esta indicação?")) return;

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

  // Excluir profissional
  const handleDeletar = async (id: number) => {
    if (!confirm("Apagar este profissional definitivamente?")) return;

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
    return categorias.find((c) => c.id === id)?.nome || "Categoria";
  };

  // Preparar número para ligação e WhatsApp
  const normalizarNumero = (numero: string) => {
    let digitos = numero.replace(/\D/g, "");

    if (!digitos.startsWith("55")) {
      digitos = "55" + digitos;
    }

    return digitos;
  };

  // Contatos clicáveis
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
        <div className="flex items-center gap-2 mb-6 border-b border-slate-700 pb-4">
          <UserCircle className="w-5 h-5 text-blue-400" />

          <h1 className="text-xl font-bold text-white">
            Gerenciar Serviços Profissionais
          </h1>
        </div>

        {/* MENSAGENS */}
        {erro && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-900/30 p-3 text-sm text-red-300">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="mb-4 rounded-lg border border-green-800 bg-green-900/30 p-3 text-sm text-green-300">
            {sucesso}
          </div>
        )}

        {/* FORMULÁRIO DE CADASTRO */}
        <form
          onSubmit={handleCriar}
          className="mb-8 bg-slate-900/50 p-4 rounded-lg border border-slate-700"
        >
          <h2 className="text-lg font-semibold text-white mb-4">
            Cadastrar Novo Profissional
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

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
              className="w-full h-10 rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white text-sm"
            >
              <option value="">Selecione uma categoria</option>

              {categorias.map((categoria) => (
                <option
                  key={categoria.id}
                  value={categoria.id}
                >
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
            disabled={salvando || categorias.length === 0}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white"
          >
            {salvando ? (
              "Salvando..."
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Profissional
              </>
            )}
          </Button>

          {categorias.length === 0 && (
            <p className="text-amber-400 text-sm mt-3 text-center">
              Cadastre ou ative uma categoria antes de incluir profissionais.
            </p>
          )}
        </form>

        {/* INDICAÇÕES PENDENTES */}
        <div className="border-t border-slate-700 pt-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Indicações Pendentes ({pendentes.length})
          </h2>

          {loading ? (
            <p className="text-center text-slate-400 py-4">
              Carregando...
            </p>
          ) : pendentes.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">
              Nenhuma indicação aguardando aprovação.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendentes.map((p) => (
                <div
                  key={p.id}
                  className="border border-amber-800 rounded-lg p-4 flex flex-col gap-3 bg-slate-900/50"
                >
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      {p.nome}
                    </h3>

                    <span className="text-sm font-medium text-blue-300">
                      {categoriaNome(p.categoria_id)}
                    </span>
                  </div>

                  {renderContatos(p)}

                  {p.endereco && (
                    <span className="text-sm text-slate-300 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      {p.endereco}
                    </span>
                  )}

                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      onClick={() => handleAprovar(p.id)}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Aprovar
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRejeitar(p.id)}
                      className="flex-1 border-red-700 text-red-300 hover:bg-red-900/30"
                    >
                      <X className="w-4 h-4 mr-1" />
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
          <h2 className="text-lg font-semibold text-white mb-4">
            Profissionais Publicados ({aprovados.length})
          </h2>

          {loading ? (
            <p className="text-center text-slate-400 py-4">
              Carregando...
            </p>
          ) : aprovados.length === 0 ? (
            <p className="text-center text-slate-400 py-8">
              Nenhum profissional aprovado.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aprovados.map((p) => (
                <div
                  key={p.id}
                  className="border border-slate-700 rounded-lg p-4 flex flex-col gap-3 bg-slate-800 shadow-sm relative"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletar(p.id)}
                    className="absolute top-2 right-2 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                    title="Excluir profissional"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  <div className="pr-8">
                    <h3 className="font-bold text-white text-lg">
                      {p.nome}
                    </h3>

                    <span className="text-sm font-medium text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded-full w-fit inline-block mt-1 border border-blue-800">
                      {categoriaNome(p.categoria_id)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-1">
                    {p.cpf_cnpj && (
                      <span className="text-sm text-slate-300 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        {p.cpf_cnpj}
                      </span>
                    )}

                    {renderContatos(p)}

                    {p.endereco && (
                      <span className="text-sm text-slate-300 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        {p.endereco}
                      </span>
                    )}
                  </div>

                  {p.observacao && (
                    <div className="mt-2 bg-slate-900/50 p-3 rounded text-xs text-slate-300 italic border border-slate-700">
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
          <div className="border-t border-slate-700 mt-8 pt-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Indicações Rejeitadas ({rejeitados.length})
            </h2>

            <div className="flex flex-col gap-2">
              {rejeitados.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-slate-700 bg-slate-900/40"
                >
                  <div>
                    <p className="font-medium text-slate-200">
                      {p.nome}
                    </p>

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
                    <Trash2 className="w-4 h-4" />
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
