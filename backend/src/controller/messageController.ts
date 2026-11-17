import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { getConversation, getConversations } from "../services/messageService";

export async function listConversations(req: AuthRequest, res: Response) {
  const userId = req.user?.id_usuario;
  if (!userId) return res.status(401).json({ error: "Você precisa estar logado." });

  try {
    return res.json(await getConversations(userId));
  } catch (error: unknown) {
    console.error("Erro ao carregar conversas:", error);
    return res.status(500).json({ error: "Não foi possível carregar as conversas." });
  }
}

export async function listConversationMessages(req: AuthRequest, res: Response) {
  const userId = req.user?.id_usuario;
  const otherUserId = Number(req.params.id);
  if (!userId) return res.status(401).json({ error: "Você precisa estar logado." });
  if (!Number.isInteger(otherUserId) || otherUserId <= 0 || otherUserId === userId) {
    return res.status(400).json({ error: "Usuário inválido." });
  }

  try {
    return res.json(await getConversation(userId, otherUserId));
  } catch (error: unknown) {
    console.error("Erro ao carregar mensagens:", error);
    return res.status(500).json({ error: "Não foi possível carregar as mensagens." });
  }
}
