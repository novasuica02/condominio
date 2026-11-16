import { Suspense } from "react";
import { GerenciarChamado } from "./gerenciar";

export default function GerenciarChamadoPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="flex-1 w-full flex flex-col items-center p-4 md:p-12 bg-slate-900 min-h-screen">
      <Suspense fallback={<div className="text-center p-12 text-slate-400">Carregando chamado...</div>}>
        <GerenciarChamado params={params} />
      </Suspense>
    </div>
  );
}