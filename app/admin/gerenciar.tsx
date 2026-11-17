"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function GerenciarUsuario({ id, roleAtual }: { id: string; roleAtual: string }) {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(roleAtual);

  const handleMudarRole = async (novaRole: string) => {
    if (novaRole === role) return;

    if (!confirm(`Deseja mudar o cargo deste usuário para ${novaRole.toUpperCase()}?`)) return;

    setLoading(true);
    const supabase = createClient();
    
    const { error } = await supabase.from("profiles").update({ role: novaRole }).eq("id", id);
    
    if (error) {
      alert("Erro ao alterar cargo: " + error.message);
    } else {
      setRole(novaRole); 
    }
    setLoading(false);
  };

  return (
    <select
      value={role}
      onChange={(e) => handleMudarRole(e.target.value)}
      disabled={loading}
      className="h-8 px-2 rounded border border-slate-600 bg-slate-700 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      <option value="morador">Morador</option>
      <option value="subsindico">Subsíndico</option>
      <option value="sindico">Síndico</option>
      <option value="prestador">Prestador</option>
    </select>
  );
}