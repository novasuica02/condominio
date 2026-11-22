
"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleUpdatePassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem. Confira e tente novamente.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      router.replace("/protected");
      router.refresh();
    } catch (error: unknown) {
      console.error("Erro ao atualizar senha:", error);

      setError(
        "Não foi possível atualizar sua senha. Solicite um novo link de recuperação e tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Criar nova senha
          </CardTitle>

          <CardDescription>
            Escolha uma nova senha para acessar o aplicativo Nova Suíça 02.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleUpdatePassword}>
            <div className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label htmlFor="password">
                  Nova senha
                </Label>

                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua nova senha"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirm-password">
                  Confirmar nova senha
                </Label>

                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Digite novamente sua nova senha"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {error && (
                <p className="rounded-lg border border-red-800 bg-red-950/30 p-3 text-sm text-red-300">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading
                  ? "Salvando nova senha..."
                  : "Salvar nova senha"}
              </Button>

              <div className="text-center text-sm">
                <Link
                  href="/auth/login"
                  className="text-muted-foreground underline underline-offset-4 hover:text-white"
                >
                  Voltar para o login
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
