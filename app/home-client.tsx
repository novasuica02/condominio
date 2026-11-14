"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2, UserCircle } from "lucide-react";

export default function HomeClient() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-12 text-center">Carregando...</div>;

  return (
    <div className="flex-1 w-full flex flex-col items-center p-6 md:p-12">
      <div className="w-full max-w-5xl flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 hidden sm:block">Nova Suíça 02</h1>
        </div>
        <div>
          {user ? (
            <Link href="/protected"><Button>Acessar Painel</Button></Link>
          ) : (
            <Link href="/auth/login"><Button>Fazer Login</Button></Link>
          )}
        </div>
      </div>
      <div className="w-full max-w-4xl mt-12 text-center flex flex-col items-center gap-6">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
          Tudo o que acontece no seu prédio, <br className="hidden md:block" />
          <span className="text-blue-600">em um só lugar.</span>
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl">
          Acesse o mural de avisos, abra chamados e fique por dentro das novidades.
        </p>
        <div className="mt-2">
          <Link href="/auth/sign-up"><Button size="lg" className="px-8 bg-blue-600">Criar minha conta</Button></Link>
        </div>
      </div>
    </div>
  );
}