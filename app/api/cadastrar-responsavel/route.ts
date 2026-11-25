
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  let usuarioId: string | null = null;
  let token: string | null = null;

  try {
    // 1. Verificar usuário autenticado.
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

    // 2. Buscar perfil e condomínio do administrador.
    const { data: perfil, error: perfilError } = await supabase
      .from("profiles")
      .select("role, condominio_id")
      .eq("id", user.id)
      .single();

    if (
      perfilError ||
      !perfil ||
      !["sindico", "subsindico"].includes(perfil.role) ||
      !perfil.condominio_id
    ) {
      return NextResponse.json(
        { error: "Você não tem permissão para cadastrar responsáveis." },
        { status: 403 }
      );
    }

    // O condomínio sempre vem do perfil autenticado.
    const condominioId = perfil.condominio_id;

    // 3. Receber e validar os dados.
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Os dados enviados são inválidos." },
        { status: 400 }
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Os dados enviados são inválidos." },
        { status: 400 }
      );
    }

    const dados = body as Record<string, unknown>;

    const {
      nome,
      especialidade,
      cpf_cnpj,
      telefone,
      whatsapp,
      endereco,
      email,
      senha,
      categoria_id,
    } = dados;

    if (
      typeof nome !== "string" ||
      !nome.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof senha !== "string" ||
      senha.length < 6 ||
      categoria_id == null ||
      categoria_id === ""
    ) {
      return NextResponse.json(
        { error: "Preencha nome, e-mail, senha e categoria corretamente." },
        { status: 400 }
      );
    }

    // Validar os campos opcionais antes de utilizar trim().
    const camposOpcionais = [
      especialidade,
      cpf_cnpj,
      telefone,
      whatsapp,
      endereco,
    ];

    if (
      camposOpcionais.some(
        (campo) => campo != null && typeof campo !== "string"
      )
    ) {
      return NextResponse.json(
        { error: "Um ou mais campos opcionais possuem formato inválido." },
        { status: 400 }
      );
    }

    const nomeNormalizado = nome.trim();
    const emailNormalizado = email.trim().toLowerCase();

    const especialidadeNormalizada =
      typeof especialidade === "string"
        ? especialidade.trim() || null
        : null;

    const cpfCnpjNormalizado =
      typeof cpf_cnpj === "string"
        ? cpf_cnpj.trim() || null
        : null;

    const telefoneNormalizado =
      typeof telefone === "string"
        ? telefone.trim() || null
        : null;

    const whatsappNormalizado =
      typeof whatsapp === "string"
        ? whatsapp.trim() || null
        : null;

    const enderecoNormalizado =
      typeof endereco === "string"
        ? endereco.trim() || null
        : null;

    const categoriaId = Number(categoria_id);

    if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
      return NextResponse.json(
        { error: "Categoria inválida." },
        { status: 400 }
      );
    }

    // 4. Conferir se a categoria pertence ao condomínio
    // do administrador e está ativa.
    const { data: categoria, error: categoriaError } =
      await supabaseAdmin
        .from("categorias_responsaveis")
        .select("id")
        .eq("id", categoriaId)
        .eq("condominio_id", condominioId)
        .eq("ativo", true)
        .maybeSingle();

    if (categoriaError || !categoria) {
      return NextResponse.json(
        { error: "Categoria inválida ou inativa neste condomínio." },
        { status: 400 }
      );
    }

    // 5. Criar autorização temporária exclusiva
    // para este e-mail e condomínio.
    token = randomUUID();

    const { error: autorizacaoError } = await supabaseAdmin
      .from("cadastro_autorizacoes_prestadores")
      .insert({
        token,
        condominio_id: condominioId,
        email: emailNormalizado,
        criado_por: user.id,
        expira_em: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

    if (autorizacaoError) {
      throw autorizacaoError;
    }

    // 6. Criar usuário no Supabase Auth.
    // O trigger handle_new_user() consumirá a autorização
    // e criará o perfil como prestador no condomínio correto.
    const { data: authData, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email: emailNormalizado,
        password: senha,
        email_confirm: true,
        user_metadata: {
          nome: nomeNormalizado,
          telefone: telefoneNormalizado,
          cadastro_prestador_token: token,
        },
      });

    if (createUserError || !authData.user) {
      throw new Error(
        createUserError?.message ||
          "Não foi possível criar o usuário."
      );
    }

    usuarioId = authData.user.id;

    // 7. Criar cadastro do prestador no mesmo condomínio.
    const { error: insertError } = await supabaseAdmin
      .from("prestadores")
      .insert({
        nome: nomeNormalizado,
        especialidade: especialidadeNormalizada,
        cpf_cnpj: cpfCnpjNormalizado,
        telefone: telefoneNormalizado,
        whatsapp: whatsappNormalizado,
        endereco: enderecoNormalizado,
        email: emailNormalizado,
        usuario_id: usuarioId,
        categoria_id: categoriaId,
        condominio_id: condominioId,
      });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      message: "Responsável cadastrado com sucesso!",
    });

  } catch (error: unknown) {
    console.error("Erro ao cadastrar responsável:", error);

    // Se o usuário chegou a ser criado, remove seu acesso.
    if (usuarioId) {
      const { error: deleteError } =
        await supabaseAdmin.auth.admin.deleteUser(usuarioId);

      if (deleteError) {
        console.error(
          "Erro ao excluir usuário após falha:",
          deleteError
        );
      }
    }

    // Remove autorização caso ainda não tenha sido consumida.
    if (token) {
      const { error: authorizationDeleteError } =
        await supabaseAdmin
          .from("cadastro_autorizacoes_prestadores")
          .delete()
          .eq("token", token);

      if (authorizationDeleteError) {
        console.error(
          "Erro ao excluir autorização temporária:",
          authorizationDeleteError
        );
      }
    }

    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro interno ao cadastrar responsável.";

    return NextResponse.json(
      { error: mensagem },
      { status: 500 }
    );
  }
}
