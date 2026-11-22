
"use client";

import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  ImagePlus,
  X,
  Loader2,
  Send,
} from "lucide-react";

type Perfil = {
  id: string;
  nome: string | null;
  unidade_id: number | null;
  condominio_id: number;
  role: string;
  telefone: string | null;
  whatsapp: string | null;
};

const categorias = [
  { valor: "venda", nome: "Venda" },
  { valor: "compra", nome: "Compra / Procura" },
  { valor: "servicos", nome: "Serviços" },
  { valor: "imoveis", nome: "Imóveis" },
  { valor: "doacoes", nome: "Doações" },
  { valor: "outros", nome: "Outros" },
];

export default function NovoClassificadoPage() {
  const router = useRouter();

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [categoria, setCategoria] = useState("venda");
  const [tipoAnuncio, setTipoAnuncio] = useState("oferta");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [contatoNome, setContatoNome] = useState("");
  const [contatoTelefone, setContatoTelefone] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);

  useEffect(() => {
    async function verificarUsuario() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, nome, unidade_id, condominio_id, role, telefone, whatsapp"
        )
        .eq("id", user.id)
        .single();

      if (error || !data) {
        setErro("Não foi possível identificar seu perfil.");
        setCarregando(false);
        return;
      }

      if (data.role === "prestador") {
        router.replace("/chamados");
        return;
      }

      setPerfil(data as Perfil);
      setContatoNome(data.nome || "");
      setContatoTelefone(data.whatsapp || data.telefone || "");
      setCarregando(false);
    }

    verificarUsuario();
  }, [router]);

  function selecionarFotos(e: ChangeEvent<HTMLInputElement>) {
    const selecionadas = Array.from(e.target.files || []);

    if (selecionadas.length + arquivos.length > 5) {
      setErro("Você pode adicionar no máximo 5 fotos.");
      e.target.value = "";
      return;
    }

    const arquivoInvalido = selecionadas.find(
      (arquivo) =>
        !["image/jpeg", "image/png", "image/webp"].includes(arquivo.type) ||
        arquivo.size > 5 * 1024 * 1024
    );

    if (arquivoInvalido) {
      setErro(
        "As fotos devem ser JPG, PNG ou WEBP e ter no máximo 5 MB cada."
      );
      e.target.value = "";
      return;
    }

    setErro("");
    setArquivos((anteriores) => [...anteriores, ...selecionadas]);
    e.target.value = "";
  }

  function removerFoto(indice: number) {
    setArquivos((anteriores) =>
      anteriores.filter((_, i) => i !== indice)
    );
  }

  async function publicarAnuncio(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");

    if (!perfil) {
      setErro("Não foi possível identificar seu perfil.");
      return;
    }

    if (!perfil.unidade_id) {
      setErro(
        "Seu perfil não possui uma unidade vinculada. Entre em contato com a administração."
      );
      return;
    }

    if (!titulo.trim() || !descricao.trim()) {
      setErro("Preencha o título e a descrição do anúncio.");
      return;
    }

    if (valor.trim() && (!Number.isFinite(Number(valor)) || Number(valor) < 0)) {
      setErro("Informe um valor válido.");
      return;
    }

    setSalvando(true);

    const supabase = createClient();
    let classificadoId: number | null = null;
    const caminhosEnviados: string[] = [];

    try {
      const { data: anuncio, error: erroCadastro } = await supabase
        .from("classificados")
        .insert({
          condominio_id: perfil.condominio_id,
          unidade_id: perfil.unidade_id,
          morador_id: perfil.id,
          categoria,
          tipo_anuncio: tipoAnuncio,
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          valor: valor.trim() ? Number(valor) : null,
          contato_nome: contatoNome.trim() || null,
          contato_telefone: contatoTelefone.trim() || null,
        })
        .select("id")
        .single();

      if (erroCadastro) throw erroCadastro;

      classificadoId = anuncio.id;

      if (arquivos.length > 0) {
        const registrosFotos = [];

        for (let i = 0; i < arquivos.length; i++) {
          const arquivo = arquivos[i];

          const nomeSeguro = arquivo.name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9._-]/g, "-");

          const caminho = `${perfil.condominio_id}/${classificadoId}/${crypto.randomUUID()}-${nomeSeguro}`;

          const { error: erroUpload } = await supabase.storage
            .from("midia-classificados")
            .upload(caminho, arquivo, {
              contentType: arquivo.type,
              upsert: false,
            });

          if (erroUpload) throw erroUpload;

          caminhosEnviados.push(caminho);

          registrosFotos.push({
            condominio_id: perfil.condominio_id,
            classificado_id: classificadoId,
            arquivo_path: caminho,
            ordem: i,
          });
        }

        const { error: erroFotos } = await supabase
          .from("classificados_fotos")
          .insert(registrosFotos);

        if (erroFotos) throw erroFotos;
      }

      router.push("/classificados");
      router.refresh();
    } catch (error) {
      console.error("Erro ao publicar classificado:", error);

      if (caminhosEnviados.length > 0) {
        await supabase.storage
          .from("midia-classificados")
          .remove(caminhosEnviados);
      }

      if (classificadoId !== null) {
        await supabase
          .from("classificados")
          .delete()
          .eq("id", classificadoId);
      }

      setErro(
        "Não foi possível publicar o anúncio. Verifique os dados e tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <Loader2 className="mr-3 animate-spin" />
        Carregando formulário...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-6 text-white">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/classificados"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={18} />
          Voltar aos classificados
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Novo anúncio</h1>
          <p className="mt-2 text-sm text-slate-400">
            Compartilhe uma oportunidade com os moradores do condomínio.
          </p>
        </div>

        {erro && (
          <div className="mb-5 rounded-lg border border-red-700 bg-red-950/40 p-4 text-sm text-red-300">
            {erro}
          </div>
        )}

        <form
          onSubmit={publicarAnuncio}
          className="space-y-6 rounded-xl border border-slate-700 bg-slate-800 p-5 md:p-7"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              Categoria *
            </label>

            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-700 p-3 text-white outline-none focus:border-blue-500"
            >
              {categorias.map((item) => (
                <option key={item.valor} value={item.valor}>
                  {item.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Tipo de anúncio *
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipoAnuncio("oferta")}
                className={`rounded-lg border p-3 text-sm font-medium ${
                  tipoAnuncio === "oferta"
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-slate-600 bg-slate-700 text-slate-300"
                }`}
              >
                Estou oferecendo
              </button>

              <button
                type="button"
                onClick={() => setTipoAnuncio("procura")}
                className={`rounded-lg border p-3 text-sm font-medium ${
                  tipoAnuncio === "procura"
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-slate-600 bg-slate-700 text-slate-300"
                }`}
              >
                Estou procurando
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Título do anúncio *
            </label>

            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={100}
              required
              placeholder="Ex.: Vendo bicicleta em ótimo estado"
              className="w-full rounded-lg border border-slate-600 bg-slate-700 p-3 text-white outline-none placeholder:text-slate-400 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Descrição *
            </label>

            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={2000}
              required
              rows={5}
              placeholder="Descreva seu produto, serviço ou o que está procurando..."
              className="w-full resize-y rounded-lg border border-slate-600 bg-slate-700 p-3 text-white outline-none placeholder:text-slate-400 focus:border-blue-500"
            />

            <p className="mt-1 text-right text-xs text-slate-500">
              {descricao.length}/2000 caracteres
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Valor (R$)
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Deixe em branco se for a combinar"
              className="w-full rounded-lg border border-slate-600 bg-slate-700 p-3 text-white outline-none placeholder:text-slate-400 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Fotos (máximo 5)
            </label>

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-500 bg-slate-700/50 p-5 text-sm text-slate-300 transition hover:border-blue-500 hover:text-white">
              <ImagePlus size={22} />
              Adicionar fotos
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={selecionarFotos}
                className="hidden"
              />
            </label>

            <p className="mt-2 text-xs text-slate-500">
              JPG, PNG ou WEBP. Até 5 MB por foto.
            </p>

            {arquivos.length > 0 && (
              <div className="mt-3 space-y-2">
                {arquivos.map((arquivo, indice) => (
                  <div
                    key={`${arquivo.name}-${indice}`}
                    className="flex items-center justify-between rounded-lg bg-slate-700 px-3 py-2"
                  >
                    <span className="truncate pr-3 text-sm text-slate-300">
                      {arquivo.name}
                    </span>

                    <button
                      type="button"
                      onClick={() => removerFoto(indice)}
                      className="shrink-0 rounded p-1 text-red-400 hover:bg-slate-600"
                      aria-label="Remover foto"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-700 pt-5">
            <h2 className="mb-4 font-semibold">Informações de contato</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Nome para contato
                </label>

                <input
                  value={contatoNome}
                  onChange={(e) => setContatoNome(e.target.value)}
                  maxLength={100}
                  placeholder="Nome"
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 p-3 text-white outline-none placeholder:text-slate-400 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Telefone / WhatsApp
                </label>

                <input
                  value={contatoTelefone}
                  onChange={(e) => setContatoTelefone(e.target.value)}
                  maxLength={30}
                  placeholder="(00) 00000-0000"
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 p-3 text-white outline-none placeholder:text-slate-400 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-blue-900 bg-blue-950/30 p-4 text-sm text-blue-200">
            Seu anúncio seguirá a configuração de publicação definida pela
            administração do condomínio. Ele poderá ser publicado
            automaticamente ou aguardar aprovação.
          </div>

          <button
            type="submit"
            disabled={salvando || !perfil}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 p-4 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {salvando ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Publicando anúncio...
              </>
            ) : (
              <>
                <Send size={19} />
                Publicar anúncio
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
