import { Request, Response } from "express";
import {
  createUser,
  getAllUsers,
  loginUser,
  getUserById as getUserByIdService,
  followUser as followUserService,
  unfollowUser as unfollowUserService,
  isFollowing as isFollowingService,
  getFollowersCount,
  getFollowingCount,
  getFollowingUsers,
} from "../services/userService";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
    const user = await loginUser(email);
    const senhaValida = await bcrypt.compare(
      senha,
      user.senha_hash
    );

    if (!senhaValida) {
      return res.status(401).json({
        error: "Senha incorreta",
      });
    }

    const token = jwt.sign(
      {
        id_usuario: user.id_usuario,
        email: user.email,
      },
      "SECRET_KEY",
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
  req: Request,
  res: Response
) {
  try {
    const idSeguido = Number(req.params.id);
    const { idSeguidor } = req.body;

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
  req: Request,
  res: Response
) {
  try {
    const idSeguido = Number(req.params.id);
    const { idSeguidor } = req.body;

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
  req: Request,
  res: Response
) {
  try {

    const idSeguido = Number(req.params.id);
    const idSeguidor = Number(req.params.idSeguidor);

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