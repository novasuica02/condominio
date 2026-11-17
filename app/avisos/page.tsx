import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Megaphone, MessageCircle, Eye, Edit, Paperclip, MessageSquare, Clock } from "lucide-react";
import Header from "@/components/Header";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import BotaoExcluirAviso from "./botao-excluir";

async function ListaAvisos() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  const isSindico = profile?.role === "sindico" || profile?.role === "subsindico";

  const { data: avisos, error } = await supabase
    .from("avisos")
    .select(`
      *,
      avisos_historico!aviso_id (id, texto, arquivo_url, created_at)
    `)
    .order("created_at", { ascending: false });

  if (error) return <div className="text-red-400 p-4">Erro: {error.message}</div>;
  if (!avisos || avisos.length === 0) return <div className="text-center p-12 bg-slate-800 rounded-xl border border-slate-700 text-slate-400">Nenhum aviso publicado.</div>;

  return (
    <div className="w-full flex flex-col gap-4">
      {avisos.map((aviso) => {
        const historico = (aviso.avisos_historico || []).sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        return (
          <Card key={aviso.id} className="bg-slate-800 border-slate-700 shadow-sm overflow-hidden border-l-4 border-l-blue-500">
            <CardHeader className="pb-3 flex flex-row items-start justify-between bg-slate-800/50">
              <div className="flex items-start gap-3">
                <div className="bg-blue-900/50 p-2 rounded-full text-blue-400 mt-1">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl text-white font-bold">{aviso.titulo}</CardTitle>
                    {aviso.arquivo_url && (
                      <span title="Este aviso possui um anexo" className="text-blue-400 bg-blue-900/50 p-1 rounded-full">
                        <Paperclip className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  
                  <CardDescription className="mt-2 flex items-center gap-2">
                    <span className="text-sm font-bold text-amber-400">Publicado em:</span>
                    <span className="bg-slate-700 text-white px-2.5 py-1 rounded text-sm font-bold shadow-sm">
                      {format(new Date(aviso.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </CardDescription>
                </div>
              </div>
              
              {isSindico && (
                <div className="flex gap-2">
                  <Link href={`/avisos/editar/${aviso.id}`}>
                    <Button variant="outline" size="sm" className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                      <Edit className="w-4 h-4 mr-2" /> Editar
                    </Button>
                  </Link>
                  <BotaoExcluirAviso avisoId={aviso.id} />
                </div>
              )}
            </CardHeader>
            
            <CardContent className="pt-4">
              <p className="whitespace-pre-wrap text-slate-200 leading-relaxed mb-4">{aviso.corpo}</p>
              
              {aviso.arquivo_url && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <a href={aviso.arquivo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-800 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    <Eye className="w-4 h-4" /> Visualizar Anexo Original
                  </a>
                </div>
              )}

              {historico.length > 0 && (
                <div className="mt-6 border-t border-slate-700 pt-4">
                  <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2 mb-4">
                    <MessageSquare className="w-4 h-4" /> Atualizações deste Aviso
                  </h4>
                  <div className="flex flex-col gap-4">
                    {historico.map((h: any) => (
                      <div key={h.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="w-4 h-4 text-amber-400" />
                          <span className="text-sm font-bold text-amber-400">Publicado em:</span>
                          <span className="bg-slate-700 text-white px-2.5 py-1 rounded text-sm font-bold shadow-sm">
                            {format(new Date(h.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-slate-200 text-sm whitespace-pre-wrap">{h.texto}</p>
                        
                        {h.arquivo_url && (
                          <div className="mt-3">
                            <a href={h.arquivo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium hover:underline bg-blue-900/20 px-3 py-1.5 rounded">
                              <Eye className="w-4 h-4" /> Visualizar Anexo da Atualização
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

async function AvisosHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  const isSindico = profile?.role === "sindico" || profile?.role === "subsindico";

  return (
    <div className="flex flex-col gap-4">
      <Header />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Megaphone className="w-8 h-8 text-blue-500" /> Mural de Avisos
        </h1>
        
        {isSindico && (
          <div className="flex flex-wrap gap-2">
            <Link href="/avisos/enviar">
              <Button variant="outline" className="text-green-400 border-green-800 hover:bg-green-900/30 bg-transparent">
                <MessageCircle className="w-4 h-4 mr-2" /> Disparar WhatsApp
              </Button>
            </Link>
            <Link href="/novo-aviso">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white"><Plus className="w-4 h-4 mr-2" /> Novo Aviso</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AvisosPage() {
  return (
    <div className="flex-1 w-full flex flex-col items-center p-4 md:p-12 bg-slate-900 min-h-screen">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <Suspense fallback={<div className="h-24 animate-pulse bg-slate-800 rounded-xl"></div>}>
          <AvisosHeader />
        </Suspense>
        <Suspense fallback={<div className="animate-pulse text-slate-400 p-8 text-center">Carregando avisos...</div>}>
          <ListaAvisos />
        </Suspense>
      </div>
    </div>
  );
}