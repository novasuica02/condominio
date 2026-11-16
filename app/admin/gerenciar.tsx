"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function GerenciarUsuario({ id, roleAtual }: { id: string; roleAtual: string }) {
  const [loading, setLoading] = useState(false);

  const toggleRole = async () => {
    const novaRole = roleAtual === "sindico" ? "morador" : "sindico";
    if (!confirm(`Deseja mudar o cargo deste usuário para ${novaRole.toUpperCase()}?`)) return;

    setLoading(true);
    const supabase = createClient();
    
    // Atualiza o cargo no banco
    const { error } = await supabase.from("profiles").update({ role: novaRole }).eq("id", id);
    
    if (error) {
      alert("Erro ao alterar cargo: " + error.message);
    } else {
      // Recarrega a página para atualizar a lista na tela
      window.location.reload();
    }
    setLoading(false);
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={toggleRole}
      disabled={loading}
      className={`h-8 text-xs ${
        roleAtual === "sindico" 
          ? "bg-transparent border-red-500 text-red-400 hover:bg-red-900/30" 
          : "bg-transparent border-slate-500 text-slate-300 hover:bg-slate-700 hover:text-white"
      }`}
    >
      {roleAtual === "sindico" ? "Rebaixar a Morador" : "Promover a Síndico"}
    </Button>
  );
}