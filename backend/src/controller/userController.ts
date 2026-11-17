import { Request, Response } from "express";
import { createHash, randomBytes } from "crypto";
import {
  createUser,
  getAllUsers,
  loginUser,
  getUserById as getUserByIdService,
  getAccountById,
  getAccountPasswordHash,
  updateAccount,
  deleteAccount,
  createPasswordResetToken,
  deletePasswordResetToken,
  consumePasswordResetToken,
  followUser as followUserService,
  unfollowUser as unfollowUserService,
  isFollowing as isFollowingService,
  getFollowersCount,
  getFollowingCount,
  getFollowingUsers,
} from "../services/userService";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middleware/authMiddleware";
import {
  assertPasswordResetEmailConfigured,
  createPasswordResetUrl,
  sendPasswordResetEmail,
} from "../services/emailService";

export async function registerUser(
  req: Request,
  res: Response
) {
  try {
    const { nome, email, senha, cpf, foto_perfil, bio } = req.body;

    const senha_hash = await bcrypt.hash(senha, 10);

    const user = await createUser({
      nome,
      email,
      senha_hash,
      cpf,
      foto_perfil,
      bio,
    });

    res.status(201).json({
      message: "Usuário registrado",
      user,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao registrar usuário",
    });
  }
}

export async function login(
  req: Request,
  res: Response
) {
  try {
    const { email, senha } = req.body;
    if (typeof email !== "string" || typeof senha !== "string" || !email.trim() || !senha) {
      return res.status(400).json({
        error: "Informe email e senha.",
      });
    }

    const user = await loginUser(email.trim());
    if (!user) {
      return res.status(401).json({
        error: "Email ou senha incorretos.",
      });
    }

    const senhaValida = await bcrypt.compare(
      senha,
      user.senha_hash
    );

    if (!senhaValida) {
      return res.status(401).json({
        error: "Email ou senha incorretos.",
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET não configurado.");
      return res.status(500).json({
        error: "Erro na configuração da autenticação.",
      });
    }

    const token = jwt.sign(
      {
        id_usuario: user.id_usuario,
        email: user.email,
      },
      secret,
      {
        expiresIn: "1d",
      }
    );
    res.json({
      message: "Login realizado",
      token,
      user: {
        id_usuario: user.id_usuario,
        nome: user.nome,
        email: user.email,
      },
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Erro no login",
    });
  }
}

export async function listUsers(
  req: Request,
  res: Response
) {
  try {
    const users = await getAllUsers();
    res.json(users);

  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Erro ao buscar usuários",
    });
  }
}

export async function getMyAccount(req: AuthRequest, res: Response) {
  const userId = req.user?.id_usuario;
  if (!userId) return res.status(401).json({ error: "Você precisa estar logado." });

  try {
    return res.json(await getAccountById(userId));
  } catch (error: unknown) {
    console.error("Erro ao carregar dados da conta:", error);
    return res.status(500).json({ error: "Não foi possível carregar sua conta." });
  }
}

export async function requestPasswordReset(req: Request, res: Response) {
  const email = req.body?.email;
  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    email.trim().length > 254
  ) {
    return res.status(400).json({ error: "Informe um email válido." });
  }

  let tokenHash: string | null = null;
  try {
    assertPasswordResetEmailConfigured();
    const token = randomBytes(32).toString("hex");
    tokenHash = createHash("sha256").update(token).digest("hex");
    const resetUrl = createPasswordResetUrl(token);
    const result = await createPasswordResetToken(email.trim(), tokenHash);

    if (result === "created") {
      try {
        await sendPasswordResetEmail(email.trim(), resetUrl);
      } catch (error: unknown) {
        await deletePasswordResetToken(tokenHash);
        throw error;
      }
    }

    return res.status(202).json({
      message: "Se o email estiver cadastrado, você receberá um link para redefinir sua senha.",
    });
  } catch (error: unknown) {
    console.error("Erro ao solicitar redefinição de senha:", error);
    return res.status(503).json({
      error: "Não foi possível enviar o email de recuperação. Tente novamente mais tarde.",
    });
  }
}

