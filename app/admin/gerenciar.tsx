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
    await supabase.from("profiles").update({ role: novaRole }).eq("id", id);
    setLoading(false);
    window.location.reload();
  };

  return (
    <Button 
      variant={roleAtual === "sindico" ? "destructive" : "outline"} 
      size="sm" 
      onClick={toggleRole}
      disabled={loading}
    >
      {roleAtual === "sindico" ? "Rebaixar a Morador" : "Promover a Síndico"}
    </Button>
  );
}