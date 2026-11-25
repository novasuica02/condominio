
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, UserCircle } from "lucide-react";
import Header from "@/components/Header";

type Unidade = {
  id: number;
  nome: string;
  tipo_unidade: string | null;
};

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

export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState("");
  const [unidadeId, setUnidadeId] = useState("");
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [podeAlterarUnidade, setPodeAlterarUnidade] = useState(false);
  const [exigeUnidade, setExigeUnidade] = useState(false);

  const [telefone, setTelefone] = useState("");
  const [maps, setMaps] = useState("");
  const [pontoRef, setPontoRef] = useState("");
  const [nomeRecado, setNomeRecado] = useState("");
  const [telRecado, setTelRecado] = useState("");

  useEffect(() => {
    async function carregarPerfil() {
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setMensagem("Usuário não autenticado.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id, nome, role, unidade, unidade_id, condominio_id, telefone, link_google_maps, ponto_referencia, nome_para_recados, telefone_recados"
          )
          .eq("id", user.id)
          .single();

        if (error) throw error;

        setNome(data.nome || "");
        setUnidade(data.unidade || "");
        setUnidadeId(
          data.unidade_id != null ? String(data.unidade_id) : ""
        );

        setTelefone(data.telefone || "");
        setMaps(data.link_google_maps || "");
        setPontoRef(data.ponto_referencia || "");
        setNomeRecado(data.nome_para_recados || "");
        setTelRecado(data.telefone_recados || "");

        // Somente moradores, síndicos e subsíndicos precisam de unidade.
        const perfilExigeUnidade = [
          "morador",
          "sindico",
          "subsindico",
        ].includes(data.role);

        setExigeUnidade(perfilExigeUnidade);

        // Prestadores não precisam de unidade residencial.
        if (!perfilExigeUnidade) {
          setPodeAlterarUnidade(false);
          setLoading(false);
          return;
        }

        // Consulta a configuração do condomínio.
        // Em caso de erro, bloqueia a alteração por segurança.
        const { data: permissao, error: erroPermissao } =
          await supabase.rpc("morador_pode_alterar_unidade");

        if (erroPermissao) {
          setPodeAlterarUnidade(false);
          setMensagem(
            "Não foi possível verificar a permissão de alteração da unidade. Solicite auxílio à administração."
          );
        } else {
          setPodeAlterarUnidade(permissao === true);
        }

        // Carrega as unidades somente quando a alteração está habilitada.
        if (!erroPermissao && permissao === true) {
          const { data: listaUnidades, error: erroUnidades } =
            await supabase
              .from("unidades")
              .select("id, nome, tipo_unidade")
              .eq("condominio_id", data.condominio_id)
              .eq("ativo", true)
              .order("nome", { ascending: true });

          if (erroUnidades) throw erroUnidades;

          setUnidades(listaUnidades || []);
        }
      } catch (error: any) {
        console.error("Erro ao carregar perfil:", error);
        setMensagem(
          "Erro ao carregar os dados: " +
            (error.message || "Tente novamente.")
        );
      }

      setLoading(false);
    }

    carregarPerfil();
  }, []);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();

    setSalvando(true);
    setMensagem(null);

    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMensagem("Usuário não autenticado.");
        setSalvando(false);
        return;
      }

      const dadosAtualizados: {
        nome: string;
        telefone: string;
        link_google_maps: string;
        ponto_referencia: string;
        nome_para_recados: string;
        telefone_recados: string;
        unidade?: string;
        unidade_id?: number;
      } = {
        nome,
        telefone,
        link_google_maps: maps,
        ponto_referencia: pontoRef,
        nome_para_recados: nomeRecado,
        telefone_recados: telRecado,
      };

      // A regra de unidade só se aplica a moradores e dirigentes.
      if (exigeUnidade) {
        if (!unidadeId) {
          setMensagem(
            podeAlterarUnidade
              ? "Selecione sua unidade antes de salvar."
              : "Sua unidade ainda não está vinculada. Solicite à administração."
          );
          setSalvando(false);
          return;
        }

        // Só atualiza o vínculo quando o condomínio permite alteração.
        if (podeAlterarUnidade) {
          const unidadeSelecionada = unidades.find(
            (item) => String(item.id) === unidadeId
          );

          if (!unidadeSelecionada) {
            setMensagem("Unidade inválida. Selecione novamente.");
            setSalvando(false);
            return;
          }

          dadosAtualizados.unidade_id = unidadeSelecionada.id;
          dadosAtualizados.unidade = unidadeSelecionada.nome;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update(dadosAtualizados)
        .eq("id", user.id);

      if (error) throw error;

      setMensagem("Dados atualizados com sucesso!");

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      setMensagem("Erro ao salvar: " + error.message);
    }

    setSalvando(false);
  };

  if (loading) {
    return (
      <div className="flex-1 w-full flex items-center justify-center bg-slate-900 min-h-screen text-slate-400">
        Carregando dados...
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center p-4 md:p-12 bg-slate-900 min-h-screen">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <Header />

        <div className="bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-700 pb-4">
            <UserCircle className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
          </div>

          {mensagem && (
            <div
              className={`p-4 mb-6 text-sm rounded-md ${
                mensagem.includes("Erro") ||
                mensagem.includes("não foi possível") ||
                mensagem.includes("Selecione") ||
                mensagem.includes("não está vinculada")
                  ? "bg-red-900/50 text-red-200 border border-red-700"
                  : "bg-green-900/50 text-green-200 border border-green-700"
              }`}
            >
              {mensagem}
            </div>
          )}

          <form onSubmit={handleSalvar} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-slate-300">
                  Nome Completo
                </label>
                <Input
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              {exigeUnidade && (
                <div>
                  <label className="text-sm font-medium mb-1 block text-slate-300">
                    Unidade
                  </label>

                  {podeAlterarUnidade ? (
                    <>
                      <select
                        required
                        value={unidadeId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setUnidadeId(id);

                          const selecionada = unidades.find(
                            (item) => String(item.id) === id
                          );

                          setUnidade(selecionada?.nome || "");
                        }}
                        className="w-full h-10 rounded-md border border-slate-600 bg-slate-700 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Selecione sua unidade</option>

                        {unidades.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.nome} —{" "}
                            {item.tipo_unidade === "lote" ? "Lote" : "Casa"}
                          </option>
                        ))}
                      </select>

                      <p className="text-xs text-slate-400 mt-1">
                        Selecione a unidade à qual você pertence.
                      </p>
                    </>
                  ) : (
                    <>
                      <Input
                        value={unidade || "Unidade não vinculada"}
                        disabled
                        className="bg-slate-700 border-slate-600 text-slate-300 disabled:opacity-100"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Para alterar sua unidade, solicite à administração.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block text-slate-300">
                Seu WhatsApp
              </label>
              <Input
                required
                value={telefone}
                onChange={(e) =>
                  setTelefone(formatarTelefone(e.target.value))
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="border-t border-slate-700 pt-4">
              <h2 className="text-sm font-semibold text-white mb-3">
                Localização (Para Entregas)
              </h2>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block text-slate-300">
                    Ponto de Referência
                  </label>
                  <Input
                    value={pontoRef}
                    onChange={(e) => setPontoRef(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block text-slate-300">
                    Link do Google Maps
                  </label>
                  <Input
                    value={maps}
                    onChange={(e) => setMaps(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <h2 className="text-sm font-semibold text-white mb-3">
                Contato de Recados
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block text-slate-300">
                    Nome do Contato
                  </label>
                  <Input
                    value={nomeRecado}
                    onChange={(e) => setNomeRecado(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block text-slate-300">
                    Telefone de Recados
                  </label>
                  <Input
                    value={telRecado}
                    onChange={(e) =>
                      setTelRecado(formatarTelefone(e.target.value))
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={salvando}
              className="bg-purple-600 hover:bg-purple-500 text-white h-11 mt-2"
            >
              {salvando ? (
                "Salvando..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
