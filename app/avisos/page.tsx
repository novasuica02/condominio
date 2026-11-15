import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Megaphone, MessageCircle, Eye, Edit, Paperclip } from "lucide-react";

async function ListaAvisos() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  const isSindico = profile?.role === "sindico";

  const { data: avisos, error } = await supabase.from("avisos").select("*").order("created_at", { ascending: false });

  if (error) return <div className="text-red-500">Erro: {error.message}</div>;
  if (!avisos || avisos.length === 0) return <div className="text-center p-12 bg-white rounded-xl border border-dashed text-slate-500">Nenhum aviso publicado.</div>;

  return (
    <div className="w-full flex flex-col gap-4">
      {avisos.map((aviso) => (
        <Card key={aviso.id} className="shadow-sm border-slate-200">
          <CardHeader className="pb-3 flex flex-row items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl text-slate-800">{aviso.titulo}</CardTitle>
                {/* ÍCONE DE ANEXO AQUI */}
                {aviso.arquivo_url && (
                  <span title="Este aviso possui um anexo" className="text-blue-500 bg-blue-50 p-1 rounded-full">
                    <Paperclip className="w-4 h-4" />
                  </span>
                )}
              </div>
              <CardDescription className="mt-1">
                {new Date(aviso.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}
              </CardDescription>
            </div>
            {isSindico && (
              <Link href={`/avisos/editar/${aviso.id}`}>
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                  <Edit className="w-4 h-4 mr-2" /> Editar
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-slate-600 mb-4">{aviso.corpo}</p>
            
            {aviso.arquivo_url && (
              <a 
                href={aviso.arquivo_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <Eye className="w-4 h-4" /> Visualizar Anexo
              </a>
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
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-3">
        <Link href="/protected"><Button variant="ghost" size="icon" className="text-slate-500"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2"><Megaphone className="w-8 h-8 text-blue-600" /> Mural de Avisos</h1>
      </div>
      
      {isSindico && (
        <div className="flex flex-wrap gap-2">
          <Link href="/avisos/enviar">
            <Button variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
              <MessageCircle className="w-4 h-4 mr-2" /> Disparar WhatsApp
            </Button>
          </Link>
          <Link href="/novo-aviso">
            <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" /> Novo Aviso</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function AvisosPage() {
  return (
    <div className="flex-1 w-full flex flex-col items-center p-6 md:p-12 bg-slate-50/50 min-h-screen">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <Suspense fallback={<div className="h-20 animate-pulse bg-slate-200 rounded-lg"></div>}>
          <AvisosHeader />
        </Suspense>
        <Suspense fallback={<div className="animate-pulse text-slate-500 p-8 text-center">Carregando avisos...</div>}>
          <ListaAvisos />
        </Suspense>
      </div>
    </div>
  );
}