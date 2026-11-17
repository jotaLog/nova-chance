
import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import {
  createClothes,
  getIncomingClothesExchanges,
  getFavoriteClothes,
  getMyClothes,
  getTradingClothes,
  requestClothesExchange,
  respondToClothesExchange,
  setClothesAvailability,
  setClothesFavorite,
} from "../services/clothesService";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const BASE64_PATTERN =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function getPositiveId(value: string | string[]) {
  if (Array.isArray(value)) return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function sendClothesError(error: unknown, res: Response) {
  const code = error instanceof Error ? error.message : "";
  if (code === "INVALID_IMAGE") {
    return res.status(400).json({ error: "A imagem enviada não é válida." });
  }
  if (code === "ROUPA_INDISPONIVEL") {
    return res.status(409).json({ error: "Esta roupa não está mais disponível para troca." });
  }
  if (code === "NAO_PODE_SOLICITAR_PROPRIA_ROUPA") {
    return res.status(400).json({ error: "Você não pode solicitar a própria roupa." });
  }
  if (code === "SOLICITACAO_JA_EXISTE") {
    return res.status(409).json({ error: "Você já enviou uma solicitação para esta roupa." });
  }
  if (code === "SOLICITACAO_NAO_ENCONTRADA") {
    return res.status(404).json({ error: "Solicitação não encontrada ou já respondida." });
  }
  if (code === "ROUPA_NAO_ENCONTRADA") {
    return res.status(404).json({ error: "Roupa não encontrada no seu guarda-roupa." });
  }

  console.error("Erro no feed de trocas:", error);
  return res.status(500).json({ error: "Não foi possível concluir a operação de troca." });
}

export async function registerClothes(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      id_categoria,
      id_tamanho,
      nome,
      descricao,
      imagem_url,
      marca,
      estado,
      disponivel_troca,
      imagem_base64,
      mime_type,
    } = req.body;

    const id_usuario = req.user?.id_usuario;

    if (!id_usuario) {
      return res.status(401).json({
        error: "Você precisa estar logado.",
      });
    }

    if (
      !Number.isInteger(Number(id_categoria)) ||
      Number(id_categoria) <= 0 ||
      !Number.isInteger(Number(id_tamanho)) ||
      Number(id_tamanho) <= 0 ||
      typeof nome !== "string" ||
      !nome.trim() ||
      typeof estado !== "string" ||
      !estado.trim()
    ) {
      return res.status(400).json({
        error: "Informe nome, categoria, tamanho e estado válidos.",
      });
    }

    if (imagem_base64 != null || mime_type != null) {
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

      const imageBuffer = Buffer.from(imagem_base64, "base64");
      if (imageBuffer.length === 0 || imageBuffer.length > MAX_IMAGE_SIZE_BYTES) {
        return res.status(400).json({
          error: "A imagem deve ter no máximo 5 MB.",
        });
      }
    }

    const roupa = await createClothes({
      id_usuario,
      id_categoria: Number(id_categoria),
      id_tamanho: Number(id_tamanho),
      nome: nome.trim(),
      descricao,
      imagem_url,
      marca,
      estado: estado.trim(),
      disponivel_troca: disponivel_troca === true,
      imagem_base64,
      mime_type,
    });

    return res.status(201).json({
      message: "Roupa cadastrada com sucesso!",
      roupa,
    });
  } catch (error: unknown) {
    console.error("Erro ao cadastrar roupa:", error);

    if (error instanceof Error && error.message === "INVALID_IMAGE") {
      return res.status(400).json({
        error: "A imagem enviada não é válida.",
      });
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_NO_REFERENCED_ROW_2"
    ) {
      return res.status(400).json({
        error: "Categoria ou tamanho não encontrado.",
      });
    }

    return res.status(500).json({
      error: "Erro ao cadastrar roupa.",
    });
  }
}

export async function listTradingClothes(req: AuthRequest, res: Response) {
  const id_usuario = req.user?.id_usuario;
  if (!id_usuario) {
    return res.status(401).json({ error: "Você precisa estar logado." });
  }

  try {
    return res.json(await getTradingClothes(id_usuario));
  } catch (error: unknown) {
    return sendClothesError(error, res);
  }
}