export async function resetPassword(req: Request, res: Response) {
  const token = req.body?.token;
  const password = req.body?.nova_senha;
  if (
    typeof token !== "string" ||
    !/^[a-f0-9]{64}$/i.test(token) ||
    typeof password !== "string" ||
    password.length < 6 ||
    password.length > 100
  ) {
    return res.status(400).json({
      error: "O link de recuperação é inválido ou a senha não atende aos requisitos.",
    });
  }

  try {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const passwordHash = await bcrypt.hash(password, 10);
    const updated = await consumePasswordResetToken(tokenHash, passwordHash);
    if (!updated) {
      return res.status(400).json({
        error: "O link expirou ou já foi utilizado. Solicite uma nova recuperação.",
      });
    }

    return res.json({ message: "Senha redefinida com sucesso." });
  } catch (error: unknown) {
    console.error("Erro ao redefinir senha:", error);
    return res.status(500).json({
      error: "Não foi possível redefinir sua senha. Tente novamente.",
    });
  }
}

export async function updateMyAccount(req: AuthRequest, res: Response) {
  const userId = req.user?.id_usuario;
  if (!userId) return res.status(401).json({ error: "Você precisa estar logado." });

  const {
    nome,
    email,
    cpf,
    bio,
    senha_atual,
    nova_senha,
  } = req.body ?? {};
  if (
    (nome !== undefined &&
      (typeof nome !== "string" || !nome.trim() || nome.trim().length > 100)) ||
    (email !== undefined &&
      (typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+$/.test(email.trim()) ||
        email.trim().length > 254)) ||
    (cpf !== undefined &&
      (typeof cpf !== "string" || !cpf.trim() || cpf.trim().length > 20)) ||
    (bio !== undefined && bio !== null && typeof bio !== "string") ||
    (typeof bio === "string" && bio.length > 300) ||
    (senha_atual !== undefined && typeof senha_atual !== "string") ||
    (nova_senha !== undefined && typeof nova_senha !== "string") ||
    (typeof nova_senha === "string" && nova_senha.length > 0 && nova_senha.length < 6)
  ) {
    return res.status(400).json({ error: "Confira os dados informados." });
  }
  if (
    nome === undefined &&
    email === undefined &&
    cpf === undefined &&
    bio === undefined &&
    !(typeof nova_senha === "string" && nova_senha.length > 0)
  ) {
    return res.status(400).json({ error: "Informe ao menos um dado para atualizar." });
  }

  try {
    const currentAccount = await getAccountById(userId);
    const changesSensitiveData =
      (typeof email === "string" && email.trim() !== currentAccount.email) ||
      (typeof cpf === "string" && cpf.trim() !== currentAccount.cpf) ||
      (typeof nova_senha === "string" && nova_senha.length > 0);

    let senha_hash: string | undefined;
    if (changesSensitiveData) {
      if (typeof senha_atual !== "string" || !senha_atual) {
        return res.status(400).json({
          error: "Confirme sua senha atual para alterar email, CPF ou senha.",
        });
      }
      const currentHash = await getAccountPasswordHash(userId);
      if (!currentHash || !(await bcrypt.compare(senha_atual, currentHash))) {
        return res.status(401).json({ error: "Senha atual incorreta." });
      }
      if (typeof nova_senha === "string" && nova_senha.length > 0) {
        senha_hash = await bcrypt.hash(nova_senha, 10);
      }
    }

    const user = await updateAccount(userId, {
      ...(typeof nome === "string" ? { nome: nome.trim() } : {}),
      ...(typeof email === "string" ? { email: email.trim() } : {}),
      ...(typeof cpf === "string" ? { cpf: cpf.trim() } : {}),
      ...(bio !== undefined
        ? { bio: typeof bio === "string" && bio.trim() ? bio.trim() : null }
        : {}),
      senha_hash,
    });
    return res.json({ message: "Dados atualizados.", user });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      const duplicateMessage =
        "sqlMessage" in error && typeof error.sqlMessage === "string"
          ? error.sqlMessage.toLowerCase()
          : "";
      if (duplicateMessage.includes("email")) {
        return res.status(409).json({ error: "Este email já está em uso por outra conta." });
      }
      if (duplicateMessage.includes("cpf")) {
        return res.status(409).json({ error: "Este CPF já está em uso por outra conta." });
      }
      return res.status(409).json({ error: "Email ou CPF já está em uso." });
    }
    console.error("Erro ao atualizar dados da conta:", error);
    return res.status(500).json({ error: "Não foi possível atualizar sua conta." });
  }
}

