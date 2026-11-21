
import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  PhoneCall,
  AlertCircle,
  Building2,
} from "lucide-react";

type TelefoneUtil = {
  id: number;
  nome: string;
  categoria: string;
  telefone: string;
  telefone_adicional_1: string | null;
  telefone_adicional_2: string | null;
  whatsapp: string | null;
  descricao: string | null;
  prioritario: boolean;
  ordem: number;
};

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

function linkWhatsApp(numero: string) {
  let telefone = somenteNumeros(numero);

  if (telefone.length <= 11) {
    telefone = `55${telefone}`;
  }

  return `https://wa.me/${telefone}`;
}

function linkTelefone(numero: string) {
  return `tel:${numero.replace(/[^\d+]/g, "")}`;
}

export default function TelefonesUteisPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-900 p-8 text-center text-white">
          Carregando telefones úteis...
        </main>
      }
    >
      <ConteudoTelefonesUteis />
    </Suspense>
  );
}

async function ConteudoTelefonesUteis() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("telefones_uteis")
    .select(
      "id, nome, categoria, telefone, telefone_adicional_1, telefone_adicional_2, whatsapp, descricao, prioritario, ordem"
    )
    .eq("ativo", true)
    .order("prioritario", { ascending: false })
    .order("ordem", { ascending: true })
    .order("nome", { ascending: true });

  const contatos = (data || []) as TelefoneUtil[];

  const categorias = Array.from(
    new Set(contatos.map((contato) => contato.categoria))
  );

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">

        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
          >
            <ArrowLeft size={18} />
            Voltar para o início
          </Link>

          <div className="mt-6 flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-3">
              <PhoneCall size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-bold md:text-3xl">
                Telefones Úteis
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Contatos importantes para moradores e visitantes.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            Não foi possível carregar os contatos neste momento.
          </div>
        )}

        {!error && contatos.length === 0 && (
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-8 text-center">
            <Phone size={36} className="mx-auto mb-4 text-slate-400" />
            <h2 className="text-lg font-semibold">
              Nenhum telefone cadastrado
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Os contatos úteis estarão disponíveis aqui assim que forem cadastrados.
            </p>
          </div>
        )}

        {!error && contatos.length > 0 && (
          <>
            {contatos.some((contato) => contato.prioritario) && (
              <section className="mb-8">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <AlertCircle size={20} className="text-amber-400" />
                  Contatos em destaque
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  {contatos
                    .filter((contato) => contato.prioritario)
                    .map((contato) => (
                      <ContatoCard
                        key={contato.id}
                        contato={contato}
                        destaque
                      />
                    ))}
                </div>
              </section>
            )}

            {categorias.map((categoria) => {
              const itens = contatos.filter(
                (contato) =>
                  contato.categoria === categoria &&
                  !contato.prioritario
              );

              if (itens.length === 0) return null;

              return (
                <section key={categoria} className="mb-8">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                    <Building2 size={20} className="text-blue-400" />
                    {categoria}
                  </h2>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {itens.map((contato) => (
                      <ContatoCard
                        key={contato.id}
                        contato={contato}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}

        <div className="mt-10 rounded-xl border border-slate-700 bg-slate-800 p-4 text-center">
          <p className="text-xs text-slate-400">
            Nova Suíça 02 · Telefones Úteis
          </p>
        </div>
      </div>
    </main>
  );
}

function ContatoCard({
  contato,
  destaque = false,
}: {
  contato: TelefoneUtil;
  destaque?: boolean;
}) {
  const telefones = [
    contato.telefone,
    contato.telefone_adicional_1,
    contato.telefone_adicional_2,
  ].filter((numero): numero is string => Boolean(numero?.trim()));

  return (
    <article
      className={`rounded-xl border p-5 shadow-lg ${
        destaque
          ? "border-amber-500/40 bg-slate-800"
          : "border-slate-700 bg-slate-800"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {contato.nome}
          </h3>

          {contato.descricao && (
            <p className="mt-1 text-sm text-slate-400">
              {contato.descricao}
            </p>
          )}
        </div>

        {destaque && (
          <span className="shrink-0 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
            Destaque
          </span>
        )}
      </div>

      <div className="mb-4 space-y-3">
        {telefones.map((numero, index) => (
          <div
            key={`${contato.id}-${index}`}
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <span className="text-sm text-slate-300">
              {numero}
              {index > 0 && (
                <span className="ml-2 text-xs text-slate-500">
                  Adicional
                </span>
              )}
            </span>

            <a
              href={linkTelefone(numero)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              <Phone size={15} />
              Ligar
            </a>
          </div>
        ))}
      </div>

      {contato.whatsapp && (
        <a
          href={linkWhatsApp(contato.whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          <MessageCircle size={16} />
          WhatsApp
        </a>
      )}
    </article>
  );
}
