"use client";

import { useState, useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import Header from "@/components/Header";

import {

  Plus,

  Trash2,

  Phone,

  MessageCircle,

  MapPin,

  FileText,

  Edit,

  X,

  Save,

  FolderCog,

  Tag,

} from "lucide-react";

type Categoria = {

  id: number;

  nome: string;

  descricao: string | null;

  ativo: boolean;

};

// Aplica a máscara brasileira de telefone.

function formatarTelefone(valor: string) {

  let numeros = valor.replace(/\D/g, "");

  // Remove o código do Brasil quando informado.

  if (

    numeros.startsWith("55") &&

    (numeros.length === 12 || numeros.length === 13)

  ) {

    numeros = numeros.slice(2);

  }

  numeros = numeros.slice(0, 11);

  if (!numeros) return "";

  if (numeros.length <= 2) {

    return `(${numeros}`;

  }

  const ddd = numeros.slice(0, 2);

  const numero = numeros.slice(2);

  if (numero.length <= 4) {

    return `(${ddd}) ${numero}`;

  }

  if (numero.length <= 8) {

    return `(${ddd}) ${numero.slice(0, 4)}-${numero.slice(4)}`;

  }

  return `(${ddd}) ${numero.slice(0, 5)}-${numero.slice(5)}`;

}

// Prepara o número para ligação telefônica.

function numeroParaLigacao(valor: string) {

  return valor.replace(/\D/g, "");

}

// Prepara o número para o WhatsApp.

function numeroParaWhatsApp(valor: string) {

  let numeros = valor.replace(/\D/g, "");

  if (!numeros) return "";

  if (numeros.startsWith("55") && (numeros.length === 12 || numeros.length === 13)) {

    return numeros;

  }

  if (numeros.length === 10 || numeros.length === 11) {

    return `55${numeros}`;

  }

  return "";

}

export default function PrestadoresPage() {

  const [prestadores, setPrestadores] = useState<any[]>([]);

  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [loading, setLoading] = useState(true);

  const [condominioId, setCondominioId] = useState<number | null>(null);

  // Formulário de cadastro

  const [nome, setNome] = useState("");

  const [especialidade, setEspecialidade] = useState("");

  const [cpf, setCpf] = useState("");

  const [telefone, setTelefone] = useState("");

  const [whatsapp, setWhatsapp] = useState("");

  const [endereco, setEndereco] = useState("");

  const [email, setEmail] = useState("");

  const [senha, setSenha] = useState("");

  const [categoriaId, setCategoriaId] = useState("");

  const [salvando, setSalvando] = useState(false);

  // Edição de responsável

  const [editando, setEditando] = useState<any | null>(null);

  const [editNome, setEditNome] = useState("");

  const [editEsp, setEditEsp] = useState("");

  const [editTel, setEditTel] = useState("");

  const [editWhatsapp, setEditWhatsapp] = useState("");

  const [editEnd, setEditEnd] = useState("");

  const [editCategoriaId, setEditCategoriaId] = useState("");

  // Gerenciamento de categorias

  const [mostrarCategorias, setMostrarCategorias] = useState(false);

  const [categoriaEditando, setCategoriaEditando] =

    useState<Categoria | null>(null);

  const [novaCategoria, setNovaCategoria] = useState("");

  const [descricaoCategoria, setDescricaoCategoria] = useState("");

  const [salvandoCategoria, setSalvandoCategoria] = useState(false);

  // Carregar responsáveis e categorias do condomínio autenticado

  const carregar = async () => {

    const supabase = createClient();

    setLoading(true);

    try {

      const {

        data: { user },

        error: erroUsuario,

      } = await supabase.auth.getUser();

      if (erroUsuario || !user) {

        throw new Error(

          "Não foi possível identificar o usuário autenticado."

        );

      }

      const { data: perfil, error: erroPerfil } = await supabase

        .from("profiles")

        .select("condominio_id")

        .eq("id", user.id)

        .single();

      if (erroPerfil || !perfil?.condominio_id) {

        throw new Error(

          "Não foi possível identificar o condomínio do usuário."

        );

      }

      const idCondominio = Number(perfil.condominio_id);

      setCondominioId(idCondominio);

      const [

        { data: dadosPrestadores, error: erroPrestadores },

        { data: dadosCategorias, error: erroCategorias },

      ] = await Promise.all([

        supabase
          .from("prestadores")
          .select("*")
          .eq("condominio_id", idCondominio)
          .order("nome"),

        supabase
          .from("categorias_responsaveis")
          .select("*")
          .eq("condominio_id", idCondominio)
          .order("nome"),

      ]);

      if (erroPrestadores) {

        throw new Error(

          "Erro ao carregar responsáveis: " + erroPrestadores.message

        );

      }

      if (erroCategorias) {

        throw new Error(

          "Erro ao carregar categorias: " + erroCategorias.message

        );

      }

      setPrestadores(dadosPrestadores || []);

      setCategorias(dadosCategorias || []);

    } catch (err: any) {

      alert(err.message || "Erro ao carregar os dados.");

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    carregar();

  }, []);

  const limparFormulario = () => {

    setNome("");

    setEspecialidade("");

    setCpf("");

    setTelefone("");

    setWhatsapp("");

    setEndereco("");

    setEmail("");

    setSenha("");

    setCategoriaId("");

  };

  const handleCriar = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!categoriaId) {

      alert("Selecione uma categoria.");

      return;

    }

    if (!email.trim() || !senha) {

      alert("E-mail e senha são obrigatórios para criar o acesso.");

      return;

    }

    setSalvando(true);

    try {

      const resposta = await fetch("/api/cadastrar-responsavel", {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

        },

        body: JSON.stringify({

          nome,

          especialidade,

          cpf_cnpj: cpf,

          telefone,

          whatsapp,

          endereco,

          email,

          senha,

          categoria_id: Number(categoriaId),

        }),

      });

      const resultado = await resposta.json();

      if (!resposta.ok) {

        throw new Error(

          resultado.error || "Erro ao cadastrar responsável."

        );

      }

      limparFormulario();

      await carregar();

      alert("Responsável cadastrado com sucesso!");

    } catch (err: any) {

      alert(

        err.message || "Não foi possível cadastrar o responsável."

      );

    } finally {

      setSalvando(false);

    }

  };

  const handleDeletar = async (id: number) => {
    if (!condominioId) {
      alert("Não foi possível identificar o condomínio.");
      return;
    }

    if (
      !confirm(
        "Apagar este responsável? Essa ação pode ser impedida se ele estiver vinculado a chamados."
      )
    ) {
      return;
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("prestadores")
      .delete()
      .eq("id", id)
      .eq("condominio_id", condominioId);

    if (error) {
      alert("Não foi possível excluir: " + error.message);
      return;
    }

    await carregar();
  };

  const abrirEdicao = (p: any) => {

    setEditando(p);

    setEditNome(p.nome || "");

    setEditEsp(p.especialidade || "");

    setEditTel(formatarTelefone(p.telefone || ""));

    setEditWhatsapp(formatarTelefone(p.whatsapp || ""));

    setEditEnd(p.endereco || "");

    setEditCategoriaId(

      p.categoria_id ? String(p.categoria_id) : ""

    );

  };

  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!condominioId) {
      alert("Não foi possível identificar o condomínio.");
      return;
    }

    if (!editCategoriaId) {
      alert("Selecione uma categoria.");
      return;
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("prestadores")
      .update({
        nome: editNome,
        especialidade: editEsp,
        telefone: editTel.trim() || null,
        whatsapp: editWhatsapp.trim() || null,
        endereco: editEnd,
        categoria_id: Number(editCategoriaId),
      })
      .eq("id", editando.id)
      .eq("condominio_id", condominioId);

    if (error) {
      alert("Erro ao atualizar: " + error.message);
      return;
    }

    setEditando(null);
    await carregar();
    alert("Responsável atualizado com sucesso!");
  };

  // Criar ou atualizar categoria

  const salvarCategoria = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!novaCategoria.trim()) {

      alert("Informe o nome da categoria.");

      return;

    }

    if (!condominioId) {

      alert("Não foi possível identificar o condomínio.");

      return;

    }

    setSalvandoCategoria(true);

    try {

      const supabase = createClient();

      let error;

      if (categoriaEditando) {

        const resultado = await supabase

          .from("categorias_responsaveis")

          .update({

            nome: novaCategoria.trim(),

            descricao: descricaoCategoria.trim() || null,

          })

          .eq("id", categoriaEditando.id)
          .eq("condominio_id", condominioId);

        error = resultado.error;

      } else {

        const resultado = await supabase

          .from("categorias_responsaveis")

          .insert({

            nome: novaCategoria.trim(),

            descricao: descricaoCategoria.trim() || null,

            ativo: true,

            condominio_id: condominioId,

          });

        error = resultado.error;

      }

      if (error) {

        throw new Error(error.message);

      }

      setNovaCategoria("");

      setDescricaoCategoria("");

      setCategoriaEditando(null);

      await carregar();

      alert("Categoria salva com sucesso!");

    } catch (err: any) {

      alert("Erro ao salvar categoria: " + err.message);

    } finally {

      setSalvandoCategoria(false);

    }

  };

  const abrirEdicaoCategoria = (categoria: Categoria) => {

    setCategoriaEditando(categoria);

    setNovaCategoria(categoria.nome);

    setDescricaoCategoria(categoria.descricao || "");

  };

  const cancelarEdicaoCategoria = () => {

    setCategoriaEditando(null);

    setNovaCategoria("");

    setDescricaoCategoria("");

  };

  const desativarCategoria = async (categoria: Categoria) => {

    if (

      !confirm(

        `Desativar a categoria "${categoria.nome}"? Os responsáveis já cadastrados não serão excluídos.`

      )

    ) {

      return;

    }

    const supabase = createClient();

    const { error } = await supabase

      .from("categorias_responsaveis")

      .update({ ativo: false })

      .eq("id", categoria.id)
      .eq("condominio_id", condominioId);

    if (error) {

      alert("Erro ao desativar categoria: " + error.message);

      return;

    }

    await carregar();

    alert(

      "Categoria desativada. Os vínculos existentes foram preservados."

    );

  };

  const categoriasAtivas = categorias.filter((c) => c.ativo);

  return (

    <div className="flex-1 w-full flex flex-col items-center p-4 md:p-12 bg-slate-900 min-h-screen">

      <div className="w-full max-w-4xl flex flex-col gap-4">

        <Header

          showBackButton={true}

          backUrl="/chamados"

          backText="Voltar"

        />

        <div className="w-full bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-700 shadow-lg">

          {/* FORMULÁRIO DE CADASTRO */}

          <form

            onSubmit={handleCriar}

            className="mb-8 bg-slate-900/50 p-4 rounded-lg border border-slate-700"

          >

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <Input

                placeholder="Nome / Empresa"

                value={nome}

                onChange={(e) => setNome(e.target.value)}

                required

                className="bg-slate-700 border-slate-600 text-white"

              />

              <select

                value={categoriaId}

                onChange={(e) => setCategoriaId(e.target.value)}

                required

                className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white"

              >

                <option value="">Selecione a categoria</option>

                {categoriasAtivas.map((c) => (

                  <option key={c.id} value={c.id}>

                    {c.nome}

                  </option>

                ))}

              </select>

              <Input

                placeholder="Especialidade / Função"

                value={especialidade}

                onChange={(e) => setEspecialidade(e.target.value)}

                className="bg-slate-700 border-slate-600 text-white"

              />

              <Input

                placeholder="CPF ou CNPJ"

                value={cpf}

                onChange={(e) => setCpf(e.target.value)}

                className="bg-slate-700 border-slate-600 text-white"

              />

              <Input

                placeholder="Telefone para ligação (DDD + número)"

                value={telefone}

                onChange={(e) =>

                  setTelefone(formatarTelefone(e.target.value))

                }

                inputMode="tel"

                className="bg-slate-700 border-slate-600 text-white"

              />

              <Input

                placeholder="WhatsApp (opcional, independente do telefone)"

                value={whatsapp}

                onChange={(e) =>

                  setWhatsapp(formatarTelefone(e.target.value))

                }

                inputMode="tel"

                className="bg-slate-700 border-slate-600 text-white"

              />

              <Input

                placeholder="Endereço"

                value={endereco}

                onChange={(e) => setEndereco(e.target.value)}

                className="md:col-span-2 bg-slate-700 border-slate-600 text-white"

              />

              <div className="md:col-span-2 border-t border-slate-700 pt-3 mt-1">

                <p className="text-xs text-blue-400 mb-2 font-semibold">

                  Acesso ao aplicativo

                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <Input

                    type="email"

                    placeholder="E-mail de acesso"

                    value={email}

                    onChange={(e) => setEmail(e.target.value)}

                    required

                    className="bg-slate-700 border-slate-600 text-white"

                  />

                  <Input

                    type="password"

                    placeholder="Senha provisória (mínimo 6 caracteres)"

                    value={senha}

                    onChange={(e) => setSenha(e.target.value)}

                    required

                    minLength={6}

                    className="bg-slate-700 border-slate-600 text-white"

                  />

                </div>

              </div>

            </div>

            <Button

              type="submit"

              disabled={salvando || categoriasAtivas.length === 0}

              className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white"

            >

              {salvando ? (

                "Cadastrando..."

              ) : (

                <>

                  <Plus className="w-4 h-4 mr-2" />

                  Cadastrar Responsável

                </>

              )}

            </Button>

            {categoriasAtivas.length === 0 && (

              <p className="text-amber-400 text-sm mt-3 text-center">

                Cadastre ou ative uma categoria antes de incluir responsáveis.

              </p>

            )}

          </form>

          {/* BOTÃO DE CATEGORIAS */}

          <div className="flex flex-wrap justify-between items-center gap-3 mb-5">

            <h2 className="text-lg font-bold text-white">

              Responsáveis Cadastrados

            </h2>

            <Button

              type="button"

              variant="default"

              onClick={() => setMostrarCategorias(true)}

              className="bg-slate-700 text-white border border-slate-600 hover:bg-slate-600 hover:text-white"

            >

              <FolderCog className="w-4 h-4 mr-2 text-blue-300" />

              Gerenciar Categorias

            </Button>

          </div>

          {/* LISTA DE RESPONSÁVEIS */}

          {loading ? (

            <p className="text-center text-slate-400">Carregando...</p>

          ) : prestadores.length === 0 ? (

            <p className="text-center text-slate-400 py-8">

              Nenhum responsável cadastrado ainda.

            </p>

          ) : (

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {prestadores.map((p) => {

                const categoria = categorias.find(

                  (c) => c.id === p.categoria_id

                );

                const telefoneLimpo = numeroParaLigacao(p.telefone || "");

                const whatsappLimpo = numeroParaWhatsApp(p.whatsapp || "");

                return (

                  <div

                    key={p.id}

                    className="border border-slate-700 rounded-lg p-4 flex flex-col gap-2 bg-slate-800 shadow-sm relative"

                  >

                    <div className="absolute top-2 right-2 flex gap-1">

                      <Button

                        variant="ghost"

                        size="icon"

                        onClick={() => abrirEdicao(p)}

                        className="text-blue-400 hover:bg-blue-900/30 hover:text-blue-300"

                        title="Editar"

                      >

                        <Edit className="w-4 h-4" />

                      </Button>

                      <Button

                        variant="ghost"

                        size="icon"

                        onClick={() => handleDeletar(p.id)}

                        className="text-red-400 hover:bg-red-900/30 hover:text-red-300"

                        title="Excluir"

                      >

                        <Trash2 className="w-4 h-4" />

                      </Button>

                    </div>

                    <h3 className="font-bold text-white text-lg pr-16">

                      {p.nome}

                    </h3>

                    <div className="flex flex-wrap gap-2">

                      <span className="text-sm font-medium text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded-full w-fit border border-blue-800">

                        {categoria?.nome || "Sem categoria"}

                      </span>

                      {p.especialidade && (

                        <span className="text-sm text-slate-300 bg-slate-700 px-2 py-0.5 rounded-full w-fit">

                          {p.especialidade}

                        </span>

                      )}

                    </div>

                    <div className="text-sm text-slate-300 flex flex-col gap-2 mt-2">

                      {p.cpf_cnpj && (

                        <span className="flex items-center gap-2">

                          <FileText className="w-4 h-4 text-slate-500 shrink-0" />

                          {p.cpf_cnpj}

                        </span>

                      )}

                      {p.telefone && (

                        <div className="flex flex-wrap items-center gap-2">

                          <Phone className="w-4 h-4 text-slate-500 shrink-0" />

                          <span>{formatarTelefone(p.telefone)}</span>

                          {telefoneLimpo && (

                            <a

                              href={`tel:${telefoneLimpo}`}

                              className="inline-flex items-center gap-1 rounded-md bg-blue-600/20 border border-blue-500/40 px-2 py-1 text-xs font-semibold text-blue-300 hover:bg-blue-600/40 hover:text-white transition-colors"

                            >

                              <Phone className="w-3 h-3" />

                              Ligar

                            </a>

                          )}

                        </div>

                      )}

                      {p.whatsapp && (

                        <div className="flex flex-wrap items-center gap-2">

                          <MessageCircle className="w-4 h-4 text-green-400 shrink-0" />

                          <span>{formatarTelefone(p.whatsapp)}</span>

                          {whatsappLimpo && (

                            <a

                              href={`https://wa.me/${whatsappLimpo}`}

                              target="_blank"

                              rel="noopener noreferrer"

                              className="inline-flex items-center gap-1 rounded-md bg-green-600/20 border border-green-500/40 px-2 py-1 text-xs font-semibold text-green-300 hover:bg-green-600/40 hover:text-white transition-colors"

                            >

                              <MessageCircle className="w-3 h-3" />

                              WhatsApp

                            </a>

                          )}

                        </div>

                      )}

                      {p.endereco && (

                        <span className="flex items-center gap-2">

                          <MapPin className="w-4 h-4 text-slate-500 shrink-0" />

                          {p.endereco}

                        </span>

                      )}

                    </div>

                    {p.email && (

                      <p className="text-xs text-teal-400 mt-2 border-t border-slate-700 pt-2 flex items-center gap-2">

                        <span className="font-semibold">Login:</span>

                        {p.email}

                      </p>

                    )}

                  </div>

                );

              })}

            </div>

          )}

          {/* MODAL DE EDIÇÃO DO RESPONSÁVEL */}

          {editando && (

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">

              <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-700">

                <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">

                  <h2 className="text-lg font-bold text-white">

                    Editar Responsável

                  </h2>

                  <Button

                    variant="ghost"

                    size="icon"

                    onClick={() => setEditando(null)}

                    className="text-slate-400 hover:text-white"

                  >

                    <X className="w-5 h-5" />

                  </Button>

                </div>

                <form

                  onSubmit={salvarEdicao}

                  className="p-5 flex flex-col gap-4"

                >

                  <div>

                    <label className="text-sm font-medium mb-1 block text-slate-300">

                      Nome

                    </label>

                    <Input

                      value={editNome}

                      onChange={(e) => setEditNome(e.target.value)}

                      required

                      className="bg-slate-700 border-slate-600 text-white"

                    />

                  </div>

                  <div>

                    <label className="text-sm font-medium mb-1 block text-slate-300">

                      Categoria

                    </label>

                    <select

                      value={editCategoriaId}

                      onChange={(e) => setEditCategoriaId(e.target.value)}

                      required

                      className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white"

                    >

                      <option value="">Selecione a categoria</option>

                      {categorias.map((c) => (

                        <option key={c.id} value={c.id}>

                          {c.nome}{!c.ativo ? " (inativa)" : ""}

                        </option>

                      ))}

                    </select>

                  </div>

                  <div>

                    <label className="text-sm font-medium mb-1 block text-slate-300">

                      Especialidade / Função

                    </label>

                    <Input

                      value={editEsp}

                      onChange={(e) => setEditEsp(e.target.value)}

                      className="bg-slate-700 border-slate-600 text-white"

                    />

                  </div>

                  <div>

                    <label className="text-sm font-medium mb-1 block text-slate-300">

                      Telefone para ligação

                    </label>

                    <Input

                      value={editTel}

                      onChange={(e) =>

                        setEditTel(formatarTelefone(e.target.value))

                      }

                      inputMode="tel"

                      placeholder="(11) 99999-9999"

                      className="bg-slate-700 border-slate-600 text-white"

                    />

                  </div>

                  <div>

                    <label className="text-sm font-medium mb-1 block text-slate-300">

                      WhatsApp

                    </label>

                    <Input

                      value={editWhatsapp}

                      onChange={(e) =>

                        setEditWhatsapp(formatarTelefone(e.target.value))

                      }

                      inputMode="tel"

                      placeholder="(11) 99999-9999"

                      className="bg-slate-700 border-slate-600 text-white"

                    />

                  </div>

                  <div>

                    <label className="text-sm font-medium mb-1 block text-slate-300">

                      Endereço

                    </label>

                    <Input

                      value={editEnd}

                      onChange={(e) => setEditEnd(e.target.value)}

                      className="bg-slate-700 border-slate-600 text-white"

                    />

                  </div>

                  <Button

                    type="submit"

                    className="mt-2 bg-blue-600 hover:bg-blue-500 text-white"

                  >

                    <Save className="w-4 h-4 mr-2" />

                    Salvar Alterações

                  </Button>

                </form>

              </div>

            </div>

          )}

          {/* MODAL DE GERENCIAMENTO DE CATEGORIAS */}

          {mostrarCategorias && (

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">

              <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700">

                <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">

                  <h2 className="text-lg font-bold text-white flex items-center gap-2">

                    <FolderCog className="w-5 h-5 text-blue-400" />

                    Gerenciar Categorias

                  </h2>

                  <Button

                    variant="ghost"

                    size="icon"

                    onClick={() => {

                      setMostrarCategorias(false);

                      cancelarEdicaoCategoria();

                    }}

                    className="text-slate-400 hover:text-white"

                  >

                    <X className="w-5 h-5" />

                  </Button>

                </div>

                <div className="p-5">

                  <form

                    onSubmit={salvarCategoria}

                    className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6"

                  >

                    <h3 className="text-sm font-semibold text-blue-300 mb-3">

                      {categoriaEditando

                        ? "Editar Categoria"

                        : "Nova Categoria"}

                    </h3>

                    <div className="flex flex-col gap-3">

                      <Input

                        placeholder="Nome da categoria"

                        value={novaCategoria}

                        onChange={(e) => setNovaCategoria(e.target.value)}

                        required

                        className="bg-slate-700 border-slate-600 text-white"

                      />

                      <Input

                        placeholder="Descrição (opcional)"

                        value={descricaoCategoria}

                        onChange={(e) =>

                          setDescricaoCategoria(e.target.value)

                        }

                        className="bg-slate-700 border-slate-600 text-white"

                      />

                    </div>

                    <div className="flex gap-2 mt-3">

                      <Button

                        type="submit"

                        disabled={salvandoCategoria}

                        className="bg-blue-600 hover:bg-blue-500 text-white"

                      >

                        <Save className="w-4 h-4 mr-2" />

                        {salvandoCategoria

                          ? "Salvando..."

                          : "Salvar Categoria"}

                      </Button>

                      {categoriaEditando && (

                        <Button

                          type="button"

                          variant="outline"

                          onClick={cancelarEdicaoCategoria}

                          className="border-slate-600 text-slate-200"

                        >

                          Cancelar

                        </Button>

                      )}

                    </div>

                  </form>

                  <h3 className="text-white font-semibold mb-3">

                    Categorias cadastradas

                  </h3>

                  <div className="flex flex-col gap-2">

                    {categorias.map((c) => (

                      <div

                        key={c.id}

                        className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-slate-700 bg-slate-900/40"

                      >

                        <div className="flex items-start gap-2">

                          <Tag className="w-4 h-4 text-blue-400 mt-1" />

                          <div>

                            <p className="text-white font-medium">

                              {c.nome}

                            </p>

                            {c.descricao && (

                              <p className="text-xs text-slate-400">

                                {c.descricao}

                              </p>

                            )}

                            <p

                              className={`text-xs mt-1 ${

                                c.ativo

                                  ? "text-green-400"

                                  : "text-amber-400"

                              }`}

                            >

                              {c.ativo ? "Ativa" : "Inativa"}

                            </p>

                          </div>

                        </div>

                        <div className="flex gap-1">

                          <Button

                            type="button"

                            variant="ghost"

                            size="icon"

                            title="Editar categoria"

                            onClick={() => abrirEdicaoCategoria(c)}

                            className="text-blue-400 hover:bg-blue-900/30"

                          >

                            <Edit className="w-4 h-4" />

                          </Button>

                          {c.ativo && (

                            <Button

                              type="button"

                              variant="ghost"

                              size="icon"

                              title="Desativar categoria"

                              onClick={() => desativarCategoria(c)}

                              className="text-red-400 hover:bg-red-900/30"

                            >

                              <Trash2 className="w-4 h-4" />

                            </Button>

                          )}

                        </div>

                      </div>

                    ))}

                    {categorias.length === 0 && (

                      <p className="text-slate-400 text-sm text-center py-4">

                        Nenhuma categoria cadastrada.

                      </p>

                    )}

                  </div>

                </div>

              </div>

            </div>

          )}

        </div>

      </div>

    </div>

  );

}
