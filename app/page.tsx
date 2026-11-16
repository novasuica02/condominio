import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Wrench, Calendar, CheckCircle2, Clock, MessageSquare, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

async function ListaChamados() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  const isSindico = profile?.role === "sindico";

  let query = supabase
    .from("chamados")
    .select(`
      *,
      tipos_servico (nome),
      sub_servicos (nome),
      chamados_historico (id, texto, created_at, profiles(nome))
    `)
    .order("created_at", { ascending: false });

  if (!isSindico) {
    query = query.eq("autor_id", user?.id);
  }

  const { data: chamados, error } = await query;

  if (error) return <div className="text-red-500 p-4">Erro: {error.message}</div>;

  if (!chamados || chamados.length === 0) {
    return (
      <div className="text-center p-12 bg-white rounded-xl border border-dashed text-slate-500">
        <Wrench className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p>Nenhum chamado encontrado.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {chamados.map((c) => {
        const historico = c.chamados_historico || [];
        const ultimoComentario = historico.length > 0 ? historico[historico.length - 1] : null;

        return (
          <Card key={c.id} className="shadow-sm border-slate-200">
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                  {c.titulo}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    c.status === 'aberto' ? 'bg-orange-100 text-orange-700' :
                    c.status === 'em_andamento' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {c.status.replace('_', ' ').toUpperCase()}
                  </span>
                </CardTitle>
                <CardDescription className="mt-1">
                  {c.tipos_servico?.nome} 
                  {c.sub_servicos?.nome && ` - ${c.sub_servicos.nome}`} 
                  • Aberto em {format(new Date(c.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </CardDescription>
              </div>
              {isSindico && (
                <Link href={`/chamados/${c.id}`}>
                  <Button variant="outline" size="sm">Gerenciar</Button>
                </Link>
              )}
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-slate-600 text-sm whitespace-pre-wrap">{c.descricao}</p>
              
              {ultimoComentario && (
                <div className="mt-3 bg-blue-50 border border-blue-100 rounded-md p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-3 h-3 text-blue-600" />
                    <span className="text-[10px] font-bold text-blue-800">Último Acompanhamento</span>
                  </div>
                  <p className="text-xs text-blue-900 whitespace-pre-wrap leading-tight">{ultimoComentario.texto}</p>
                </div>
              )}
              
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 bg-slate-50 p-2 rounded-md border border-slate-100">
                {c.localizacao && <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-slate-400" /> {c.localizacao}</span>}
                {c.sla && <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> SLA: {format(new Date(c.sla), "dd/MM/yyyy")}</span>}
                {isSindico && !c.prestadores && <span className="flex items-center gap-1 text-orange-500 font-medium"><Clock className="w-3 h-3" /> Sem prestador</span>}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

async function ChamadosHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  const isSindico = profile?.role === "sindico";

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-3">
        <Link href="/protected">
          <Button variant="ghost" size="icon" className="text-slate-500"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <h1 className="text-3xl font-bold text-slate-800">Chamados</h1>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {isSindico && (
          <>
            <Link href="/chamados/tipos"><Button variant="outline" size="sm"><Wrench className="w-4 h-4 mr-2" /> Tipos</Button></Link>
            <Link href="/prestadores"><Button variant="outline" size="sm"><User className="w-4 h-4 mr-2" /> Prestadores</Button></Link>
          </>
        )}
        <Link href="/chamados/novo">
          <Button className="bg-orange-600 hover:bg-orange-700"><Plus className="w-4 h-4 mr-2" /> Abrir Chamado</Button>
        </Link>
      </div>
    </div>
  );
}

export default function ChamadosPage() {
  return (
    <div className="flex-1 w-full flex flex-col items-center p-6 md:p-12 bg-slate-50/50 min-h-screen">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <Suspense fallback={<div className="h-20 animate-pulse bg-slate-200 rounded-lg"></div>}>
          <ChamadosHeader />
        </Suspense>

        <Suspense fallback={<div className="animate-pulse text-slate-500 p-8 text-center">Carregando chamados...</div>}>
          <ListaChamados />
        </Suspense>
      </div>
    </div>
  );
}