
import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { createClothes } from "../services/clothesService";

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

    const roupa = await createClothes({
      id_usuario,
      id_categoria: Number(id_categoria),
      id_tamanho: Number(id_tamanho),
      nome: nome.trim(),
      descricao,
      imagem_url,
      marca,
      estado: estado.trim(),
    });

    return res.status(201).json({
      message: "Roupa cadastrada com sucesso!",
      roupa,
    });
  } catch (error: any) {
    console.error("Erro ao cadastrar roupa:", error);

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        error: "Categoria ou tamanho não encontrado.",
      });
    }

    return res.status(500).json({
      error: "Erro ao cadastrar roupa.",
    });
  }
}
