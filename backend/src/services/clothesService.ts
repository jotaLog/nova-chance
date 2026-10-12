import { db } from "../config/database";

interface ClothesData {
  id_usuario: number;
  id_categoria: number;
  id_tamanho: number;
  nome: string;
  descricao?: string | null;
  imagem_url?: string | null;
  marca?: string | null;
  estado: string;
}

export async function createClothes(data: ClothesData) {
  const {
    id_usuario, id_categoria, id_tamanho, nome, descricao, imagem_url, marca, estado,
  } = data;

  const sql = `
    INSERT INTO roupas (id_usuario, id_categoria, id_tamanho, nome, descricao, imagem_url, marca, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result]: any = await db.execute(sql, [
    id_usuario, id_categoria, id_tamanho, nome, descricao ?? null, imagem_url ?? null, marca ?? null, estado,
  ]);

  return {
    id_roupa: result.insertId,
    ...data,
  };
}
