import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { ResultSetHeader } from "mysql2";

import { db } from "../config/database";

export interface CreatePostData {
  id_usuario: number;
  imagem: Buffer;
  mime_type: string;
  descricao_post?: string | null;
}

export const postUploadsDirectory = path.resolve(
  __dirname,
  "../../uploads/posts"
);

export async function initializePostsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id_post INT NOT NULL AUTO_INCREMENT,
      id_usuario INT NOT NULL,
      PRIMARY KEY (id_post),
      conteudo TEXT,
      descricao_post TEXT,
      imagem_url VARCHAR(500),
      data_postagem DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_post_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    )
  `);
}

export async function createPost(data: CreatePostData) {
  const extensionByMimeType: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };
  const extension = extensionByMimeType[data.mime_type];
  if (!extension) {
    throw new Error("Tipo de imagem não suportado.");
  }

  await mkdir(postUploadsDirectory, { recursive: true });
  const filename = `${randomUUID()}${extension}`;
  const imagePath = path.join(postUploadsDirectory, filename);
  const imagem_url = `/uploads/posts/${filename}`;

  await writeFile(imagePath, data.imagem, { flag: "wx" });

  try {
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO posts (id_usuario, descricao_post, imagem_url) VALUES (?, ?, ?)`,
      [data.id_usuario, data.descricao_post ?? null, imagem_url]
    );

    return { id_post: result.insertId, imagem_url };
  } catch (error: unknown) {
    try {
      await unlink(imagePath);
    } catch (cleanupError: unknown) {
      console.error("Não foi possível remover imagem de post não salvo:", cleanupError);
    }
    throw error;
  }
}
