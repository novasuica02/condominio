
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MapPin,
  Clock,
  MessageSquare,
  User,
  Tag,
  AlertCircle,
  Calendar,
  Wrench,
} from "lucide-react";
import GerenciarChamadoForm from "./form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function GerenciarChamado({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isSindico =
    profile?.role === "sindico" ||
    profile?.role === "subsindico";

  if (!isSindico && profile?.role !== "prestador") {
    redirect("/chamados");
  }

  const { data: chamado, error } = await supabase
    .from("chamados")
    .select(`
      *,
      autor:profiles(nome, unidade),
      tipos_servico(nome),
      sub_servicos(nome),
      prestadores:prestadores!chamados_prestador_id_fkey(nome)
    `)
    .eq("id", id)
    .single();

  const { data: prestadores } = await supabase
    .from("prestadores")
    .select("*")
    .order("nome");

  const { data: historico } = await supabase
    .from("chamados_historico")
    .select(`*, profiles(nome)`)
    .eq("chamado_id", id)
    .order("created_at", { ascending: true });

  if (error || !chamado) {
    return (
      <div className="text-center p-12 bg-slate-800 rounded-xl border border-slate-700 shadow-sm">
        <h2 className="text-red-400 font-bold text-xl mb-2">
          Chamado não encontrado
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          O ID {id} não retornou nenhum resultado.
        </p>
        <Link href="/chamados">
          <Button
            variant="outline"
            className="text-slate-200 border-slate-600 hover:bg-slate-700"
          >
            Voltar para a lista
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl flex flex-col gap-6">
      <div className="flex items-center gap-2 border-b border-slate-700 pb-4">
        <Link href="/chamados">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-white">
          Gerenciar Chamado #{chamado.id}
        </h1>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl shadow-xl text-white border border-slate-700">
        <div className="flex justify-between items-start mb-3">
          <h2 className="font-bold text-2xl text-white">
            {chamado.titulo}
          </h2>

          <span
            className={`text-xs px-3 py-1 rounded-full font-bold ${
              chamado.status === "aberto"
                ? "bg-orange-500 text-white"
                : chamado.status === "em_andamento"
                  ? "bg-blue-500 text-white"
                  : chamado.status === "em_analise"
                    ? "bg-amber-500 text-white"
                    : "bg-green-500 text-white"
            }`}
          >
            {chamado.status.replace("_", " ").toUpperCase()}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 text-sm mb-4 pb-4 border-b border-slate-600">
          <span className="flex items-center gap-1.5 bg-slate-700 px-3 py-1.5 rounded-full text-slate-200">
            <User className="w-4 h-4 text-amber-400" />
            Aberto por:{" "}
            <strong className="text-white">
              {chamado.autor?.nome || "Morador"}
            </strong>{" "}
            ({chamado.autor?.unidade})
          </span>

          <span className="flex items-center gap-1.5 bg-slate-700 px-3 py-1.5 rounded-full text-slate-200">
            <Tag className="w-4 h-4 text-amber-400" />
            {chamado.tipos_servico?.nome}{" "}
            {chamado.sub_servicos?.nome &&
              `- ${chamado.sub_servicos.nome}`}
          </span>

          <span className="flex items-center gap-1.5 bg-slate-700 px-3 py-1.5 rounded-full text-slate-200">
            <Clock className="w-4 h-4 text-amber-400" />
            {format(
              new Date(chamado.created_at),
              "dd/MM/yyyy 'às' HH:mm",
              { locale: ptBR }
            )}
          </span>
        </div>

        <p className="text-slate-200 whitespace-pre-wrap leading-relaxed mb-4">
          {chamado.descricao}
        </p>

        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-600">
          {chamado.localizacao && (
            <div className="text-sm text-amber-200 flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700">
              <MapPin className="w-4 h-4 text-amber-400" />
              <strong>Local:</strong> {chamado.localizacao}
            </div>
          )}

          {chamado.sla && (
            <div className="text-sm text-amber-200 flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700">
              <Calendar className="w-4 h-4 text-amber-400" />
              <strong>SLA:</strong>{" "}
              {format(new Date(chamado.sla), "dd/MM/yyyy")}
            </div>
          )}

          {chamado.prestadores && (
            <div className="text-sm text-amber-200 flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700">
              <Wrench className="w-4 h-4 text-amber-400" />
              <strong>Prestador:</strong>{" "}
              {chamado.prestadores.nome}
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-700 p-6 rounded-xl border border-slate-600 shadow-lg">
        <h3 className="font-bold text-lg text-white flex items-center gap-2 mb-4 border-b border-slate-600 pb-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          Histórico de Movimentações
        </h3>

        {!historico || historico.length === 0 ? (
          <p className="text-slate-300 text-sm italic flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Nenhuma movimentação registrada ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {historico.map((h: any) => (
              <div key={h.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center shrink-0 border border-blue-500/30">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="w-px h-full bg-slate-600 my-1"></div>
                </div>

                <div className="pb-4 w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-white">
                      {h.profiles?.nome || "Sistema"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {format(
                        new Date(h.created_at),
                        "dd/MM/yyyy 'às' HH:mm",
                        { locale: ptBR }
                      )}
                    </span>
                  </div>

                  <div className="bg-slate-800 border border-slate-600 p-3 rounded-md text-sm text-slate-200 whitespace-pre-wrap shadow-sm">
                    {h.texto}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
        <GerenciarChamadoForm
          chamado={chamado}
          prestadores={prestadores || []}
        />
      </div>
    </div>
  );
}
