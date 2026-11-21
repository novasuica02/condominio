
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, Building2, HelpCircle, BookOpen } from "lucide-react";

interface HeaderProps {
  showBackButton?: boolean;
  backUrl?: string;
  backText?: string;
}

export default function Header({
  showBackButton = true,
  backUrl = "/protected",
  backText = "Menu",
}: HeaderProps) {
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [config, setConfig] = useState<any>(null);
  const [role, setRole] = useState("");

  useEffect(() => {
    async function carregarDados() {
      const supabase = createClient();

      // Identifica o usuário logado
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Busca o perfil e o condomínio do usuário
      const { data: profile } = await supabase
        .from("profiles")
        .select("nome, email, role, condominio_id")
        .eq("id", user.id)
        .single();

      if (profile) {
        setNomeUsuario(
          profile.nome || profile.email || user.email || "Usuário"
        );

        setRole(profile.role || "");

        // Busca somente a configuração do condomínio do usuário
        const { data: cfg } = await supabase
          .from("condominio_config")
          .select("*")
          .eq("condominio_id", profile.condominio_id)
          .maybeSingle();

        if (cfg) {
          setConfig(cfg);
        }
      }
    }

    carregarDados();
  }, []);

  const isAdmin = role === "sindico" || role === "subsindico";

  return (
    <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm w-full mb-6">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Link href={backUrl}>
            <Button
              variant="outline"
              className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white h-8 px-3 text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> {backText}
            </Button>
          </Link>
        )}

        <div className="flex items-center gap-2">
          {config?.logo_url ? (
            <img
              src={config.logo_url}
              alt="Logo"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="bg-blue-600 p-1.5 rounded-md text-white">
              <Building2 className="w-5 h-5" />
            </div>
          )}

          <span className="font-bold text-white hidden sm:block">
            {config?.nome || "Condomínio"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-xs text-slate-400 hidden sm:block">
          {nomeUsuario}
        </span>

        {/* Ajuda geral */}
        {role !== "" && (
          <Link href="/ajuda">
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white px-2 sm:px-3"
            >
              <HelpCircle className="w-4 h-4 sm:mr-2" />
              <span>Ajuda</span>
            </Button>
          </Link>
        )}

        {/* Manual administrativo */}
        {isAdmin && (
          <Link href="/ajuda/sindico">
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white px-2 sm:px-3"
            >
              <BookOpen className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Manual do Síndico</span>
              <span className="sm:hidden">Manual</span>
            </Button>
          </Link>
        )}

        {/* Sair */}
        <form action="/auth/logout" method="post">
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
