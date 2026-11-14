import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import EnviarWhatsApp from "./enviar";

async function ListaAvisos() {
  const supabase = await createClient();
  const { data: avisos, error } = await supabase
    .from("avisos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return <div className="text-red-500 p-4">Erro: {error.message}</div>;
  if (!avisos || avisos.length === 0) return <p className="text-slate-500">Nenhum aviso para enviar.</p>;

  return (
    <div className="w-full flex flex-col gap-4">
      {avisos.map((aviso) => (
        <Card key={aviso.id} className="shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-lg text-slate-800">{aviso.titulo}</CardTitle>
              <CardDescription>
                {format(new Date(aviso.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </CardDescription>
            </div>
            {/* Botão que abre o modal de envio */}
            <EnviarWhatsApp aviso={aviso} />
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 text-sm line-clamp-3">{aviso.corpo}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function EnviarAvisosPage() {
  return (
    <div className="flex-1 w-full flex flex-col items-center p-6 md:p-12 bg-slate-50/50 min-h-screen">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link href="/avisos">
            <Button variant="ghost" size="icon" className="text-slate-500"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <MessageCircle className="w-8 h-8 text-green-600" /> Disparar Avisos
          </h1>
        </div>
        <p className="text-slate-600">Selecione um aviso abaixo para enviar via WhatsApp aos moradores.</p>

        <Suspense fallback={<div className="animate-pulse text-slate-500 p-8 text-center">Carregando avisos...</div>}>
          <ListaAvisos />
        </Suspense>
      </div>
    </div>
  );
}