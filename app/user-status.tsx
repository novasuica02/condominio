import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export async function UserStatus() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    return (
      <Link href="/protected">
        <Button>Acessar Painel</Button>
      </Link>
    );
  }

  return (
    <Link href="/auth/login">
      <Button>Fazer Login</Button>
    </Link>
  );
}