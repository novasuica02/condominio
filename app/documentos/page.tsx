import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, FileText, Eye, LogOut, Building2 } from "lucide-react";
import Header from "@/components/Header";

async function ListaDocumentos() {
  const supabase = await createClient();
  const { data: documentos, error } = await supabase
    .from("documentos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return <div className="text-red-400 p-4">Erro: {error.message}</div>;
  if (!documentos || documentos.length === 0) return <div className="text-center p-12 bg-slate-800 rounded-xl border border-slate-700 text-slate-400">Nenhum documento publicado ainda.</div>;

  const categorias = Array.from(new Set(documentos.map(d => d.categoria)));

  return (
    <div className="w-full flex flex-col gap-8">
      {categorias.map((categoria) => (
        <div key={categoria} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white border-b border-slate-700 pb-2">{categoria}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documentos.filter(d => d.categoria === categoria).map((doc) => (
              <Card key={doc.id} className="bg-slate-800 border-slate-700 shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-white">{doc.titulo}</CardTitle>
                    <CardDescription className="text-slate-400">
                      {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                    </CardDescription>
                  </div>
                  <div className="bg-slate-700 p-2 rounded-md text-slate-300">
                    <FileText className="w-5 h-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <a 
                    href={doc.arquivo_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <Eye className="w-4 h-4" /> Visualizar Documento
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

async function HeaderDocumentos() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isSindico = profile?.role === "sindico" || profile?.role === "subsindico";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/protected">
            <Button variant="outline" className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white h-8 px-3 text-sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Menu
            </Button>
          </Link>
          <div className="flex items-center gap-2 hidden sm:flex">
            <Building2 className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-white">Nova Suíça 02</span>
          </div>
        </div>
        
        <form action="/auth/logout" method="post">
          <Button variant="outline" size="sm" className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
            <LogOut className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Sair</span>
          </Button>
        </form>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <FileText className="w-8 h-8 text-emerald-500" /> Documentos
        </h1>
        
        {isSindico && (
          <Link href="/documentos/novo">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
              <Plus className="w-4 h-4 mr-2" /> Enviar Documento
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function DocumentosPage() {
  return (
    <div className="flex-1 w-full flex flex-col items-center p-4 md:p-12 bg-slate-900 min-h-screen">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <Suspense fallback={<div className="h-24 animate-pulse bg-slate-800 rounded-xl"></div>}>
          <HeaderDocumentos />
        </Suspense>

        <Suspense fallback={<div className="animate-pulse text-slate-400 p-8 text-center">Carregando documentos...</div>}>
          <ListaDocumentos />
        </Suspense>
      </div>
    </div>
  );
}