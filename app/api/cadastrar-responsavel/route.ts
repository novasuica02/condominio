
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    // 1. Verificar usuário autenticado
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    // 2. Verificar permissão de síndico ou subsíndico
    const { data: perfil, error: perfilError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      perfilError ||
      !perfil ||
      !["sindico", "subsindico"].includes(perfil.role)
    ) {
      return NextResponse.json(
        { error: "Você não tem permissão para cadastrar responsáveis." },
        { status: 403 }
      );
    }

    // 3. Receber e validar os dados
    const body = await request.json();

    const {
      nome,
      especialidade,
      cpf_cnpj,
      telefone,
      endereco,
      email,
      senha,
      categoria_id,
    } = body;

    if (
      !nome?.trim() ||
      !email?.trim() ||
      !senha ||
      !categoria_id
    ) {
      return NextResponse.json(
        { error: "Preencha nome, e-mail, senha e categoria." },
        { status: 400 }
      );
    }

    if (senha.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    // 4. Conferir se a categoria existe e está ativa
    const { data: categoria, error: categoriaError } =
      await supabaseAdmin
        .from("categorias_responsaveis")
        .select("id")
        .eq("id", categoria_id)
        .eq("ativo", true)
        .single();

    if (categoriaError || !categoria) {
      return NextResponse.json(
        { error: "Categoria inválida ou inativa." },
        { status: 400 }
      );
    }

    // 5. Criar usuário no Supabase Auth
    const { data: authData, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: senha,
        email_confirm: true,
        user_metadata: {
          nome: nome.trim(),
          unidade: "Prestador",
        },
      });

    if (createUserError || !authData.user) {
      return NextResponse.json(
        {
          error:
            createUserError?.message ||
            "Não foi possível criar o usuário.",
        },
        { status: 400 }
      );
    }

    const usuarioId = authData.user.id;

    try {
      // 6. Atualizar perfil criado automaticamente pelo trigger
      const { error: updateProfileError } = await supabaseAdmin
        .from("profiles")
        .update({
          nome: nome.trim(),
          unidade: "Prestador",
          role: "prestador",
          email: email.trim().toLowerCase(),
          telefone: telefone?.trim() || null,
        })
        .eq("id", usuarioId);

      if (updateProfileError) {
        throw updateProfileError;
      }

      // 7. Criar cadastro do responsável
      const { error: insertError } = await supabaseAdmin
        .from("prestadores")
        .insert({
          nome: nome.trim(),
          especialidade: especialidade?.trim() || null,
          cpf_cnpj: cpf_cnpj?.trim() || null,
          telefone: telefone?.trim() || null,
          endereco: endereco?.trim() || null,
          email: email.trim().toLowerCase(),
          usuario_id: usuarioId,
          categoria_id: Number(categoria_id),
        });

      if (insertError) {
        throw insertError;
      }

      return NextResponse.json({
        success: true,
        message: "Responsável cadastrado com sucesso!",
      });
    } catch (error: any) {
      // 8. Se falhar o cadastro, excluir o usuário recém-criado
      await supabaseAdmin.auth.admin.deleteUser(usuarioId);
      throw error;
    }
  } catch (error: any) {
    console.error("Erro ao cadastrar responsável:", error);

    return NextResponse.json(
      { error: error.message || "Erro interno ao cadastrar responsável." },
      { status: 500 }
    );
  }
}
