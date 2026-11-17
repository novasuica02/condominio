"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function BotaoExcluirAviso({ avisoId }: { avisoId: number }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    // Confirmação para evitar exclusão acidental
    if (!confirm("Tem certeza que deseja excluir este aviso? Todas as atualizações e anexos vinculados a ele também serão apagados.")) {
      return;
    }

    setLoading(true);
    const supabase = createClient();
    
    // Deleta o aviso. O ON DELETE CASCADE no banco vai apagar o histórico junto.
    const { error } = await supabase.from("avisos").delete().eq("id", avisoId);
    
    setLoading(false);

    if (error) {
      alert("Erro ao excluir: " + error.message);
    } else {
      // Recarrega a página para atualizar a lista
      window.location.reload();
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="bg-transparent border-red-900/50 text-red-400 hover:bg-red-900/30 hover:text-red-300"
    >
      <Trash2 className="w-4 h-4 mr-2" /> {loading ? "Excluindo..." : "Excluir"}
    </Button>
  );
}