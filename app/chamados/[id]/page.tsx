import { Suspense } from "react";
import { GerenciarChamado } from "./gerenciar"; // Vamos criar este arquivo abaixo

export default function GerenciarChamadoPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex-1 w-full flex flex-col items-center p-6 md:p-12 bg-slate-50/50 min-h-screen">
      <Suspense fallback={<div className="text-center p-12 text-slate-500">Carregando chamado...</div>}>
        <GerenciarChamado id={params.id} />
      </Suspense>
    </div>
  );
}