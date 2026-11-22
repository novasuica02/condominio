
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
} from "lucide-react";

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

export function ClassificadosLista({
  condominioId,
  usuarioId,
  role,
}: Props) {
  const [anuncios, setAnuncios] = useState<Classificado[]>([]);
  const [fotos, setFotos] = useState<Record<number, string>>({});
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregarAnuncios = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("classificados")
        .select(`
          id,
          categoria,
          tipo_anuncio,
          titulo,
          descricao,
          valor,
          contato_nome,
          contato_telefone,
          validade_ate,
          created_at,
          classificados_fotos (
            id,
            arquivo_path,
            ordem
          )
        `)
        .eq("condominio_id", condominioId)
        .eq("status", "ativo")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const lista = (data ?? []) as Classificado[];
      setAnuncios(lista);

      const arquivos = lista.flatMap((anuncio) =>
        (anuncio.classificados_fotos ?? []).map((foto) => ({
          anuncioId: anuncio.id,
          path: foto.arquivo_path,
          ordem: foto.ordem,
        }))
      );

      const fotosAssinadas: Record<number, string> = {};

      await Promise.all(
        lista.map(async (anuncio) => {
          const foto = arquivos
            .filter((item) => item.anuncioId === anuncio.id)
            .sort((a, b) => a.ordem - b.ordem)[0];

          if (!foto) return;

          const { data: imagem, error: erroImagem } =
            await supabase.storage
              .from("midia-classificados")
              .createSignedUrl(foto.path, 3600);

          if (!erroImagem && imagem?.signedUrl) {
            fotosAssinadas[anuncio.id] = imagem.signedUrl;
          }
        })
      );

      setFotos(fotosAssinadas);
    } catch (error) {
      console.error("Erro ao carregar classificados:", error);
      setErro("Não foi possível carregar os classificados. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, [condominioId]);

  useEffect(() => {
    carregarAnuncios();
  }, [carregarAnuncios]);

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

  return (
    <main className="flex-1 w-full text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:py-8">

        {/* Título e botão de novo anúncio */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-xl font-bold sm:gap-3 sm:text-2xl">
              <ShoppingBag className="h-6 w-6 shrink-0 text-blue-400 sm:h-7 sm:w-7" />
              Classificados
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              Compre, venda, procure serviços e compartilhe oportunidades
              com os moradores.
            </p>
          </div>

          <Link
            href="/classificados/novo"
            className="flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 sm:w-auto"
          >
            <Plus size={18} />
            Novo anúncio
          </Link>
        </div>

        {/* Busca e categorias */}
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

          <div className="flex flex-wrap gap-2">
            {categorias.map((item) => (
              <button
                key={item.valor}
                onClick={() => setCategoria(item.valor)}
                className={`rounded-full px-3 py-2 text-xs transition sm:px-4 sm:text-sm ${
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

        {/* Quantidade e atualização */}
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

        {/* Conteúdo */}
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
      </div>
    </main>
  );
}
