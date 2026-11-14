import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // O acesso deve ser DIRETO, sem ?. ou process.env["..."]
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Verificação de segurança (Fail-Fast)
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL ou Key não encontradas no cliente.");
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}