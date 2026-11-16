import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, ArrowRight } from "lucide-react";

export async function UltimoAviso() {
  const supabase = await createClient();
  
  // Tenta buscar o último aviso
  const { data: avisos, error } = await supabase
    .from("avisos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Erro ao buscar aviso:", error);
  }

  if (!avisos || avisos.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-8 bg-slate-800 border-slate-700 text-slate-400">
        <CardContent className="pt-6 text-center">
          Nenhum aviso publicado no momento.
        </CardContent>
      </Card>
    );
  }

  const aviso = avisos[0];

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8 bg-slate-800 border-slate-700 text-left shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-blue-400 font-medium text-sm mb-1">
          <Megaphone className="w-4 h-4" />
          Último Aviso
        </div>
        <CardTitle className="text-xl text-white">{aviso.titulo}</CardTitle>
        <CardDescription className="text-slate-400">
          {new Date(aviso.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit"
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-slate-300 line-clamp-3">{aviso.corpo}</p>
        <Link href="/avisos" className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 hover:underline mt-4">
          Ver todos os avisos <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </CardContent>
    </Card>
  );
}