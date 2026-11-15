import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Wrench, Phone, MessageCircle, UserCircle, MapPin, FileText } from "lucide-react";

async function ListaProfissionais() {
  const supabase = await createClient();
  const { data: profissionais, error } = await supabase.from("profissionais_indicados").select("*").order("especialidade");

  if (error) return <div className="text-red-500">Erro: {error.message}</div>;
  if (!profissionais || profissionais.length === 0) return <div className="text-center p-12 bg-white rounded-xl border border-dashed text-slate-500">Nenhum serviço cadastrado pelo síndico ainda.</div>;

  const especialidades = Array.from(new Set(profissionais.map(p => p.especialidade)));

  return (
    <div className="w-full flex flex-col gap-8">
      {especialidades.map(esp => (
        <div key={esp} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-teal-500" /> {esp}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profissionais.filter(p => p.especialidade === esp).map(p => (
              <Card key={p.id} className="shadow-sm hover:border-teal-300 transition-colors border-l-4 border-l-teal-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-teal-600" /> {p.nome}
                  </CardTitle>
                  {p.observacao && <CardDescription className="italic mt-1">"{p.observacao}"</CardDescription>}
                </CardHeader>
                <CardContent>
                  {/* Informações extras de contato e localização */}
                  <div className="flex flex-col gap-1 text-sm text-slate-600 mb-4 mt-2">
                    {p.cpf_cnpj && (
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" /> CPF/CNPJ: {p.cpf_cnpj}
                      </span>
                    )}
                    {p.endereco && (
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" /> {p.endereco}
                      </span>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-2 mt-2">
                    {p.telefone && (
                      <a 
                        href={`https://wa.me/55${p.telefone.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                      </a>
                    )}
                    {p.telefone && (
                      <a 
                        href={`tel:${p.telefone.replace(/\D/g, '')}`} 
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        <Phone className="w-4 h-4" /> Ligar
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  const isSindico = profile?.role === "sindico";

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
      <div className="flex items-center gap-3">
        <Link href="/protected"><Button variant="ghost" size="icon" className="text-slate-500"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <UserCircle className="w-8 h-8 text-teal-600" /> Serviços Profissionais
        </h1>
      </div>
      
      {isSindico && (
        <Link href="/profissionais/gerenciar">
          <Button className="bg-teal-600 hover:bg-teal-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Gerenciar Serviços
          </Button>
        </Link>
      )}
    </div>
  );
}

export default function ProfissionaisPage() {
  return (
    <div className="flex-1 w-full flex flex-col items-center p-4 md:p-12 bg-slate-50/50 min-h-screen">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <Suspense fallback={<div className="h-24 animate-pulse bg-slate-200 rounded-xl"></div>}>
          <Header />
        </Suspense>
        <Suspense fallback={<div className="animate-pulse text-slate-500 p-8 text-center">Carregando serviços...</div>}>
          <ListaProfissionais />
        </Suspense>
      </div>
    </div>
  );
}