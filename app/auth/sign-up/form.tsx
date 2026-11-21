
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2 } from "lucide-react";
import Header from "@/components/Header";

const formatarTelefone = (valor: string) => {
  let apenasNumeros = valor.replace(/\D/g, "").slice(0, 11);

  if (apenasNumeros.length > 10)
    return apenasNumeros.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");

  if (apenasNumeros.length > 6)
    return apenasNumeros.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");

  if (apenasNumeros.length > 2)
    return apenasNumeros.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");

  if (apenasNumeros.length > 0)
    return apenasNumeros.replace(/^(\d{0,2}).*/, "($1");

  return "";
};

export default function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [unidadeId, setUnidadeId] = useState("");

  const [unidades, setUnidades] = useState<
    { id: number; nome: string }[]
  >([]);

  const [carregandoUnidades, setCarregandoUnidades] = useState(true);

  const [telefone, setTelefone] = useState("");
  const [maps, setMaps] = useState("");
  const [pontoRef, setPontoRef] = useState("");
  const [nomeRecado, setNomeRecado] = useState("");
  const [telRecado, setTelRecado] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Carrega as unidades disponíveis para o condomínio do domínio atual.
  useEffect(() => {
    async function carregarUnidades() {
      try {
        const response = await fetch("/api/unidades-cadastro");
        const resultado = await response.json();

        if (!response.ok) {
          throw new Error(
            resultado.error || "Erro ao carregar unidades."
          );
        }

        setUnidades(resultado.unidades || []);
      } catch (error) {
        console.error("Erro ao carregar unidades:", error);
        setMessage(
          "Não foi possível carregar as unidades. Atualize a página."
        );
      } finally {
        setCarregandoUnidades(false);
      }
    }

    carregarUnidades();
  }, []);

  // Cadastro com autorização temporária vinculada ao condomínio e à unidade.
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!unidadeId) {
      setMessage("Selecione sua unidade.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // 1. Solicita autorização para a unidade selecionada.
      const autorizacaoResponse = await fetch(
        "/api/autorizar-cadastro",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            unidade_id: Number(unidadeId),
          }),
        }
      );

      const autorizacao = await autorizacaoResponse.json();

      if (!autorizacaoResponse.ok || !autorizacao.token) {
        throw new Error(
          autorizacao.error ||
            "Não foi possível autorizar o cadastro."
        );
      }

      // 2. Cria a conta no Supabase com o token e os dados do morador.
      const supabase = createClient();

      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nome,
              unidade_id: unidadeId,
              cadastro_token: autorizacao.token,
              telefone,
              link_google_maps: maps,
              ponto_referencia: pontoRef,
              nome_para_recados: nomeRecado,
              telefone_recados: telRecado,
            },
          },
        });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error(
          "Não foi possível concluir a criação da conta."
        );
      }

      // 3. A função handle_new_user() grava o perfil e os dados
      // complementares diretamente no banco.
      setMessage("Conta criada com sucesso!");

      setTimeout(() => {
        window.location.href = "/protected";
      }, 1500);

    } catch (error) {
      console.error("Erro no cadastro:", error);

      setMessage(
        error instanceof Error
          ? "Erro ao criar conta: " + error.message
          : "Erro inesperado ao criar conta."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center bg-slate-900 min-h-screen">
      {/* HEADER NO TOPO */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 mb-6">
        <Header showBackButton={false} />
      </div>

      <div className="w-full max-w-xl px-4 pb-12">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-600 p-3 rounded-xl text-white">
            <Building2 className="w-8 h-8" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-white mb-6">
          Ficha do Morador
        </h1>

        {message && (
          <div
            className={`p-4 text-sm rounded-md mb-4 ${
              message.includes("Erro") || message.includes("Não foi")
                ? "bg-red-900/50 text-red-200 border border-red-700"
                : "bg-green-900/50 text-green-200 border border-green-700"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSignUp} className="flex flex-col gap-5">
          {/* BLOCO 1: DADOS DO MORADOR */}
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">
              1. Seus Dados
            </h2>

            <div>
              <label className="text-sm font-medium mb-1 block text-slate-300">
                Nome Completo
              </label>
              <Input
                required
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-slate-300">
                  Unidade
                </label>

                <select
                  required
                  value={unidadeId}
                  onChange={(e) => setUnidadeId(e.target.value)}
                  disabled={carregandoUnidades || unidades.length === 0}
                  className="w-full h-10 rounded-md bg-slate-700 border border-slate-600 text-white px-3"
                >
                  <option value="">
                    {carregandoUnidades
                      ? "Carregando unidades..."
                      : unidades.length === 0
                        ? "Nenhuma unidade disponível"
                        : "Selecione sua unidade"}
                  </option>

                  {unidades.map((unidade) => (
                    <option key={unidade.id} value={unidade.id}>
                      {unidade.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block text-slate-300">
                  Seu WhatsApp
                </label>
                <Input
                  required
                  placeholder="(11) 99999-9999"
                  value={telefone}
                  onChange={(e) =>
                    setTelefone(formatarTelefone(e.target.value))
                  }
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* BLOCO 2: LOCALIZAÇÃO */}
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">
              2. Localização (Para Entregas)
            </h2>

            <div>
              <label className="text-sm font-medium mb-1 block text-slate-300">
                Ponto de Referência
              </label>
              <Input
                placeholder="Ex: Portão azul, em frente à praça"
                value={pontoRef}
                onChange={(e) => setPontoRef(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block text-slate-300">
                Link do Google Maps (Opcional)
              </label>
              <Input
                placeholder="https://maps.app.goo.gl/..."
                value={maps}
                onChange={(e) => setMaps(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* BLOCO 3: RECADOS */}
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">
              3. Contato de Recados
            </h2>

            <p className="text-xs text-slate-400 -mt-2">
              Caso não te encontremos, com quem falamos?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-slate-300">
                  Nome do Contato
                </label>
                <Input
                  placeholder="Ex: Maria (Esposa)"
                  value={nomeRecado}
                  onChange={(e) => setNomeRecado(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block text-slate-300">
                  Telefone de Recados
                </label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={telRecado}
                  onChange={(e) =>
                    setTelRecado(formatarTelefone(e.target.value))
                  }
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* BLOCO 4: ACESSO */}
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">
              4. Dados de Acesso
            </h2>

            <div>
              <label className="text-sm font-medium mb-1 block text-slate-300">
                E-mail
              </label>
              <Input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block text-slate-300">
                Senha
              </label>
              <Input
                type="password"
                required
                placeholder="Crie uma senha forte"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={
              loading ||
              carregandoUnidades ||
              unidades.length === 0
            }
            className="bg-blue-600 hover:bg-blue-500 text-white h-12 text-lg mt-2"
          >
            {loading ? "Criando conta..." : "Finalizar Cadastro"}
          </Button>
        </form>

        <div className="text-sm text-center text-slate-400 mt-4 pb-8">
          Já tem uma conta?{" "}
          <Link
            href="/auth/login"
            className="text-blue-400 hover:underline"
          >
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
}
