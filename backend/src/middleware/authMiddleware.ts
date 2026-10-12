import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface TokenPayload {
  id_usuario: number;
  email: string;
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        error: "Você precisa estar logado.",
      });
    }

    const [type, token] = authorization.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({
        error: "Token inválido.",
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET não configurado.");
      return res.status(500).json({
        error: "Erro na configuração da autenticação.",
      });
    }

    const decoded = jwt.verify(token, secret) as TokenPayload;

    req.user = decoded;

    next();
  } catch {
    return res.status(401).json({
      error: "Sessão inválida ou expirada. Faça login novamente.",
    });
  }
}