import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, ArrowRight } from "lucide-react";

export async function UltimoAviso() {
  const supabase = await createClient();
  const { data: avisos } = await supabase
    .from("avisos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  if (!avisos || avisos.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-8 border-dashed bg-slate-50">
        <CardContent className="pt-6 text-center text-slate-500">
          Nenhum aviso publicado no momento.
        </CardContent>
      </Card>
    );
  }

  const aviso = avisos[0];

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8 border-blue-100 shadow-sm text-left">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-blue-600 font-medium text-sm mb-1">
          <Megaphone className="w-4 h-4" />
          Último Aviso
        </div>
        <CardTitle className="text-xl">{aviso.titulo}</CardTitle>
        <CardDescription>
          {new Date(aviso.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit"
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600 line-clamp-3">{aviso.corpo}</p>
        <Link href="/avisos" className="inline-flex items-center text-sm text-blue-600 hover:underline mt-4">
          Ver todos os avisos <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </CardContent>
    </Card>
  );
}