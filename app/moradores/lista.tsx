
"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  MessageCircle,
  User,
  Search,
  X,
  PawPrint,
  CarFront,
  Plus,
  Pencil,
  Trash2,
  Camera,
  Loader2,
  Calendar,
} from "lucide-react";

type Morador = {
  id: string;
  nome: string;
  unidade: string;
  unidade_id: number;
  condominio_id: number;
  telefone: string | null;
  whatsapp: string | null;
  link_google_maps: string | null;
  ponto_referencia: string | null;
  nome_para_recados: string | null;
  telefone_recados: string | null;
};

type PerfilUsuario = {
  id: string;
  role: string;
  unidade_id: number | null;
  condominio_id: number;
};

type Pet = {
  id: number;
  condominio_id: number;
  unidade_id: number;
  nome: string;
  especie: string;
  raca: string | null;
  porte: string | null;
  sexo: string | null;
  data_nascimento: string | null;
  foto_url: string | null;
  observacoes: string | null;
  foto_assinada?: string | null;
};

type Veiculo = {
  id: number;
  condominio_id: number;
  unidade_id: number;
  tipo: string;
  marca: string | null;
  modelo: string | null;
  cor: string | null;
  placa: string;
  ano: number | null;
  vaga: string | null;
  foto_url: string | null;
  observacoes: string | null;
  foto_assinada?: string | null;
};

type TipoPopup = "pets" | "veiculos";

type FormPet = {
  nome: string;
  especie: string;
  raca: string;
  porte: string;
  sexo: string;
  data_nascimento: string;
  observacoes: string;
};

type FormVeiculo = {
  tipo: string;
  marca: string;
  modelo: string;
  cor: string;
  placa: string;
  ano: string;
  vaga: string;
  observacoes: string;
};

const petVazio: FormPet = {
  nome: "",
  especie: "",
  raca: "",
  porte: "",
  sexo: "",
  data_nascimento: "",
  observacoes: "",
};

const veiculoVazio: FormVeiculo = {
  tipo: "",
  marca: "",
  modelo: "",
  cor: "",
  placa: "",
  ano: "",
  vaga: "",
  observacoes: "",
};

const BUCKET = "midia-unidades";

function normalizarWhatsApp(numero: string | null) {
  if (!numero) return "";

  let limpo = numero.replace(/\D/g, "");

  if (limpo.length === 10 || limpo.length === 11) {
    limpo = `55${limpo}`;
  }

  return limpo;
}

function caminhoFotoValido(caminho: string | null) {
  if (!caminho) return false;

  return !caminho.startsWith("http://") &&
    !caminho.startsWith("https://");
}

