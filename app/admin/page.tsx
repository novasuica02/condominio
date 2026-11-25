
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import {
  Building2,
  Users,
  Layers,
  Clock,
  CalendarCheck,
  CalendarDays,
  Wrench,
  Settings,
  Megaphone,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

const opcoesGestao = [
  {
    titulo: "Condomínio",
    descricao: "Dados e informações do condomínio",
    href: "/admin/condominio",
    icone: Building2,
  },
  {
    titulo: "Moradores",
    descricao: "Gerenciar moradores e cargos",
    href: "/admin/moradores",
    icone: Users,
  },
  {
    titulo: "Áreas Comuns",
    descricao: "Cadastrar e gerenciar áreas comuns",
    href: "/admin/areas-comuns",
    icone: Layers,
  },
  {
    titulo: "Horários e Períodos",
    descricao: "Configurar horários e períodos de utilização",
    href: "/admin/periodos",
    icone: Clock,
  },
  {
    titulo: "Reservas",
    descricao: "Acompanhar e administrar reservas",
    href: "/admin/reservas",
    icone: CalendarCheck,
  },
  {
    titulo: "Agenda",
    descricao: "Visualizar eventos e atividades do condomínio",
    href: "/admin/agenda",
    icone: CalendarDays,
  },
  {
    titulo: "Prestadores",
    descricao: "Gerenciar prestadores de serviços",
    href: "/prestadores",
    icone: Wrench,
  },
  {
    titulo: "Avisos e Comunicados",
    descricao: "Publicar avisos e comunicados",
    href: "/admin/comunicados",
    icone: Megaphone,
  },
  {
    titulo: "Configurações Gerais",
    descricao: "Configurações e regras do condomínio",
    href: "/admin/configuracoes",
    icone: Settings,
  },
];

export default function AdminPage() {
  return (
    <Suspense fallback={<CarregandoGestao />}>
      <AdminConteudo />
    </Suspense>
  );
}

function CarregandoGestao() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-300">
      Carregando gestão do condomínio...
    </div>
  );
}

async function AdminConteudo() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role, condominio_id")
    .eq("id", user.id)
    .single();

  if (!perfil || !["sindico", "subsindico"].includes(perfil.role)) {
    redirect("/protected");
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center p-4 md:p-12 bg-slate-900 min-h-screen">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <Header />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
              <ShieldAlert size={23} />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white leading-tight">
                Gestão do Condomínio
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Administração e configurações do condomínio
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 min-[560px]:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
          {opcoesGestao.map((opcao) => {
            const Icone = opcao.icone;

            return (
              <Link
                key={opcao.href}
                href={opcao.href}
                className="group relative min-w-0 bg-slate-800 border border-slate-700 rounded-xl p-3 sm:p-4 hover:border-blue-500/60 hover:bg-slate-800/80 transition-all"
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                    <Icone size={20} />
                  </div>

                  <ChevronRight
                    size={17}
                    className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0"
                  />
                </div>

                <h2 className="text-sm sm:text-base font-semibold mt-3 mb-1.5 leading-snug text-white">
                  {opcao.titulo}
                </h2>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {opcao.descricao}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
