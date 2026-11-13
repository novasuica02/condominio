import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { UserStatus } from "./user-status";
import { UltimoAviso } from "./ultimo-aviso";

export default function Home() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8 items-center p-6 md:p-12 bg-slate-50/50 min-h-screen">
      
      {/* Cabeçalho com Logo */}
      <div className="w-full max-w-5xl flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight hidden sm:block">
            Nova Suiça 02
          </h1>
        </div>
        
        <div>
          <Suspense fallback={<Button disabled>Carregando...</Button>}>
            <UserStatus />
          </Suspense>
        </div>
      </div>

      {/* Área Central */}
      <div className="w-full max-w-4xl mt-8 text-center flex flex-col items-center gap-6">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
          Tudo o que acontece no seu prédio, <br className="hidden md:block" />
          <span className="text-blue-600">em um só lugar.</span>
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl">
          Acesse o mural de avisos, abra chamados para a administração e fique por dentro das novidades.
        </p>
        
        <div className="mt-2">
          <Link href="/auth/sign-up">
            <Button size="lg" className="px-8 bg-blue-600 hover:bg-blue-700">Criar minha conta</Button>
          </Link>
        </div>

        <Suspense fallback={<div className="text-slate-400 mt-8 animate-pulse">Buscando último aviso...</div>}>
          <UltimoAviso />
        </Suspense>
      </div>
    </div>
  );
}