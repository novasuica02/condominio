
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  Plus,
  ShoppingBag,
  Tag,
  RefreshCw,
  Image as ImageIcon,
  AlertTriangle,
  Calendar,
  ClipboardList,
  ArrowLeft,
} from "lucide-react";

type StatusClassificado =
  | "pendente"
  | "ativo"
  | "rejeitado"
  | "encerrado"
  | "expirado";

type Classificado = {
  id: number;
  categoria: string;
  tipo_anuncio: string;
  titulo: string;
  descricao: string;
  valor: number | null;
  contato_nome: string | null;
  contato_telefone: string | null;
  validade_ate: string | null;
  exclusao_programada_em: string | null;
  exclusao_em_processamento: boolean;
  status: StatusClassificado;
  motivo_rejeicao: string | null;
  created_at: string;
  classificados_fotos: {
    id: number;
    arquivo_path: string;
    ordem: number;
  }[];
};

type Props = {
  condominioId: number;
  usuarioId: string;
  role: string;
};

const categorias = [
  { valor: "todos", nome: "Todos" },
  { valor: "venda", nome: "Venda" },
  { valor: "compra", nome: "Compra/Procura" },
  { valor: "servicos", nome: "Serviços" },
  { valor: "imoveis", nome: "Imóveis" },
  { valor: "doacoes", nome: "Doações" },
  { valor: "outros", nome: "Outros" },
];

const camposClassificado = `
  id,
  categoria,
  tipo_anuncio,
  titulo,
  descricao,
  valor,
  contato_nome,
  contato_telefone,
  validade_ate,
  exclusao_programada_em,
  exclusao_em_processamento,
  status,
  motivo_rejeicao,
  created_at,
  classificados_fotos (
    id,
    arquivo_path,
    ordem
  )
`;

