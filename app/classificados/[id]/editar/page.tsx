
"use client";

import {
  Suspense,
  useEffect,
  useState,
  ChangeEvent,
  FormEvent,
} from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  ImagePlus,
  X,
  Loader2,
  Save,
  Image as ImageIcon,
  AlertTriangle,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

type FotoExistente = {
  id: number;
  arquivo_path: string;
  ordem: number;
  url: string;
};

type FotoNova = {
  id: string;
  arquivo: File;
  url: string;
};

type Anuncio = {
  id: number;
  condominio_id: number;
  morador_id: string;
  categoria: string;
  tipo_anuncio: string;
  titulo: string;
  descricao: string;
  valor: number | null;
  contato_nome: string | null;
  contato_telefone: string | null;
  status: string;
  exclusao_em_processamento: boolean;
  classificados_fotos: {
    id: number;
    arquivo_path: string;
    ordem: number;
  }[];
};

const categorias = [
  { valor: "venda", nome: "Venda" },
  { valor: "compra", nome: "Compra / Procura" },
  { valor: "servicos", nome: "Serviços" },
  { valor: "imoveis", nome: "Imóveis" },
  { valor: "doacoes", nome: "Doações" },
  { valor: "outros", nome: "Outros" },
];

export default function EditarClassificadoPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
          <Loader2 className="mr-3 animate-spin" />
          Carregando página...
        </main>
      }
    >
      <EditarClassificadoConteudo />
    </Suspense>
  );
}

