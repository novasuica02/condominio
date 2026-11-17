
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TesteEmailPage() {
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);

  async function testarEmail() {
    setEnviando(true);
    setMensagem("");
    setSucesso(false);

    try {
      const supabase = createClient();

      const { data: { user }, error: authError } =
        await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Você precisa estar autenticado no sistema.");
      }

      const resposta = await fetch("/api/teste-email", {
        method: "POST",
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(resultado.erro || "Falha no envio.");
      }

      setSucesso(true);
      setMensagem(
        `E-mail enviado com sucesso! ID: ${resultado.id || "Confirmado"}`
      );

    } catch (error) {
      setSucesso(false);
      setMensagem(
        error instanceof Error ? error.message : "Erro inesperado."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Teste de envio de e-mail
        </h1>

        <p className="text-gray-600 mb-6">
          Condomínio Nova Suíça 02
        </p>

        <div className="bg-gray-50 border rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500">Destinatário</p>
          <p className="font-semibold text-gray-800">
            xiko57@gmail.com
          </p>

          <p className="text-sm text-gray-500 mt-3">Remetente</p>
          <p className="font-semibold text-gray-800 break-all">
            nao-responda@mail.sostoyota.com.br
          </p>
        </div>

        <button
          onClick={testarEmail}
          disabled={enviando}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
        >
          {enviando ? "Enviando..." : "Enviar e-mail de teste"}
        </button>

        {mensagem && (
          <div
            className={`mt-5 p-4 rounded-lg text-sm ${
              sucesso
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {mensagem}
          </div>
        )}

      </div>
    </main>
  );
}
