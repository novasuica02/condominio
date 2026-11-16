"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Wrench, Users, Calendar, CheckCircle2, MessageSquare, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Header from "@/components/Header";

export default function ChamadosPage() {
  const [chamados, setChamados] = useState<any[]>([]);
  const [isSindico, setIsSindico] = useState(false);
  const [isPrestador, setIsPrestador] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<"ativos" | "fechados">("ativos");

  useEffect(() => {
    async function carregar() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        window.location.href = "/auth/login";
        return;
      }

      const user = session.user;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, nome")
        .eq("id", user.id)
        .single();
      
      const sindicoLogado = profile?.role === "sindico";
      const prestadorLogado = profile?.role === "prestador";
      
      setIsSindico(sindicoLogado);
      setIsPrestador(prestadorLogado);
      setNomeUsuario(profile?.nome || user.email || "Usuário");

      let query = supabase
        .from("chamados")
        .select(`
          *,
          prestadores (nome, telefone),
          tipos_servico (nome),
          sub_servicos (nome),
          chamados_historico (id, texto, created_at, profiles(nome))
        `)
        .order("created_at", { ascending: false });

      if (prestadorLogado) {
        const { data: prestadorData } = await supabase.from("prestadores").select("id").eq("usuario_id", user.id).single();
        if (prestadorData) query = query.eq("prestador_id", prestadorData.id);
      } else if (!sindicoLogado) {
        query = query.eq("autor_id", user.id);
      }

      const { data, error } = await query;

      if (error) setErro(error.message);
      else if (data) setChamados(data);
      
      setLoading(false);
    }
    carregar();
  }, []);

  const chamadosFiltrados = chamados.filter(c => {
    if (filtro === "ativos") return c.status === "aberto" || c.status === "em_andamento";
    return c.status === "resolvido";
  });

  if (loading) {
    return <div className="flex-1 w-full flex items-center justify-center bg-slate-900 min-h-screen"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  }

  const primeiroNome = nomeUsuario.split(' ')[0];

  return (
    <div className="flex-1 w-full flex flex-col items-center p-4 md:p-12 bg-slate-900 min-h-screen">
      <div className="w-full max-w-4xl flex flex-col gap-4">
        
        {/* HEADER REUTILIZÁVEL */}
        <Header showBackButton={!isPrestador} backText="Menu" />

        {/* TÍTULO, FILTROS E AÇÕES */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {isPrestador ? `Chamados do ${primeiroNome}` : "Chamados"}
          </h1>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button 
                onClick={() => setFiltro("ativos")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filtro === "ativos" ? "bg-orange-600 text-white" : "text-slate-400 hover:bg-slate-700 hover:text-white"}`}
              >
                Em Aberto
              </button>
              <button 
                onClick={() => setFiltro("fechados")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filtro === "fechados" ? "bg-green-600 text-white" : "text-slate-400 hover:bg-slate-700 hover:text-white"}`}
              >
                Resolvidos
              </button>
            </div>

            {isSindico && (
              <>
                <Link href="/chamados/tipos"><Button variant="outline" size="sm" className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hidden sm:inline-flex h-8 text-xs"><Wrench className="w-3 h-3 mr-1" /> Tipos</Button></Link>
                <Link href="/prestadores"><Button variant="outline" size="sm" className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hidden sm:inline-flex h-8 text-xs"><Users className="w-3 h-3 mr-1" /> Prestadores</Button></Link>
              </>
            )}
            {!isPrestador && (
              <Link href="/chamados/novo">
                <Button className="bg-orange-600 hover:bg-orange-500 text-white h-8 text-xs px-3"><Plus className="w-3 h-3 mr-1" /> Abrir</Button>
              </Link>
            )}
          </div>
        </div>

        {erro && <div className="text-red-400 p-4 bg-red-900/20 border border-red-900 rounded-lg">Erro: {erro}</div>}

        {/* LISTA */}
        {chamadosFiltrados.length === 0 ? (
          <div className="text-center p-12 bg-slate-800 rounded-xl border border-slate-700 text-slate-400">
            <Wrench className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <p>Nenhum chamado encontrado neste filtro.</p>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3">
            {chamadosFiltrados.map((c) => {
              const historico = c.chamados_historico || [];
              const ultimoComentario = historico.length > 0 ? historico[historico.length - 1] : null;

              return (
                <Card key={c.id} className="bg-slate-800 border-slate-700 shadow-sm">
                  <CardHeader className="pb-2 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-base text-white flex items-center gap-2">
                        {c.titulo}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          c.status === 'aberto' ? 'bg-orange-500 text-white' :
                          c.status === 'em_andamento' ? 'bg-blue-500 text-white' :
                          'bg-green-500 text-white'
                        }`}>
                          {c.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </CardTitle>
                      <CardDescription className="mt-0.5 text-xs text-slate-400">
                        {c.tipos_servico?.nome} 
                        {c.sub_servicos?.nome && ` - ${c.sub_servicos.nome}`} 
                        • {format(new Date(c.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </CardDescription>
                    </div>
                    {(isSindico || isPrestador) && (
                      <Link href={`/chamados/${c.id}`}>
                        <Button variant="outline" size="sm" className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white h-8 text-xs">
                          Atualizar
                        </Button>
                      </Link>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{c.descricao}</p>
                    
                    {ultimoComentario && (
                      <div className="mt-2 bg-slate-900/50 border border-slate-700 rounded-md p-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          <MessageSquare className="w-3 h-3 text-blue-400" />
                          <span className="text-[10px] font-bold text-blue-400">Último Acompanhamento</span>
                        </div>
                        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-tight">{ultimoComentario.texto}</p>
                      </div>
                    )}
                    
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-400 bg-slate-900/50 p-2 rounded-md border border-slate-700">
                      {c.localizacao && <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-slate-500" /> {c.localizacao}</span>}
                      {c.sla && <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-500" /> SLA: {format(new Date(c.sla), "dd/MM/yyyy")}</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}