function EditarClassificadoConteudo() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const anuncioId = Number(params.id);

  const [usuarioId, setUsuarioId] = useState("");
  const [condominioId, setCondominioId] = useState<number | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const [categoria, setCategoria] = useState("venda");
  const [tipoAnuncio, setTipoAnuncio] = useState("oferta");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [contatoNome, setContatoNome] = useState("");
  const [contatoTelefone, setContatoTelefone] = useState("");

  const [fotosExistentes, setFotosExistentes] = useState<FotoExistente[]>([]);
  const [novasFotos, setNovasFotos] = useState<FotoNova[]>([]);
  const [ordemFotos, setOrdemFotos] = useState<string[]>([]);
  const [fotoArrastada, setFotoArrastada] = useState<string | null>(null);

  const [emProcessamento, setEmProcessamento] = useState(false);

  useEffect(() => {
    async function carregarAnuncio() {
      if (!Number.isSafeInteger(anuncioId) || anuncioId <= 0) {
        setErro("Anúncio inválido.");
        setCarregando(false);
        return;
      }

      const supabase = createClient();

      try {
        const {
          data: { user },
          error: erroUsuario,
        } = await supabase.auth.getUser();

        if (erroUsuario || !user) {
          router.replace("/auth/login");
          return;
        }

        setUsuarioId(user.id);

        const { data, error: erroAnuncio } = await supabase
          .from("classificados")
          .select(`
            id,
            condominio_id,
            morador_id,
            categoria,
            tipo_anuncio,
            titulo,
            descricao,
            valor,
            contato_nome,
            contato_telefone,
            status,
            exclusao_em_processamento,
            classificados_fotos (
              id,
              arquivo_path,
              ordem
            )
          `)
          .eq("id", anuncioId)
          .eq("morador_id", user.id)
          .single();

        if (erroAnuncio || !data) {
          throw new Error(
            "Não foi possível localizar seu anúncio. Verifique se ele ainda está disponível."
          );
        }

        const anuncio = data as unknown as Anuncio;

        setCondominioId(anuncio.condominio_id);
        setCategoria(anuncio.categoria);
        setTipoAnuncio(anuncio.tipo_anuncio);
        setTitulo(anuncio.titulo);
        setDescricao(anuncio.descricao);
        setValor(anuncio.valor !== null ? String(anuncio.valor) : "");
        setContatoNome(anuncio.contato_nome || "");
        setContatoTelefone(anuncio.contato_telefone || "");
        setEmProcessamento(anuncio.exclusao_em_processamento);

        const fotosOrdenadas = [...(anuncio.classificados_fotos || [])]
          .sort((a, b) => a.ordem - b.ordem);

        const fotosCarregadas: FotoExistente[] = [];

        for (const foto of fotosOrdenadas) {
          const { data: imagem, error: erroImagem } = await supabase.storage
            .from("midia-classificados")
            .createSignedUrl(foto.arquivo_path, 3600);

          fotosCarregadas.push({
            ...foto,
            url:
              !erroImagem && imagem?.signedUrl
                ? imagem.signedUrl
                : "",
          });
        }

        setFotosExistentes(fotosCarregadas);
        setOrdemFotos(
          fotosCarregadas.map((foto) => `existente:${foto.id}`)
        );
      } catch (error) {
        console.error("Erro ao carregar anúncio:", error);

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o anúncio."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarAnuncio();
  }, [anuncioId, router]);

  const fotosParaExibir = ordemFotos
    .map((chave) => {
      if (chave.startsWith("existente:")) {
        const id = Number(chave.replace("existente:", ""));
        const foto = fotosExistentes.find((item) => item.id === id);

        return foto
          ? {
              chave,
              tipo: "existente" as const,
              url: foto.url,
              nome: "Foto do anúncio",
            }
          : null;
      }

      const foto = novasFotos.find(
        (item) => `nova:${item.id}` === chave
      );

      return foto
        ? {
            chave,
            tipo: "nova" as const,
            url: foto.url,
            nome: foto.arquivo.name,
          }
        : null;
    })
    .filter((foto): foto is NonNullable<typeof foto> => foto !== null);

  function selecionarFotos(e: ChangeEvent<HTMLInputElement>) {
    const selecionadas = Array.from(e.target.files || []);

    const totalAtual = fotosExistentes.length + novasFotos.length;

    if (totalAtual + selecionadas.length > 5) {
      setErro("O anúncio pode ter no máximo 5 fotos.");
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

    const adicionadas: FotoNova[] = selecionadas.map((arquivo) => ({
      id: crypto.randomUUID(),
      arquivo,
      url: URL.createObjectURL(arquivo),
    }));

    setErro("");
    setNovasFotos((anteriores) => [...anteriores, ...adicionadas]);
    setOrdemFotos((anteriores) => [
      ...anteriores,
      ...adicionadas.map((foto) => `nova:${foto.id}`),
    ]);

    e.target.value = "";
  }

  function removerFoto(chave: string) {
    if (chave.startsWith("existente:")) {
      const id = Number(chave.replace("existente:", ""));

      setFotosExistentes((anteriores) =>
        anteriores.filter((foto) => foto.id !== id)
      );
    } else {
      const id = chave.replace("nova:", "");
      const foto = novasFotos.find((item) => item.id === id);

      if (foto) URL.revokeObjectURL(foto.url);

      setNovasFotos((anteriores) =>
        anteriores.filter((item) => item.id !== id)
      );
    }

    setOrdemFotos((anteriores) =>
      anteriores.filter((item) => item !== chave)
    );
  }

  function moverFoto(indice: number, direcao: -1 | 1) {
    const novoIndice = indice + direcao;

    if (novoIndice < 0 || novoIndice >= ordemFotos.length) return;

    setOrdemFotos((anteriores) => {
      const novaOrdem = [...anteriores];

      [novaOrdem[indice], novaOrdem[novoIndice]] = [
        novaOrdem[novoIndice],
        novaOrdem[indice],
      ];

      return novaOrdem;
    });
  }

  function soltarFoto(destino: string) {
    if (!fotoArrastada || fotoArrastada === destino) {
      setFotoArrastada(null);
      return;
    }

    setOrdemFotos((anteriores) => {
      const novaOrdem = [...anteriores];
      const origemIndice = novaOrdem.indexOf(fotoArrastada);
      const destinoIndice = novaOrdem.indexOf(destino);

      if (origemIndice === -1 || destinoIndice === -1) {
        return anteriores;
      }

      novaOrdem.splice(origemIndice, 1);
      novaOrdem.splice(destinoIndice, 0, fotoArrastada);

      return novaOrdem;
    });

    setFotoArrastada(null);
  }

  async function salvarAlteracoes(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setErro("");
    setAviso("");

    if (!usuarioId || condominioId === null) {
      setErro("Não foi possível identificar seu perfil.");
      return;
    }

    if (emProcessamento) {
      setErro(
        "Este anúncio está em processo de exclusão e não pode ser editado."
      );
      return;
    }

    if (!titulo.trim() || !descricao.trim()) {
      setErro("Preencha o título e a descrição do anúncio.");
      return;
    }

    if (
      valor.trim() &&
      (!Number.isFinite(Number(valor)) || Number(valor) < 0)
    ) {
      setErro("Informe um valor válido.");
      return;
    }

    if (fotosExistentes.length + novasFotos.length > 5) {
      setErro("O anúncio pode ter no máximo 5 fotos.");
      return;
    }

    setSalvando(true);

    const supabase = createClient();

    const caminhosEnviados: string[] = [];
    const idsNovasFotos: number[] = [];
    const idsNovasPorChave = new Map<string, number>();

    let anuncioAtualizado = false;
    let avisoFinal = "";

    try {
      // 1. Envia as novas fotos e registra cada uma no banco.
      for (const foto of novasFotos) {
        const arquivo = foto.arquivo;

        const nomeSeguro = arquivo.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9._-]/g, "-");

        const caminho = `${condominioId}/${anuncioId}/${crypto.randomUUID()}-${nomeSeguro}`;

        const { error: erroUpload } = await supabase.storage
          .from("midia-classificados")
          .upload(caminho, arquivo, {
            contentType: arquivo.type,
            upsert: false,
          });

        if (erroUpload) throw erroUpload;

        caminhosEnviados.push(caminho);

        const { data: fotoInserida, error: erroInsercao } = await supabase
          .from("classificados_fotos")
          .insert({
            condominio_id: condominioId,
            classificado_id: anuncioId,
            arquivo_path: caminho,
            ordem: 0,
          })
          .select("id")
          .single();

        if (erroInsercao || !fotoInserida) {
          throw erroInsercao || new Error("Não foi possível registrar a foto.");
        }

        idsNovasFotos.push(fotoInserida.id);
        idsNovasPorChave.set(`nova:${foto.id}`, fotoInserida.id);
      }

      // 2. Atualiza somente os campos editáveis do anúncio.
      // Não altera status, validade ou histórico de renovação.
      const { error: erroAtualizacao } = await supabase
        .from("classificados")
        .update({
          categoria,
          tipo_anuncio: tipoAnuncio,
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          valor: valor.trim() ? Number(valor) : null,
          contato_nome: contatoNome.trim() || null,
          contato_telefone: contatoTelefone.trim() || null,
        })
        .eq("id", anuncioId)
        .eq("morador_id", usuarioId);

      if (erroAtualizacao) throw erroAtualizacao;

      anuncioAtualizado = true;

      // 3. Salva a ordem de todas as fotos.
      for (let indice = 0; indice < ordemFotos.length; indice++) {
        const chave = ordemFotos[indice];

        const idFoto = chave.startsWith("existente:")
          ? Number(chave.replace("existente:", ""))
          : idsNovasPorChave.get(chave);

        if (!idFoto) {
          throw new Error("Não foi possível identificar uma das fotos.");
        }

        const { error: erroOrdem } = await supabase
          .from("classificados_fotos")
          .update({ ordem: indice })
          .eq("id", idFoto)
          .eq("classificado_id", anuncioId)
          .eq("condominio_id", condominioId);

        if (erroOrdem) throw erroOrdem;
      }

      // 4. Identifica e remove os registros das fotos excluídas.
      const { data: fotosAtuais, error: erroConsultaFotos } = await supabase
        .from("classificados_fotos")
        .select("id, arquivo_path")
        .eq("classificado_id", anuncioId)
        .eq("condominio_id", condominioId);

      if (erroConsultaFotos) {
        console.error(
          "Erro ao consultar fotos para remoção:",
          erroConsultaFotos
        );

        avisoFinal =
          "Os dados foram salvos, mas não foi possível concluir a remoção de algumas fotos antigas.";
      } else {
        const idsMantidos = [
          ...fotosExistentes.map((foto) => foto.id),
          ...idsNovasFotos,
        ];

        const fotosRemovidas = (fotosAtuais || []).filter(
          (foto) => !idsMantidos.includes(foto.id)
        );

        if (fotosRemovidas.length > 0) {
          const { error: erroExclusaoRegistros } = await supabase
            .from("classificados_fotos")
            .delete()
            .in(
              "id",
              fotosRemovidas.map((foto) => foto.id)
            )
            .eq("classificado_id", anuncioId);

          if (erroExclusaoRegistros) {
            console.error(
              "Erro ao remover registros das fotos:",
              erroExclusaoRegistros
            );

            avisoFinal =
              "Os dados foram salvos, mas algumas fotos antigas não puderam ser removidas.";
          } else {
            const caminhosRemovidos = fotosRemovidas.map(
              (foto) => foto.arquivo_path
            );

            if (caminhosRemovidos.length > 0) {
              const { error: erroStorage } = await supabase.storage
                .from("midia-classificados")
                .remove(caminhosRemovidos);

              if (erroStorage) {
                console.error(
                  "Erro ao remover arquivos antigos:",
                  erroStorage
                );

                avisoFinal =
                  "Os dados foram salvos, mas alguns arquivos antigos permaneceram no armazenamento.";
              }
            }
          }
        }
      }

      if (avisoFinal) {
        alert(
          `Anúncio atualizado com sucesso!\n\nAtenção: ${avisoFinal}`
        );
      } else {
        alert("Anúncio atualizado com sucesso!");
      }

      router.push("/classificados");
      router.refresh();
    } catch (error) {
      console.error("Erro ao salvar anúncio:", error);

      // Se a atualização principal falhou, tenta limpar as novas fotos.
      if (!anuncioAtualizado) {
        if (idsNovasFotos.length > 0) {
          await supabase
            .from("classificados_fotos")
            .delete()
            .in("id", idsNovasFotos);
        }

        if (caminhosEnviados.length > 0) {
          await supabase.storage
            .from("midia-classificados")
            .remove(caminhosEnviados);
        }
      }

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar as alterações. Tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <Loader2 className="mr-3 animate-spin" />
        Carregando anúncio...
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
          <h1 className="text-2xl font-bold">Editar anúncio</h1>

          <p className="mt-2 text-sm text-slate-400">
            Atualize as informações e as fotos da sua publicação.
          </p>
        </div>

        {erro && (
          <div className="mb-5 rounded-lg border border-red-700 bg-red-950/40 p-4 text-sm text-red-300">
            {erro}
          </div>
        )}

        {aviso && (
          <div className="mb-5 rounded-lg border border-amber-700 bg-amber-950/40 p-4 text-sm text-amber-300">
            {aviso}
          </div>
        )}

        {emProcessamento ? (
          <div className="rounded-xl border border-amber-700 bg-amber-950/30 p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-7 w-7 shrink-0 text-amber-400" />

              <div>
                <h2 className="font-semibold text-amber-300">
                  Anúncio em processo de exclusão
                </h2>

                <p className="mt-1 text-sm text-amber-100/80">
                  Este anúncio não pode mais ser editado.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={salvarAlteracoes}
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
                className="w-full resize-y rounded-lg border border-slate-600 bg-slate-700 p-3 text-white outline-none focus:border-blue-500"
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
                Fotos do anúncio
              </label>

              <p className="mb-3 text-xs text-slate-400">
                Arraste as fotos para mudar a ordem ou use as setas.
                A primeira foto será a principal do anúncio.
              </p>

              {fotosParaExibir.length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {fotosParaExibir.map((foto, indice) => (
                    <div
                      key={foto.chave}
                      draggable
                      onDragStart={() => setFotoArrastada(foto.chave)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => soltarFoto(foto.chave)}
                      onDragEnd={() => setFotoArrastada(null)}
                      className={`relative overflow-hidden rounded-lg border bg-slate-700 transition ${
                        fotoArrastada === foto.chave
                          ? "border-blue-400 opacity-40"
                          : "border-slate-600"
                      }`}
                    >
                      {foto.url ? (
                        <img
                          src={foto.url}
                          alt={foto.nome}
                          className="h-32 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-32 items-center justify-center">
                          <ImageIcon size={30} className="text-slate-400" />
                        </div>
                      )}

                      <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs text-white">
                        <GripVertical size={14} />
                        {indice + 1}
                      </div>

                      {indice === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-blue-600/90 px-2 py-1 text-center text-xs font-semibold text-white">
                          Foto principal
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => removerFoto(foto.chave)}
                        className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white shadow hover:bg-red-500"
                        aria-label="Remover foto"
                      >
                        <X size={16} />
                      </button>

                      <div className="absolute bottom-2 right-2 flex gap-1">
                        <button
                          type="button"
                          disabled={indice === 0}
                          onClick={() => moverFoto(indice, -1)}
                          className="rounded-md bg-black/70 p-1.5 text-white hover:bg-black disabled:opacity-30"
                          aria-label="Mover foto para a esquerda"
                        >
                          <ArrowUp size={16} />
                        </button>

                        <button
                          type="button"
                          disabled={indice === fotosParaExibir.length - 1}
                          onClick={() => moverFoto(indice, 1)}
                          className="rounded-md bg-black/70 p-1.5 text-white hover:bg-black disabled:opacity-30"
                          aria-label="Mover foto para a direita"
                        >
                          <ArrowDown size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {fotosExistentes.length + novasFotos.length < 5 && (
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
              )}

              <p className="mt-2 text-xs text-slate-500">
                JPG, PNG ou WEBP. Até 5 MB por foto.{" "}
                {fotosExistentes.length + novasFotos.length}/5 fotos.
              </p>
            </div>

            <div className="border-t border-slate-700 pt-5">
              <h2 className="mb-4 font-semibold">
                Informações de contato
              </h2>

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
              A edição não altera a situação nem o prazo de validade do anúncio.
              Se ele estiver expirado, continuará expirado até que seja renovado.
            </div>

            <button
              type="submit"
              disabled={salvando}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 p-4 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Salvando alterações...
                </>
              ) : (
                <>
                  <Save size={19} />
                  Salvar alterações
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
