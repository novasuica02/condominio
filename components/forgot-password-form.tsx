
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
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const supabase = createClient();

    setIsLoading(true);
    setError(null);

    try {
      const baseUrl =
        process.env.NODE_ENV === "production"
          ? "https://ns.sotoyotas.com.br"
          : window.location.origin;

      const redirectTo = `${baseUrl}/auth/update-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo }
      );

      if (error) throw error;

      setSuccess(true);
    } catch (error: unknown) {
      console.error("Erro na recuperação de senha:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível solicitar a recuperação da senha."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Confira seu e-mail
            </CardTitle>
            <CardDescription>
              Enviamos as instruções para redefinir sua senha.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Caso exista uma conta cadastrada com este endereço,
                você receberá um e-mail com o link para criar uma nova senha.
              </p>

              <p className="break-all text-sm font-medium">{email}</p>

              <p className="text-sm text-muted-foreground">
                Se não encontrar a mensagem, confira também a pasta de spam.
              </p>

              <Link
                href="/auth/login"
                className="block text-center text-sm underline underline-offset-4"
              >
                Voltar para o login
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Recuperar senha
            </CardTitle>
            <CardDescription>
              Informe seu e-mail cadastrado para receber o link
              de redefinição da senha.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleForgotPassword}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail cadastrado</Label>

                  <Input
                    id="email"
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Enviando..."
                    : "Enviar link de recuperação"}
                </Button>
              </div>

              <div className="mt-4 text-center text-sm">
                <Link
                  href="/auth/login"
                  className="underline underline-offset-4"
                >
                  Voltar para o login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
