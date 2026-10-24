import { Response } from "express";

import { AuthRequest } from "../middleware/authMiddleware";
import { createPost } from "../services/postService";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const BASE64_PATTERN =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function publishPost(req: AuthRequest, res: Response) {
  const id_usuario = req.user?.id_usuario;
  if (!id_usuario) {
    return res.status(401).json({ error: "Você precisa estar logado." });
  }

  const { imagem_base64, mime_type, descricao_post } = req.body ?? {};
  if (
    typeof imagem_base64 !== "string" ||
    !imagem_base64 ||
    imagem_base64.length > Math.ceil(MAX_IMAGE_SIZE_BYTES / 3) * 4 ||
    !BASE64_PATTERN.test(imagem_base64) ||
    typeof mime_type !== "string" ||
    !ALLOWED_MIME_TYPES.has(mime_type)
  ) {
    return res.status(400).json({
      error: "Envie uma imagem JPEG, PNG ou WebP válida de até 5 MB.",
    });
  }

  if (
    descricao_post !== undefined &&
    (typeof descricao_post !== "string" || descricao_post.length > 500)
  ) {
    return res.status(400).json({
      error: "A descrição deve ter no máximo 500 caracteres.",
    });
  }

  const imagem = Buffer.from(imagem_base64, "base64");
  if (imagem.length === 0 || imagem.length > MAX_IMAGE_SIZE_BYTES) {
    return res.status(400).json({
      error: "A imagem deve ter no máximo 5 MB.",
    });
  }

  try {
    const post = await createPost({
      id_usuario,
      imagem,
      mime_type,
      descricao_post:
        typeof descricao_post === "string" && descricao_post.trim()
          ? descricao_post.trim()
          : null,
    });

    return res.status(201).json({
      message: "Post publicado com sucesso.",
      ...post,
    });
  } catch (error: unknown) {
    console.error("Erro ao salvar post:", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DATA_TOO_LONG"
    ) {
      return res.status(400).json({
        error: "A descrição ou imagem excede o limite aceito pelo banco.",
      });
    }

    return res.status(500).json({ error: "Erro ao salvar publicação." });
  }
}
