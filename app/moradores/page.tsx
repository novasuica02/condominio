import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ListaMoradores from "./lista";

export default function MoradoresPage() {
  return (
    <div className="flex-1 w-full flex flex-col items-center p-6 md:p-12 bg-slate-50/50 min-h-screen">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        
        <div className="flex items-center gap-3">
          <Link href="/protected">
            <Button variant="ghost" size="icon" className="text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-800">Moradores</h1>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-slate-500">Carregando...</div>}>
          <ListaMoradores />
        </Suspense>
      </div>
    </div>
  );
}