function PopupUnidade({
  morador,
  tipo,
  perfil,
  onClose,
  supabase,
}: {
  morador: Morador;
  tipo: TipoPopup;
  perfil: PerfilUsuario | null;
  onClose: () => void;
  supabase: ReturnType<typeof createClient>;
}) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [editando, setEditando] = useState(false);
  const [registroId, setRegistroId] = useState<number | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);

  const [formPet, setFormPet] = useState<FormPet>(petVazio);
  const [formVeiculo, setFormVeiculo] =
    useState<FormVeiculo>(veiculoVazio);

  const administrador =
    perfil?.role === "sindico" ||
    perfil?.role === "subsindico";

  const podeEditar =
    administrador ||
    (
      perfil?.role === "morador" &&
      perfil.unidade_id === morador.unidade_id &&
      perfil.condominio_id === morador.condominio_id
    );

  const titulo = tipo === "pets" ? "Pets" : "Veículos";

  async function carregarDados() {
    setLoading(true);
    setErro("");

    try {
      if (tipo === "pets") {
        const { data, error } = await supabase
          .from("pets")
          .select("*")
          .eq("condominio_id", morador.condominio_id)
          .eq("unidade_id", morador.unidade_id)
          .order("nome");

        if (error) throw error;

        const registros = (data || []) as Pet[];

        const registrosComFoto = await Promise.all(
          registros.map(async (pet) => {
            if (!caminhoFotoValido(pet.foto_url)) {
              return { ...pet, foto_assinada: null };
            }

            const { data: foto } = await supabase.storage
              .from(BUCKET)
              .createSignedUrl(pet.foto_url!, 3600);

            return {
              ...pet,
              foto_assinada: foto?.signedUrl || null,
            };
          })
        );

        setPets(registrosComFoto);
      } else {
        const { data, error } = await supabase
          .from("veiculos")
          .select("*")
          .eq("condominio_id", morador.condominio_id)
          .eq("unidade_id", morador.unidade_id)
          .order("marca");

        if (error) throw error;

        const registros = (data || []) as Veiculo[];

        const registrosComFoto = await Promise.all(
          registros.map(async (veiculo) => {
            if (!caminhoFotoValido(veiculo.foto_url)) {
              return { ...veiculo, foto_assinada: null };
            }

            const { data: foto } = await supabase.storage
              .from(BUCKET)
              .createSignedUrl(veiculo.foto_url!, 3600);

            return {
              ...veiculo,
              foto_assinada: foto?.signedUrl || null,
            };
          })
        );

        setVeiculos(registrosComFoto);
      }
    } catch (error) {
      console.error("Erro ao carregar registros:", error);
      setErro("Não foi possível carregar os registros.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, morador.unidade_id, morador.condominio_id]);

  function iniciarNovo() {
    setRegistroId(null);
    setArquivo(null);
    setErro("");
    setMensagem("");
    setFormPet(petVazio);
    setFormVeiculo(veiculoVazio);
    setEditando(true);
  }

  function editarPet(pet: Pet) {
    setRegistroId(pet.id);
    setArquivo(null);
    setErro("");
    setMensagem("");

    setFormPet({
      nome: pet.nome || "",
      especie: pet.especie || "",
      raca: pet.raca || "",
      porte: pet.porte || "",
      sexo: pet.sexo || "",
      data_nascimento: pet.data_nascimento || "",
      observacoes: pet.observacoes || "",
    });

    setEditando(true);
  }

  function editarVeiculo(veiculo: Veiculo) {
    setRegistroId(veiculo.id);
    setArquivo(null);
    setErro("");
    setMensagem("");

    setFormVeiculo({
      tipo: veiculo.tipo || "",
      marca: veiculo.marca || "",
      modelo: veiculo.modelo || "",
      cor: veiculo.cor || "",
      placa: veiculo.placa || "",
      ano: veiculo.ano?.toString() || "",
      vaga: veiculo.vaga || "",
      observacoes: veiculo.observacoes || "",
    });

    setEditando(true);
  }

  function validarArquivo(file: File | null) {
    if (!file) return null;

    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!tiposPermitidos.includes(file.type)) {
      return "Formato inválido. Utilize JPG, PNG ou WebP.";
    }

    if (file.size > 5 * 1024 * 1024) {
      return "A imagem deve ter no máximo 5 MB.";
    }

    return null;
  }

  async function salvarPet() {
    if (!formPet.nome.trim() || !formPet.especie.trim()) {
      setErro("Informe pelo menos o nome e a espécie do pet.");
      return;
    }

    setSalvando(true);
    setErro("");

    let caminhoNovo: string | null = null;

    try {
      const petExistente = pets.find((p) => p.id === registroId);

      let fotoUrl = petExistente?.foto_url || null;

      if (arquivo) {
        const erroArquivo = validarArquivo(arquivo);
        if (erroArquivo) throw new Error(erroArquivo);

        const extensao = arquivo.type === "image/png"
          ? "png"
          : arquivo.type === "image/webp"
            ? "webp"
            : "jpg";

        caminhoNovo =
          `${morador.condominio_id}/${morador.unidade_id}/pets/` +
          `${crypto.randomUUID()}.${extensao}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(caminhoNovo, arquivo, {
            contentType: arquivo.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        fotoUrl = caminhoNovo;
      }

      const dados = {
        condominio_id: morador.condominio_id,
        unidade_id: morador.unidade_id,
        nome: formPet.nome.trim(),
        especie: formPet.especie.trim(),
        raca: formPet.raca.trim() || null,
        porte: formPet.porte || null,
        sexo: formPet.sexo || null,
        data_nascimento: formPet.data_nascimento || null,
        observacoes: formPet.observacoes.trim() || null,
        foto_url: fotoUrl,
      };

      let error;

      if (registroId) {
        ({ error } = await supabase
          .from("pets")
          .update(dados)
          .eq("id", registroId)
          .eq("condominio_id", morador.condominio_id));
      } else {
        ({ error } = await supabase
          .from("pets")
          .insert(dados));
      }

      if (error) throw error;

      if (
        caminhoNovo &&
        petExistente?.foto_url &&
        caminhoFotoValido(petExistente.foto_url)
      ) {
        const { error: removeError } = await supabase.storage
          .from(BUCKET)
          .remove([petExistente.foto_url]);

        if (removeError) {
          console.error("Erro ao remover foto anterior:", removeError);
        }
      }

      setEditando(false);
      setArquivo(null);
      setMensagem("Pet salvo com sucesso!");
      await carregarDados();
    } catch (error) {
      console.error("Erro ao salvar pet:", error);

      if (caminhoNovo) {
        await supabase.storage.from(BUCKET).remove([caminhoNovo]);
      }

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o pet."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function salvarVeiculo() {
    if (!formVeiculo.tipo.trim() || !formVeiculo.placa.trim()) {
      setErro("Informe pelo menos o tipo e a placa do veículo.");
      return;
    }

    setSalvando(true);
    setErro("");

    let caminhoNovo: string | null = null;

    try {
      const veiculoExistente = veiculos.find(
        (v) => v.id === registroId
      );

      let fotoUrl = veiculoExistente?.foto_url || null;

      if (arquivo) {
        const erroArquivo = validarArquivo(arquivo);
        if (erroArquivo) throw new Error(erroArquivo);

        const extensao = arquivo.type === "image/png"
          ? "png"
          : arquivo.type === "image/webp"
            ? "webp"
            : "jpg";

        caminhoNovo =
          `${morador.condominio_id}/${morador.unidade_id}/veiculos/` +
          `${crypto.randomUUID()}.${extensao}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(caminhoNovo, arquivo, {
            contentType: arquivo.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        fotoUrl = caminhoNovo;
      }

      const anoNumero = formVeiculo.ano
        ? Number(formVeiculo.ano)
        : null;

      if (
        anoNumero !== null &&
        (!Number.isInteger(anoNumero) || anoNumero < 1900 || anoNumero > 2100)
      ) {
        throw new Error("Informe um ano válido.");
      }

      const dados = {
        condominio_id: morador.condominio_id,
        unidade_id: morador.unidade_id,
        tipo: formVeiculo.tipo.trim(),
        marca: formVeiculo.marca.trim() || null,
        modelo: formVeiculo.modelo.trim() || null,
        cor: formVeiculo.cor.trim() || null,
        placa: formVeiculo.placa.trim().toUpperCase(),
        ano: anoNumero,
        vaga: formVeiculo.vaga.trim() || null,
        observacoes: formVeiculo.observacoes.trim() || null,
        foto_url: fotoUrl,
      };

      let error;

      if (registroId) {
        ({ error } = await supabase
          .from("veiculos")
          .update(dados)
          .eq("id", registroId)
          .eq("condominio_id", morador.condominio_id));
      } else {
        ({ error } = await supabase
          .from("veiculos")
          .insert(dados));
      }

      if (error) throw error;

      if (
        caminhoNovo &&
        veiculoExistente?.foto_url &&
        caminhoFotoValido(veiculoExistente.foto_url)
      ) {
        const { error: removeError } = await supabase.storage
          .from(BUCKET)
          .remove([veiculoExistente.foto_url]);

        if (removeError) {
          console.error("Erro ao remover foto anterior:", removeError);
        }
      }

      setEditando(false);
      setArquivo(null);
      setMensagem("Veículo salvo com sucesso!");
      await carregarDados();
    } catch (error) {
      console.error("Erro ao salvar veículo:", error);

      if (caminhoNovo) {
        await supabase.storage.from(BUCKET).remove([caminhoNovo]);
      }

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o veículo."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluirPet(pet: Pet) {
    if (!window.confirm(`Deseja excluir o pet ${pet.nome}?`)) return;

    setErro("");

    try {
      const { error } = await supabase
        .from("pets")
        .delete()
        .eq("id", pet.id)
        .eq("condominio_id", morador.condominio_id);

      if (error) throw error;

      if (pet.foto_url && caminhoFotoValido(pet.foto_url)) {
        const { error: removeError } = await supabase.storage
          .from(BUCKET)
          .remove([pet.foto_url]);

        if (removeError) {
          console.error("Erro ao remover imagem:", removeError);
        }
      }

      setMensagem("Pet excluído com sucesso!");
      await carregarDados();
    } catch (error) {
      console.error(error);
      setErro("Não foi possível excluir o pet.");
    }
  }

  async function excluirVeiculo(veiculo: Veiculo) {
    if (!window.confirm(`Deseja excluir o veículo ${veiculo.placa}?`)) {
      return;
    }

    setErro("");

    try {
      const { error } = await supabase
        .from("veiculos")
        .delete()
        .eq("id", veiculo.id)
        .eq("condominio_id", morador.condominio_id);

      if (error) throw error;

      if (
        veiculo.foto_url &&
        caminhoFotoValido(veiculo.foto_url)
      ) {
        const { error: removeError } = await supabase.storage
          .from(BUCKET)
          .remove([veiculo.foto_url]);

        if (removeError) {
          console.error("Erro ao remover imagem:", removeError);
        }
      }

      setMensagem("Veículo excluído com sucesso!");
      await carregarDados();
    } catch (error) {
      console.error(error);
      setErro("Não foi possível excluir o veículo.");
    }
  }

  function campo(
    label: string,
    value: string,
    onChange: (value: string) => void,
    placeholder = "",
    type = "text"
  ) {
    return (
      <label className="flex flex-col gap-1 text-sm text-slate-200">
        {label}
        <Input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus-visible:ring-blue-500"
        />
      </label>
    );
  }

  function campoTexto(
    label: string,
    value: string,
    onChange: (value: string) => void
  ) {
    return (
      <label className="flex flex-col gap-1 text-sm text-slate-200">
        {label}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-700 bg-slate-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {tipo === "pets" ? (
              <PawPrint className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : (
              <CarFront className="w-6 h-6 text-blue-400 shrink-0" />
            )}

            <div className="min-w-0">
              <h2 className="font-bold text-lg text-white">
                {titulo} — {morador.unidade}
              </h2>
              <p className="text-xs text-slate-400 truncate">
                {morador.nome}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Fechar"
            className="!bg-transparent !text-slate-300 hover:!bg-slate-700 hover:!text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 text-slate-100">
          {erro && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/50 text-red-200 text-sm border border-red-800">
              {erro}
            </div>
          )}

          {mensagem && (
            <div className="mb-4 p-3 rounded-lg bg-green-950/50 text-green-200 text-sm border border-green-800">
              {mensagem}
            </div>
          )}

          {editando ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-white">
                  {registroId ? "Editar" : "Novo"} {tipo === "pets" ? "pet" : "veículo"}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditando(false);
                    setArquivo(null);
                    setErro("");
                  }}
                  className="!bg-slate-700 !border-slate-500 !text-white hover:!bg-slate-600 hover:!text-white"
                >
                  Cancelar
                </Button>
              </div>

              {tipo === "pets" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {campo("Nome *", formPet.nome, (v) =>
                    setFormPet((f) => ({ ...f, nome: v }))
                  )}

                  {campo("Espécie *", formPet.especie, (v) =>
                    setFormPet((f) => ({ ...f, especie: v })),
                    "Ex.: Cachorro, gato..."
                  )}

                  {campo("Raça", formPet.raca, (v) =>
                    setFormPet((f) => ({ ...f, raca: v }))
                  )}

                  <label className="flex flex-col gap-1 text-sm text-slate-200">
                    Porte
                    <select
                      value={formPet.porte}
                      onChange={(e) =>
                        setFormPet((f) => ({ ...f, porte: e.target.value }))
                      }
                      className="h-10 rounded-md border border-slate-600 bg-slate-700 px-3 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Selecione</option>
                      <option value="Pequeno">Pequeno</option>
                      <option value="Médio">Médio</option>
                      <option value="Grande">Grande</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-sm text-slate-200">
                    Sexo
                    <select
                      value={formPet.sexo}
                      onChange={(e) =>
                        setFormPet((f) => ({ ...f, sexo: e.target.value }))
                      }
                      className="h-10 rounded-md border border-slate-600 bg-slate-700 px-3 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Não informado</option>
                      <option value="Macho">Macho</option>
                      <option value="Fêmea">Fêmea</option>
                    </select>
                  </label>

                  {campo(
                    "Data de nascimento",
                    formPet.data_nascimento,
                    (v) => setFormPet((f) => ({ ...f, data_nascimento: v })),
                    "",
                    "date"
                  )}

                  <div className="sm:col-span-2">
                    {campoTexto("Observações", formPet.observacoes, (v) =>
                      setFormPet((f) => ({ ...f, observacoes: v }))
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {campo("Tipo *", formVeiculo.tipo, (v) =>
                    setFormVeiculo((f) => ({ ...f, tipo: v })),
                    "Carro, moto, bicicleta..."
                  )}

                  {campo("Marca", formVeiculo.marca, (v) =>
                    setFormVeiculo((f) => ({ ...f, marca: v }))
                  )}

                  {campo("Modelo", formVeiculo.modelo, (v) =>
                    setFormVeiculo((f) => ({ ...f, modelo: v }))
                  )}

                  {campo("Cor", formVeiculo.cor, (v) =>
                    setFormVeiculo((f) => ({ ...f, cor: v }))
                  )}

                  {campo("Placa *", formVeiculo.placa, (v) =>
                    setFormVeiculo((f) => ({ ...f, placa: v.toUpperCase() }))
                  )}

                  {campo("Ano", formVeiculo.ano, (v) =>
                    setFormVeiculo((f) => ({ ...f, ano: v })),
                    "",
                    "number"
                  )}

                  {campo("Vaga", formVeiculo.vaga, (v) =>
                    setFormVeiculo((f) => ({ ...f, vaga: v }))
                  )}

                  <div className="sm:col-span-2">
                    {campoTexto("Observações", formVeiculo.observacoes, (v) =>
                      setFormVeiculo((f) => ({ ...f, observacoes: v }))
                    )}
                  </div>
                </div>
              )}

              <div className="border border-slate-700 rounded-lg p-3 bg-slate-900/60">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
                  <span className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Foto (máximo 5 MB)
                  </span>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      const erroArquivo = validarArquivo(file);

                      if (erroArquivo) {
                        setErro(erroArquivo);
                        e.target.value = "";
                        setArquivo(null);
                        return;
                      }

                      setErro("");
                      setArquivo(file);
                    }}
                    className="text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-white hover:file:bg-slate-600"
                  />

                  <span className="text-xs text-slate-400 font-normal">
                    Formatos aceitos: JPG, PNG e WebP.
                  </span>
                </label>
              </div>

              <Button
                onClick={tipo === "pets" ? salvarPet : salvarVeiculo}
                disabled={salvando}
                className={
                  tipo === "pets"
                    ? "w-full !bg-emerald-600 hover:!bg-emerald-700 !text-white font-bold disabled:!opacity-60"
                    : "w-full !bg-blue-600 hover:!bg-blue-700 !text-white font-bold disabled:!opacity-60"
                }
              >
                {salvando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          ) : loading ? (
            <div className="py-12 flex flex-col items-center gap-3 text-slate-300">
              <Loader2 className="w-7 h-7 animate-spin" />
              Carregando {titulo.toLowerCase()}...
            </div>
          ) : tipo === "pets" ? (
            <div className="space-y-4">
              {podeEditar && (
                <Button
                  onClick={iniciarNovo}
                  className="w-full !bg-emerald-600 hover:!bg-emerald-700 !text-white font-bold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar pet
                </Button>
              )}

              {pets.length === 0 ? (
                <div className="text-center py-12 text-slate-300">
                  <PawPrint className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                  <p>Nenhum pet cadastrado nesta unidade.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pets.map((pet) => (
                    <div
                      key={pet.id}
                      className="border border-slate-700 rounded-xl overflow-hidden bg-slate-900 shadow-sm"
                    >
                      {pet.foto_assinada ? (
                        <img
                          src={pet.foto_assinada}
                          alt={pet.nome}
                          className="w-full h-44 object-cover"
                        />
                      ) : (
                        <div className="h-36 bg-emerald-950/50 flex items-center justify-center">
                          <PawPrint className="w-14 h-14 text-emerald-700" />
                        </div>
                      )}

                      <div className="p-4 space-y-2">
                        <h3 className="font-bold text-lg text-white">
                          {pet.nome}
                        </h3>

                        <p className="text-sm text-slate-300">
                          {pet.especie}
                          {pet.raca ? ` • ${pet.raca}` : ""}
                        </p>

                        <div className="flex flex-wrap gap-2 text-xs">
                          {pet.porte && (
                            <span className="bg-emerald-900/50 text-emerald-200 px-2 py-1 rounded">
                              {pet.porte}
                            </span>
                          )}
                          {pet.sexo && (
                            <span className="bg-slate-700 text-slate-200 px-2 py-1 rounded">
                              {pet.sexo}
                            </span>
                          )}
                        </div>

                        {pet.data_nascimento && (
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Nascimento: {new Date(`${pet.data_nascimento}T12:00:00`).toLocaleDateString("pt-BR")}
                          </p>
                        )}

                        {pet.observacoes && (
                          <p className="text-sm text-slate-300 whitespace-pre-wrap">
                            {pet.observacoes}
                          </p>
                        )}

                        {podeEditar && (
                          <div className="flex gap-2 pt-2 border-t border-slate-700">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 !bg-slate-700 !border-slate-500 !text-white hover:!bg-slate-600 hover:!text-white"
                              onClick={() => editarPet(pet)}
                            >
                              <Pencil className="w-4 h-4 mr-1" />
                              Editar
                            </Button>

                            <Button
                              variant="destructive"
                              size="sm"
                              className="!bg-red-600 !text-white hover:!bg-red-700"
                              onClick={() => excluirPet(pet)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {podeEditar && (
                <Button
                  onClick={iniciarNovo}
                  className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white font-bold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar veículo
                </Button>
              )}

              {veiculos.length === 0 ? (
                <div className="text-center py-12 text-slate-300">
                  <CarFront className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                  <p>Nenhum veículo cadastrado nesta unidade.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {veiculos.map((veiculo) => (
                    <div
                      key={veiculo.id}
                      className="border border-slate-700 rounded-xl overflow-hidden bg-slate-900 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row">
                        {veiculo.foto_assinada ? (
                          <img
                            src={veiculo.foto_assinada}
                            alt={`${veiculo.marca || ""} ${veiculo.modelo || ""}`}
                            className="w-full sm:w-40 h-36 object-cover"
                          />
                        ) : (
                          <div className="w-full sm:w-40 h-32 bg-blue-950/50 flex items-center justify-center">
                            <CarFront className="w-14 h-14 text-blue-700" />
                          </div>
                        )}

                        <div className="flex-1 p-4 space-y-2">
                          <h3 className="font-bold text-lg text-white">
                            {[veiculo.marca, veiculo.modelo]
                              .filter(Boolean)
                              .join(" ") || veiculo.tipo}
                          </h3>

                          <p className="text-sm text-slate-300">
                            {veiculo.tipo}
                            {veiculo.cor ? ` • ${veiculo.cor}` : ""}
                          </p>

                          <p className="font-semibold text-white">
                            Placa: {veiculo.placa}
                          </p>

                          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                            {veiculo.ano && <span>Ano: {veiculo.ano}</span>}
                            {veiculo.vaga && <span>Vaga: {veiculo.vaga}</span>}
                          </div>

                          {veiculo.observacoes && (
                            <p className="text-sm text-slate-300 whitespace-pre-wrap">
                              {veiculo.observacoes}
                            </p>
                          )}

                          {podeEditar && (
                            <div className="flex gap-2 pt-2 border-t border-slate-700">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 !bg-slate-700 !border-slate-500 !text-white hover:!bg-slate-600 hover:!text-white"
                                onClick={() => editarVeiculo(veiculo)}
                              >
                                <Pencil className="w-4 h-4 mr-1" />
                                Editar
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                className="!bg-red-600 !text-white hover:!bg-red-700"
                                onClick={() => excluirVeiculo(veiculo)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ListaMoradores() {
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [moradorSelecionado, setMoradorSelecionado] =
    useState<Morador | null>(null);

  const [perfilUsuario, setPerfilUsuario] =
    useState<PerfilUsuario | null>(null);

  const [popupUnidade, setPopupUnidade] = useState<{
    morador: Morador;
    tipo: TipoPopup;
  } | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function carregarMoradores() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const { data: perfil, error: erroPerfil } = await supabase
          .from("profiles")
          .select("id, role, unidade_id, condominio_id")
          .eq("id", user.id)
          .single();

        if (erroPerfil) throw erroPerfil;

        if (perfil) {
          setPerfilUsuario({
            id: perfil.id,
            role: perfil.role,
            unidade_id: perfil.unidade_id,
            condominio_id: perfil.condominio_id,
          });
        }

        const { data, error } = await supabase.rpc(
          "listar_moradores_condominio"
        );

        if (error) throw error;

        if (data) {
          setMoradores(data as Morador[]);
        }
      } catch (error) {
        console.error("Erro ao carregar moradores:", error);
      } finally {
        setLoading(false);
      }
    }

    carregarMoradores();
  }, [supabase]);

  const moradoresFiltrados = moradores.filter((m) =>
    `${m.nome || ""} ${m.unidade || ""}`
      .toLowerCase()
      .includes(busca.toLowerCase())
  );

  function abrirPets(morador: Morador) {
    setPopupUnidade({ morador, tipo: "pets" });
  }

  function abrirVeiculos(morador: Morador) {
    setPopupUnidade({ morador, tipo: "veiculos" });
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por nome ou unidade..."
          className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus-visible:ring-blue-500"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-300 animate-pulse">
            Carregando moradores...
          </div>
        ) : moradoresFiltrados.length === 0 ? (
          <div className="p-8 text-center text-slate-300">
            Nenhum morador encontrado.
          </div>
        ) : (
          <div className="flex flex-col">
            {moradoresFiltrados.map((morador, index) => {
              const whatsapp = normalizarWhatsApp(
                morador.whatsapp || morador.telefone
              );

              return (
                <div
                  key={morador.id}
                  className={`flex items-center justify-between gap-2 p-4 hover:bg-slate-700/70 transition-colors ${
                    index !== moradoresFiltrados.length - 1
                      ? "border-b border-slate-700"
                      : ""
                  }`}
                >
                  <div
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => setMoradorSelecionado(morador)}
                  >
                    <div className="bg-slate-700 p-2 rounded-full text-slate-300 shrink-0">
                      <User className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-white truncate">
                        {morador.nome || "Sem nome"}
                      </h3>
                      <span className="block text-base sm:text-lg font-extrabold text-white mt-1">
                        {morador.unidade || "Unidade não informada"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {whatsapp && (
                      <a
                        href={`https://wa.me/${whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-green-900/50 hover:bg-green-800 text-green-300 p-2 rounded-full transition-colors"
                        title="Chamar no WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => abrirPets(morador)}
                      disabled={!morador.unidade_id}
                      className="bg-emerald-900/50 hover:bg-emerald-800 text-emerald-300 disabled:opacity-40 p-2 rounded-full transition-colors"
                      title={`Pets de ${morador.unidade}`}
                    >
                      <PawPrint className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => abrirVeiculos(morador)}
                      disabled={!morador.unidade_id}
                      className="bg-blue-900/50 hover:bg-blue-800 text-blue-300 disabled:opacity-40 p-2 rounded-full transition-colors"
                      title={`Veículos de ${morador.unidade}`}
                    >
                      <CarFront className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


{moradorSelecionado && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
    <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">

      {/* Cabeçalho */}
      <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <User className="w-5 h-5 text-blue-400 shrink-0" />
          <h2 className="text-lg font-bold text-white truncate">
            {moradorSelecionado.nome || "Morador"}
          </h2>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMoradorSelecionado(null)}
          aria-label="Fechar"
          className="!bg-transparent !text-slate-300 hover:!bg-slate-700 hover:!text-white shrink-0"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Informações */}
      <div className="p-5 flex flex-col gap-4 overflow-y-auto text-slate-100">

        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Unidade
          </span>
          <p className="text-white font-semibold text-base mt-1">
            {moradorSelecionado.unidade || "Não informada"}
          </p>
        </div>

        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            WhatsApp / Telefone
          </span>
          <p className="text-slate-200 mt-1">
            {moradorSelecionado.whatsapp ||
              moradorSelecionado.telefone ||
              "Não informado"}
          </p>
        </div>

        {(moradorSelecionado.nome_para_recados ||
          moradorSelecionado.telefone_recados) && (
          <div className="bg-orange-950/40 p-3 rounded-lg border border-orange-800">
            <span className="text-xs font-semibold text-orange-300 uppercase tracking-wider">
              Contato de recados
            </span>

            {moradorSelecionado.nome_para_recados && (
              <p className="text-orange-100 text-sm mt-2">
                {moradorSelecionado.nome_para_recados}
              </p>
            )}

            {moradorSelecionado.telefone_recados && (
              <p className="text-orange-100 text-sm mt-1">
                {moradorSelecionado.telefone_recados}
              </p>
            )}
          </div>
        )}

        {moradorSelecionado.ponto_referencia && (
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Ponto de referência
            </span>
            <p className="text-slate-200 text-sm mt-1 whitespace-pre-wrap">
              {moradorSelecionado.ponto_referencia}
            </p>
          </div>
        )}

      </div>

      {/* Ações */}
      <div className="p-4 border-t border-slate-700 bg-slate-900 flex flex-wrap gap-2">

        {normalizarWhatsApp(
          moradorSelecionado.whatsapp ||
          moradorSelecionado.telefone
        ) && (
          <a
            href={`https://wa.me/${normalizarWhatsApp(
              moradorSelecionado.whatsapp ||
              moradorSelecionado.telefone
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 px-3 rounded-md transition-colors font-semibold text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        )}

        {moradorSelecionado.link_google_maps && (
          <a
            href={moradorSelecionado.link_google_maps}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-3 rounded-md transition-colors font-semibold text-sm"
          >
            <MapPin className="w-4 h-4" />
            Maps
          </a>
        )}

        <Button
          variant="outline"
          onClick={() => setMoradorSelecionado(null)}
          className="!bg-slate-700 !border-slate-600 !text-white hover:!bg-slate-600 hover:!text-white"
        >
          Fechar
        </Button>

      </div>
    </div>
  </div>
)}

      {popupUnidade && (
        <PopupUnidade
          morador={popupUnidade.morador}
          tipo={popupUnidade.tipo}
          perfil={perfilUsuario}
          supabase={supabase}
          onClose={() => setPopupUnidade(null)}
        />
      )}
    </div>
  );
}
