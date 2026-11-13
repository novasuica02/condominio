import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, FileText, Download } from "lucide-react";

async function ListaDocumentos() {
  const supabase = await createClient();
  const { data: documentos, error } = await supabase
    .from("documentos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="text-red-500 p-4 border border-red-200 rounded bg-red-50">Erro: {error.message}</div>;
  }

  if (!documentos || documentos.length === 0) {
    return (
      <div className="text-center p-12 bg-white rounded-xl border border-dashed text-slate-500">
        <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p>Nenhum documento publicado ainda.</p>
      </div>
    );
  }

  // Agrupa os documentos por categoria
  const categorias = Array.from(new Set(documentos.map(d => d.categoria)));

  return (
    <div className="w-full flex flex-col gap-8">
      {categorias.map((categoria) => (
        <div key={categoria} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-slate-800 border-b pb-2">{categoria}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documentos.filter(d => d.categoria === categoria).map((doc) => (
              <Card key={doc.id} className="shadow-sm border-slate-200">
                <CardHeader className="pb-3 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-slate-800">{doc.titulo}</CardTitle>
                    <CardDescription>
                      {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                    </CardDescription>
                  </div>
                  <div className="bg-slate-100 p-2 rounded-md text-slate-500">
                    <FileText className="w-5 h-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <a 
                    href={doc.arquivo_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm font-medium"
                  >
                    <Download className="w-4 h-4" /> Baixar Arquivo
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

export default function DocumentosPage() {
  return (
    <div className="flex-1 w-full flex flex-col items-center p-6 md:p-12 bg-slate-50/50 min-h-screen">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link href="/protected">
              <Button variant="ghost" size="icon" className="text-slate-500">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-slate-800">Documentos</h1>
          </div>
          
          <Link href="/documentos/novo">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Enviar Documento
            </Button>
          </Link>
        </div>

        <Suspense fallback={<div className="animate-pulse text-slate-500 p-8 text-center">Carregando documentos...</div>}>
          <ListaDocumentos />
        </Suspense>
      </div>
    </div>
  );
}