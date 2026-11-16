import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Megaphone, MessageCircle, Eye, Edit, Paperclip } from "lucide-react";
import Header from "@/components/Header";

async function ListaAvisos() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  const isSindico = profile?.role === "sindico";

  const { data: avisos, error } = await supabase.from("avisos").select("*").order("created_at", { ascending: false });

  if (error) return <div className="text-red-400 p-4">Erro: {error.message}</div>;
  if (!avisos || avisos.length === 0) return <div className="text-center p-12 bg-slate-800 rounded-xl border border-slate-700 text-slate-400">Nenhum aviso publicado.</div>;

  return (
    <div className="w-full flex flex-col gap-4">
      {avisos.map((aviso) => (
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
                <CardDescription className="mt-1 flex items-center gap-2">
                  <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-xs font-medium">
                    {new Date(aviso.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </CardDescription>
              </div>
            </div>
            
            {isSindico && (
              <Link href={`/avisos/editar/${aviso.id}`}>
                <Button variant="outline" size="sm" className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                  <Edit className="w-4 h-4 mr-2" /> Editar
                </Button>
              </Link>
            )}
          </CardHeader>
          
          <CardContent className="pt-4">
            <p className="whitespace-pre-wrap text-slate-300 leading-relaxed mb-4">{aviso.corpo}</p>
            
            {aviso.arquivo_url && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <a 
                  href={aviso.arquivo_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <Eye className="w-4 h-4" /> Visualizar Anexo
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function AvisosHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  const isSindico = profile?.role === "sindico";

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