export function ClassificadosLista({
  condominioId,
  usuarioId,
}: Props) {
  const [anuncios, setAnuncios] = useState<Classificado[]>([]);
  const [meusAnuncios, setMeusAnuncios] = useState<Classificado[]>([]);
  const [fotos, setFotos] = useState<Record<number, string>>({});

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todos");

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [erroMeusAnuncios, setErroMeusAnuncios] = useState("");

  const [mostrarMeusAnuncios, setMostrarMeusAnuncios] = useState(false);

  const [renovandoId, setRenovandoId] = useState<number | null>(null);
  const [mensagemRenovacao, setMensagemRenovacao] = useState("");
  const [erroRenovacao, setErroRenovacao] = useState("");

  const carregarAnuncios = useCallback(async () => {
    setCarregando(true);
    setErro("");
    setErroMeusAnuncios("");

    try {
      const supabase = createClient();

      // Lista pública: somente anúncios ativos do condomínio.
      const {
        data: dadosPublicos,
        error: erroPublico,
      } = await supabase
        .from("classificados")
        .select(camposClassificado)
        .eq("condominio_id", condominioId)
        .eq("status", "ativo")
        .order("created_at", { ascending: false });

      if (erroPublico) {
        throw erroPublico;
      }

      const listaPublica = (dadosPublicos ?? []) as unknown as Classificado[];

      // Meus anúncios: todos os status pertencentes ao morador logado.
      const {
        data: dadosMeus,
        error: erroMeus,
      } = await supabase
        .from("classificados")
        .select(camposClassificado)
        .eq("condominio_id", condominioId)
        .eq("morador_id", usuarioId)
        .order("created_at", { ascending: false });

      let listaMeus: Classificado[] = [];

      if (erroMeus) {
        console.error("Erro ao carregar meus anúncios:", erroMeus);

        setErroMeusAnuncios(
          "Não foi possível consultar seus anúncios. Verifique as permissões de acesso."
        );
      } else {
        listaMeus = (dadosMeus ?? []) as unknown as Classificado[];
      }

      setAnuncios(listaPublica);
      setMeusAnuncios(listaMeus);

      // Junta as duas listas para carregar as fotos sem repetir anúncios.
      const todosAnuncios = Array.from(
        new Map(
          [...listaPublica, ...listaMeus].map((anuncio) => [
            anuncio.id,
            anuncio,
          ])
        ).values()
      );

      const fotosAssinadas: Record<number, string> = {};

      await Promise.all(
        todosAnuncios.map(async (anuncio) => {
          const primeiraFoto = [...(anuncio.classificados_fotos ?? [])]
            .sort((a, b) => a.ordem - b.ordem)[0];

          if (!primeiraFoto) return;

          const { data: imagem, error: erroImagem } =
            await supabase.storage
              .from("midia-classificados")
              .createSignedUrl(primeiraFoto.arquivo_path, 3600);

          if (!erroImagem && imagem?.signedUrl) {
            fotosAssinadas[anuncio.id] = imagem.signedUrl;
          }
        })
      );

      setFotos(fotosAssinadas);
    } catch (error) {
      console.error("Erro ao carregar classificados:", error);

      setErro(
        "Não foi possível carregar os classificados. Tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  }, [condominioId, usuarioId]);

  useEffect(() => {
    carregarAnuncios();
  }, [carregarAnuncios]);

  // Renovação do anúncio expirado.
  async function renovarAnuncio(anuncioId: number) {
    setRenovandoId(anuncioId);
    setMensagemRenovacao("");
    setErroRenovacao("");

    try {
      const supabase = createClient();

      const { data, error } = await supabase.rpc(
        "renovar_classificado",
        {
          p_classificado_id: anuncioId,
        }
      );

      if (error) {
        throw error;
      }

      if (data === false) {
        throw new Error("A renovação não foi realizada.");
      }

      await carregarAnuncios();

      setMensagemRenovacao(
        "Solicitação de renovação realizada com sucesso!"
      );
    } catch (error) {
      console.error("Erro ao renovar anúncio:", error);

      setErroRenovacao(
        error instanceof Error
          ? error.message
          : "Não foi possível renovar o anúncio. Tente novamente."
      );
    } finally {
      setRenovandoId(null);
    }
  }

  const anunciosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return anuncios.filter((anuncio) => {
      const correspondeCategoria =
        categoria === "todos" || anuncio.categoria === categoria;

      const correspondeBusca =
        !termo ||
        anuncio.titulo.toLowerCase().includes(termo) ||
        anuncio.descricao.toLowerCase().includes(termo);

      return correspondeCategoria && correspondeBusca;
    });
  }, [anuncios, busca, categoria]);

  function formatarValor(valor: number | null) {
    if (valor === null) return "A combinar";

    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarCategoria(valor: string) {
    return categorias.find((item) => item.valor === valor)?.nome ?? valor;
  }

  function formatarData(valor: string | null) {
    if (!valor) return "Não definida";

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return "Não definida";
    }

    return data.toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });
  }

  function formatarStatus(status: StatusClassificado) {
    const statusMap: Record<
      StatusClassificado,
      { nome: string; classe: string }
    > = {
      ativo: {
        nome: "Ativo",
        classe: "bg-green-950 text-green-300 border-green-800",
      },
      pendente: {
        nome: "Aguardando aprovação",
        classe: "bg-yellow-950 text-yellow-300 border-yellow-800",
      },
      rejeitado: {
        nome: "Rejeitado",
        classe: "bg-red-950 text-red-300 border-red-800",
      },
      encerrado: {
        nome: "Encerrado",
        classe: "bg-slate-700 text-slate-300 border-slate-600",
      },
      expirado: {
        nome: "Expirado",
        classe: "bg-orange-950 text-orange-300 border-orange-800",
      },
    };

    return statusMap[status];
  }

  return (
    <main className="flex-1 w-full text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:py-8">

        {/* CABEÇALHO */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-xl font-bold sm:gap-3 sm:text-2xl">
              {mostrarMeusAnuncios ? (
                <ClipboardList className="h-6 w-6 shrink-0 text-blue-400 sm:h-7 sm:w-7" />
              ) : (
                <ShoppingBag className="h-6 w-6 shrink-0 text-blue-400 sm:h-7 sm:w-7" />
              )}

              {mostrarMeusAnuncios ? "Meus anúncios" : "Classificados"}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              {mostrarMeusAnuncios
                ? "Acompanhe suas publicações e gerencie seus anúncios."
                : "Compre, venda, procure serviços e compartilhe oportunidades com os moradores."}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {mostrarMeusAnuncios ? (
              <button
                type="button"
                onClick={() => {
                  setMostrarMeusAnuncios(false);
                  setMensagemRenovacao("");
                  setErroRenovacao("");
                }}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                <ArrowLeft size={18} />
                Voltar aos Classificados
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMostrarMeusAnuncios(true);
                  setMensagemRenovacao("");
                  setErroRenovacao("");
                }}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                <ClipboardList size={18} />
                Meus anúncios

                {meusAnuncios.length > 0 && (
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs">
                    {meusAnuncios.length}
                  </span>
                )}
              </button>
            )}

            <Link
              href="/classificados/novo"
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              <Plus size={18} />
              Novo anúncio
            </Link>
          </div>
        </div>

        {/* ÁREA MEUS ANÚNCIOS */}
        {mostrarMeusAnuncios ? (
          <section className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4 sm:p-5">

            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-white sm:text-xl">
                  Gerenciar minhas publicações
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Consulte o estado dos seus anúncios e renove os que expiraram.
                </p>
              </div>

              <button
                onClick={carregarAnuncios}
                disabled={carregando}
                className="flex items-center gap-2 self-start text-xs text-slate-400 hover:text-white disabled:opacity-50 sm:text-sm"
              >
                <RefreshCw
                  size={16}
                  className={carregando ? "animate-spin" : ""}
                />
                Atualizar
              </button>
            </div>

            {mensagemRenovacao && (
              <div className="mb-4 rounded-lg border border-green-700 bg-green-950/40 p-3 text-sm text-green-300">
                {mensagemRenovacao}
              </div>
            )}

            {erroRenovacao && (
              <div className="mb-4 rounded-lg border border-red-700 bg-red-950/40 p-3 text-sm text-red-300">
                {erroRenovacao}
              </div>
            )}

            {erroMeusAnuncios ? (
              <div className="rounded-lg border border-red-800 bg-red-950/30 p-4 text-sm text-red-300">
                {erroMeusAnuncios}
              </div>
            ) : carregando ? (
              <div className="py-12 text-center text-sm text-slate-400">
                Carregando seus anúncios...
              </div>
            ) : meusAnuncios.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900/40 p-6 text-center">
                <Tag className="mx-auto mb-3 h-9 w-9 text-slate-500" />

                <p className="font-medium text-slate-300">
                  Você ainda não possui anúncios.
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Seus anúncios aparecerão aqui depois da publicação.
                </p>

                <Link
                  href="/classificados/novo"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold hover:bg-blue-500"
                >
                  <Plus size={17} />
                  Criar anúncio
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {meusAnuncios.map((anuncio) => {
                  const statusInfo = formatarStatus(anuncio.status);

                  // ANÚNCIO EXPIRADO: DESTAQUE E RENOVAÇÃO.
                  if (anuncio.status === "expirado") {
                    return (
                      <article
                        key={anuncio.id}
                        className="overflow-hidden rounded-xl border-2 border-amber-500/70 bg-amber-950/30 shadow-lg shadow-black/10"
                      >
                        <div className="flex items-center gap-2 border-b border-amber-700/50 bg-amber-900/30 px-4 py-3 sm:px-5">
                          <AlertTriangle className="h-6 w-6 shrink-0 text-amber-400" />

                          <h3 className="text-sm font-extrabold tracking-wide text-amber-300 sm:text-base">
                            ATENÇÃO — ANÚNCIO EXPIRADO
                          </h3>
                        </div>

                        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                          {fotos[anuncio.id] && (
                            <img
                              src={fotos[anuncio.id]}
                              alt={anuncio.titulo}
                              className="h-28 w-full shrink-0 rounded-lg object-cover sm:h-28 sm:w-32"
                            />
                          )}

                          <div className="min-w-0 flex-1">
                            <h4 className="break-words text-lg font-bold text-white sm:text-xl">
                              {anuncio.titulo}
                            </h4>

                            <p className="mt-2 text-sm leading-relaxed text-amber-100/80">
                              Seu anúncio expirou e não está mais visível para os demais moradores.
                            </p>

                            <p className="mt-2 text-sm text-amber-200">
                              {formatarCategoria(anuncio.categoria)}
                            </p>
                          </div>

                          <div className="w-full shrink-0 border-t border-amber-700/40 pt-4 sm:w-64 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                            <div className="mb-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                                Será excluído em
                              </p>

                              <p className="mt-1 flex items-center gap-2 text-xl font-extrabold text-amber-300">
                                <Calendar size={19} />
                                {formatarData(anuncio.exclusao_programada_em)}
                              </p>

                              <p className="mt-1 text-xs text-amber-100/70">
                                Renove antes dessa data para manter seu anúncio.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => renovarAnuncio(anuncio.id)}
                              disabled={
                                renovandoId === anuncio.id ||
                                anuncio.exclusao_em_processamento
                              }
                              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
                            >
                              <RefreshCw
                                size={19}
                                className={
                                  renovandoId === anuncio.id
                                    ? "animate-spin"
                                    : ""
                                }
                              />

                              {anuncio.exclusao_em_processamento
                                ? "Exclusão em processamento"
                                : renovandoId === anuncio.id
                                  ? "RENOVANDO..."
                                  : "RENOVAR ANÚNCIO"}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  }

                  // DEMAIS ANÚNCIOS DO MORADOR.
                  return (
                    <article
                      key={anuncio.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900/50 p-4 sm:flex-row sm:items-center"
                    >
                      {fotos[anuncio.id] ? (
                        <img
                          src={fotos[anuncio.id]}
                          alt={anuncio.titulo}
                          className="h-24 w-full shrink-0 rounded-lg object-cover sm:h-20 sm:w-24"
                        />
                      ) : (
                        <div className="flex h-20 w-full shrink-0 items-center justify-center rounded-lg bg-slate-700 text-slate-500 sm:w-24">
                          <ImageIcon size={28} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusInfo.classe}`}
                          >
                            {statusInfo.nome}
                          </span>

                          <span className="text-xs text-slate-400">
                            {formatarCategoria(anuncio.categoria)}
                          </span>
                        </div>

                        <h3 className="break-words font-semibold text-white">
                          {anuncio.titulo}
                        </h3>

                        {anuncio.status === "ativo" && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                            <Calendar size={13} />
                            Válido até: {formatarData(anuncio.validade_ate)}
                          </p>
                        )}

                        {anuncio.status === "pendente" && (
                          <p className="mt-1 text-xs text-yellow-300">
                            Seu anúncio está aguardando aprovação.
                          </p>
                        )}

                        {anuncio.status === "rejeitado" &&
                          anuncio.motivo_rejeicao && (
                            <p className="mt-2 break-words text-xs text-red-300">
                              Motivo: {anuncio.motivo_rejeicao}
                            </p>
                          )}

                        {anuncio.status === "encerrado" && (
                          <p className="mt-1 text-xs text-slate-400">
                            Este anúncio foi encerrado.
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-base font-bold text-green-400">
                          {formatarValor(anuncio.valor)}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {anuncio.tipo_anuncio === "procura"
                            ? "Procurando"
                            : "Oferecendo"}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* BUSCA E CATEGORIAS */}
            <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-3 sm:p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="O que você está procurando?"
                  className="w-full min-w-0 rounded-lg border border-slate-600 bg-slate-700 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-400 focus:border-blue-500 sm:text-base"
                />
              </div>

              <div className="flex w-full flex-nowrap gap-2 overflow-x-auto overflow-y-hidden pb-2">
                {categorias.map((item) => (
                  <button
                    key={item.valor}
                    onClick={() => setCategoria(item.valor)}
                    className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs transition sm:text-sm ${
                       categoria === item.valor
                        ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
                  >
                    {item.nome}
                  </button>
                ))}
              </div>
            </div>

            {/* QUANTIDADE E ATUALIZAÇÃO */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400 sm:text-sm">
                {anunciosFiltrados.length} anúncio(s) encontrado(s)
              </p>

              <button
                onClick={carregarAnuncios}
                disabled={carregando}
                className="flex shrink-0 items-center gap-2 text-xs text-slate-400 hover:text-white disabled:opacity-50 sm:text-sm"
              >
                <RefreshCw
                  size={16}
                  className={carregando ? "animate-spin" : ""}
                />
                Atualizar
              </button>
            </div>

            {/* LISTA PÚBLICA DE CLASSIFICADOS */}
            {carregando ? (
              <div className="py-16 text-center text-sm text-slate-400">
                Carregando classificados...
              </div>
            ) : erro ? (
              <div className="rounded-xl border border-red-800 bg-red-950/40 p-6 text-center text-sm text-red-300">
                {erro}

                <button
                  onClick={carregarAnuncios}
                  className="mt-3 block w-full text-sm underline"
                >
                  Tentar novamente
                </button>
              </div>
            ) : anunciosFiltrados.length === 0 ? (
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 text-center sm:p-10">
                <Tag className="mx-auto mb-4 h-12 w-12 text-slate-500" />

                <h2 className="text-lg font-semibold">
                  Nenhum anúncio encontrado
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Seja o primeiro a publicar um anúncio para os moradores!
                </p>

                <Link
                  href="/classificados/novo"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
                >
                  <Plus size={18} />
                  Criar anúncio
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {anunciosFiltrados.map((anuncio) => (
                  <article
                    key={anuncio.id}
                    className="min-w-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 transition hover:border-slate-500"
                  >
                    <div className="relative flex h-44 items-center justify-center bg-slate-700 sm:h-48">
                      {fotos[anuncio.id] ? (
                        <img
                          src={fotos[anuncio.id]}
                          alt={anuncio.titulo}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-500">
                          <ImageIcon size={38} />
                          <span className="text-xs">Sem foto</span>
                        </div>
                      )}

                      <span className="absolute left-3 top-3 max-w-[90%] truncate rounded-full bg-slate-950/80 px-3 py-1 text-xs font-medium text-white">
                        {formatarCategoria(anuncio.categoria)}
                      </span>
                    </div>

                    <div className="p-4">
                      <p className="mb-2 text-xs uppercase tracking-wide text-blue-400">
                        {anuncio.tipo_anuncio === "procura"
                          ? "Procurando"
                          : "Oferecendo"}
                      </p>

                      <h2 className="line-clamp-2 min-h-12 break-words font-semibold text-white">
                        {anuncio.titulo}
                      </h2>

                      <p className="mt-2 line-clamp-3 min-h-[60px] break-words text-sm text-slate-400">
                        {anuncio.descricao}
                      </p>

                      <div className="mt-4 border-t border-slate-700 pt-3">
                        <p className="text-lg font-bold text-green-400">
                          {formatarValor(anuncio.valor)}
                        </p>

                        {anuncio.contato_nome && (
                          <p className="mt-2 break-words text-xs text-slate-400">
                            Contato: {anuncio.contato_nome}
                          </p>
                        )}

                        {anuncio.contato_telefone && (
                          <p className="mt-1 break-words text-xs text-slate-400">
                            Telefone: {anuncio.contato_telefone}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