export async function deleteMyAccount(req: AuthRequest, res: Response) {
  const userId = req.user?.id_usuario;
  const password = req.body?.senha_atual;
  if (!userId) return res.status(401).json({ error: "Você precisa estar logado." });
  if (typeof password !== "string" || !password) {
    return res.status(400).json({ error: "Informe sua senha para excluir a conta." });
  }

  try {
    const passwordHash = await getAccountPasswordHash(userId);
    if (!passwordHash || !(await bcrypt.compare(password, passwordHash))) {
      return res.status(401).json({ error: "Senha atual incorreta." });
    }
    await deleteAccount(userId);
    return res.json({ message: "Conta excluída." });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "Conta não encontrada." });
    }
    if (error instanceof Error && error.message === "USER_HAS_EXCHANGES") {
      return res.status(409).json({
        error: "Não é possível excluir a conta enquanto houver trocas associadas. Finalize ou resolva as trocas primeiro.",
      });
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_ROW_IS_REFERENCED_2"
    ) {
      return res.status(409).json({
        error: "Há registros relacionados que impedem a exclusão da conta.",
      });
    }
    console.error("Erro ao excluir conta:", error);
    return res.status(500).json({ error: "Não foi possível excluir sua conta." });
  }
}

export async function getUserById(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);
    const user = await getUserByIdService(id);

    res.json(user);

  } catch {
    res.status(404).json({
      error: "Usuário não encontrado",
    });

  }
}

export async function followUser(
  req: AuthRequest,
  res: Response
) {
  try {
    const idSeguido = Number(req.params.id);
    const idSeguidor = req.user?.id_usuario;
    if (!idSeguidor) {
      return res.status(401).json({ error: "Você precisa estar logado." });
    }
    if (!Number.isInteger(idSeguido) || idSeguido <= 0 || idSeguidor === idSeguido) {
      return res.status(400).json({ error: "Usuário para seguir inválido." });
    }

    await followUserService(
      idSeguidor,
      idSeguido
    );

    res.json({
      message: "Seguindo usuário.",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Erro ao seguir.",
    });
  }
}

export async function unfollowUser(
  req: AuthRequest,
  res: Response
) {
  try {
    const idSeguido = Number(req.params.id);
    const idSeguidor = req.user?.id_usuario;
    if (!idSeguidor) {
      return res.status(401).json({ error: "Você precisa estar logado." });
    }
    if (!Number.isInteger(idSeguido) || idSeguido <= 0) {
      return res.status(400).json({ error: "Usuário inválido." });
    }

    await unfollowUserService(
      idSeguidor,
      idSeguido
    );

    res.json({
      message: "Deixou de seguir.",
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Erro.",
    });
  }
}

export async function getFollowers(
  req: Request,
  res: Response
) {
  try {
    const seguidores = await getFollowersCount(
      Number(req.params.id)
    );

    res.json({
      seguidores,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
}

export async function getFollowing(
  req: Request,
  res: Response
) {
  try {
    const seguindo = await getFollowingCount(
      Number(req.params.id)
    );

    res.json({
      seguindo,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
}

export async function checkFollowing(
  req: AuthRequest,
  res: Response
) {
  try {
    const idSeguido = Number(req.params.id);
    const idSeguidor = req.user?.id_usuario;
    if (!idSeguidor) {
      return res.status(401).json({ error: "Você precisa estar logado." });
    }
    if (!Number.isInteger(idSeguido) || idSeguido <= 0) {
      return res.status(400).json({ error: "Usuário inválido." });
    }

    const following = await isFollowingService(
      idSeguidor,
      idSeguido
    );

    res.json({
      following,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
}

export async function getFollowingUsersList(
    req: Request,
    res: Response
) {
    try {
      const users = await getFollowingUsers(
        Number(req.params.id)
      );
      res.json(users);

    } catch (error) {
      console.log(error);
      res.status(500).json({
        error: "Erro ao buscar usuários seguidos."
      });
    }
}