export async function listMyClothes(req: AuthRequest, res: Response) {
  const id_usuario = req.user?.id_usuario;
  if (!id_usuario) {
    return res.status(401).json({ error: "Você precisa estar logado." });
  }

  try {
    return res.json(await getMyClothes(id_usuario));
  } catch (error: unknown) {
    return sendClothesError(error, res);
  }
}

export async function listFavoriteClothes(req: AuthRequest, res: Response) {
  const id_usuario = req.user?.id_usuario;
  if (!id_usuario) {
    return res.status(401).json({ error: "Você precisa estar logado." });
  }

  try {
    return res.json(await getFavoriteClothes(id_usuario));
  } catch (error: unknown) {
    return sendClothesError(error, res);
  }
}

export async function updateClothesAvailability(
  req: AuthRequest,
  res: Response
) {
  const id_usuario = req.user?.id_usuario;
  const id_roupa = getPositiveId(req.params.id);
  const { disponivel_troca } = req.body;
  if (!id_usuario) {
    return res.status(401).json({ error: "Você precisa estar logado." });
  }
  if (!id_roupa || typeof disponivel_troca !== "boolean") {
    return res.status(400).json({ error: "Informe uma roupa e uma disponibilidade válidas." });
  }

  try {
    await setClothesAvailability(id_roupa, id_usuario, disponivel_troca);
    return res.json({ disponivel_troca });
  } catch (error: unknown) {
    return sendClothesError(error, res);
  }
}

export async function updateClothesFavorite(req: AuthRequest, res: Response) {
  const id_usuario = req.user?.id_usuario;
  const id_roupa = getPositiveId(req.params.id);
  const { favorita } = req.body;
  if (!id_usuario) {
    return res.status(401).json({ error: "Você precisa estar logado." });
  }
  if (!id_roupa || typeof favorita !== "boolean") {
    return res.status(400).json({ error: "Informe uma roupa e um estado de favorito válidos." });
  }

  try {
    await setClothesFavorite(id_roupa, id_usuario, favorita);
    return res.json({ favorita });
  } catch (error: unknown) {
    return sendClothesError(error, res);
  }
}

export async function createClothesExchange(req: AuthRequest, res: Response) {
  const id_usuario = req.user?.id_usuario;
  const id_roupa = getPositiveId(req.params.id);
  if (!id_usuario) {
    return res.status(401).json({ error: "Você precisa estar logado." });
  }
  if (!id_roupa) {
    return res.status(400).json({ error: "Roupa inválida." });
  }

  try {
    const request = await requestClothesExchange(id_roupa, id_usuario);
    return res.status(201).json({
      message: "Solicitação de troca enviada.",
      ...request,
    });
  } catch (error: unknown) {
    return sendClothesError(error, res);
  }
}

export async function listIncomingClothesExchanges(
  req: AuthRequest,
  res: Response
) {
  const id_usuario = req.user?.id_usuario;
  if (!id_usuario) {
    return res.status(401).json({ error: "Você precisa estar logado." });
  }

  try {
    return res.json(await getIncomingClothesExchanges(id_usuario));
  } catch (error: unknown) {
    return sendClothesError(error, res);
  }
}

export async function respondToExchange(req: AuthRequest, res: Response) {
  const id_usuario = req.user?.id_usuario;
  const id_troca = getPositiveId(req.params.id);
  const { status } = req.body;
  if (!id_usuario) {
    return res.status(401).json({ error: "Você precisa estar logado." });
  }
  if (!id_troca || (status !== "aceita" && status !== "recusada")) {
    return res.status(400).json({ error: "Informe uma resposta válida para a solicitação." });
  }

  try {
    await respondToClothesExchange(id_troca, id_usuario, status);
    return res.json({ message: status === "aceita" ? "Troca aceita." : "Solicitação recusada." });
  } catch (error: unknown) {
    return sendClothesError(error, res);
  }
}
