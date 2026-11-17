import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { ResultSetHeader, RowDataPacket } from "mysql2";

import { db } from "../config/database";

export interface CreatePostData {
  id_usuario: number;
  imagem: Buffer;
  mime_type: string;
  descricao_post?: string | null;
}

interface FeedPostRow extends RowDataPacket {
  id_post: number;
  id_usuario: number;
  nome: string;
  foto_perfil: string | null;
  descricao_post: string | null;
  imagem_url: string | null;
  data_postagem: Date | string;
  curtidas: number;
  comentarios: number;
  curtido: number;
  salvo: number;
  seguindo: number;
}

export interface PostCommentRow extends RowDataPacket {
  id_comentario: number;
  id_usuario: number;
  nome_usuario: string;
  foto_perfil: string | null;
  comentario: string;
  data_comentario: Date | string;
}

export const postUploadsDirectory = path.resolve(
  __dirname,
  "../../uploads/posts"
);

async function postColumnExists(column: string) {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'posts' AND COLUMN_NAME = ?
     LIMIT 1`,
    [column]
  );
  return rows.length > 0;
}

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
  if (!(await postColumnExists("descricao_post"))) {
    await db.query("ALTER TABLE posts ADD COLUMN descricao_post TEXT NULL");
  }
  if (await postColumnExists("conteudo")) {
    await db.query(
      "UPDATE posts SET descricao_post = conteudo WHERE descricao_post IS NULL AND conteudo IS NOT NULL"
    );
  }
  await db.query(`
    CREATE TABLE IF NOT EXISTS posts_salvos (
      id_post INT NOT NULL,
      id_usuario INT NOT NULL,
      data_salvamento DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id_post, id_usuario),
      CONSTRAINT fk_post_salvo_post
        FOREIGN KEY (id_post)
        REFERENCES posts(id_post)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
      CONSTRAINT fk_post_salvo_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS comentarios (
      id_comentario INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      id_post INT NOT NULL,
      id_usuario INT NOT NULL,
      comentario TEXT NOT NULL,
      data_comentario DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_comentario_post
        FOREIGN KEY (id_post) REFERENCES posts(id_post)
        ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT fk_comentario_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE CASCADE
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS curtidas (
      id_curtida INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      id_post INT NOT NULL,
      id_usuario INT NOT NULL,
      data_curtida DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_curtida_post
        FOREIGN KEY (id_post) REFERENCES posts(id_post)
        ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT fk_curtida_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE CASCADE,
      UNIQUE KEY uq_curtida_post_usuario (id_post, id_usuario)
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

async function getPosts(
  id_usuario: number,
  joinClause = "",
  whereClause = "",
  extraParams: number[] = []
) {
  const [rows] = await db.execute<FeedPostRow[]>(
    `
      SELECT
        p.id_post,
        p.id_usuario,
        u.nome,
        u.foto_perfil,
        p.descricao_post,
        p.imagem_url,
        p.data_postagem,
        (
          SELECT COUNT(*)
          FROM curtidas c
          WHERE c.id_post = p.id_post
        ) AS curtidas,
        (
          SELECT COUNT(*)
          FROM comentarios cm
          WHERE cm.id_post = p.id_post
        ) AS comentarios,
        EXISTS(
          SELECT 1
          FROM curtidas c
          WHERE c.id_post = p.id_post AND c.id_usuario = ?
        ) AS curtido,
        EXISTS(
          SELECT 1
          FROM posts_salvos ps
          WHERE ps.id_post = p.id_post AND ps.id_usuario = ?
        ) AS salvo,
        EXISTS(
          SELECT 1
          FROM seguidores s
          WHERE s.id_seguidor = ? AND s.id_seguido = p.id_usuario
        ) AS seguindo
      FROM posts p
      INNER JOIN usuarios u ON u.id_usuario = p.id_usuario
      ${joinClause}
      ${whereClause}
      ORDER BY p.data_postagem DESC, p.id_post DESC
    `,
    [id_usuario, id_usuario, id_usuario, ...extraParams]
  );

  return rows;
}

export async function getFeedPosts(id_usuario: number) {
  return getPosts(id_usuario);
}

export async function getUserPosts(viewerId: number, profileId: number) {
  return getPosts(viewerId, "", "WHERE p.id_usuario = ?", [profileId]);
}

export async function getSavedPosts(id_usuario: number) {
  return getPosts(
    id_usuario,
    "INNER JOIN posts_salvos ps ON ps.id_post = p.id_post AND ps.id_usuario = ?",
    "",
    [id_usuario]
  );
}

export async function setPostLike(
  id_post: number,
  id_usuario: number,
  curtido: boolean
) {
  const connection = await db.getConnection();
  const lockName = `post-like:${id_post}:${id_usuario}`;
  let lockAcquired = false;

  try {
    const [lockRows] = await connection.query<RowDataPacket[]>(
      "SELECT GET_LOCK(?, 5) AS acquired",
      [lockName]
    );
    lockAcquired = Number(lockRows[0]?.acquired) === 1;

    if (!lockAcquired) {
      throw new Error("Não foi possível atualizar a curtida agora.");
    }

    if (curtido) {
      const [existingLikes] = await connection.execute<RowDataPacket[]>(
        "SELECT id_curtida FROM curtidas WHERE id_post = ? AND id_usuario = ? LIMIT 1",
        [id_post, id_usuario]
      );
      if (existingLikes.length === 0) {
        await connection.execute(
          "INSERT INTO curtidas (id_post, id_usuario) VALUES (?, ?)",
          [id_post, id_usuario]
        );
      }
    } else {
      await connection.execute(
        "DELETE FROM curtidas WHERE id_post = ? AND id_usuario = ?",
        [id_post, id_usuario]
      );
    }
  } finally {
    if (lockAcquired) {
      await connection.query("SELECT RELEASE_LOCK(?)", [lockName]);
    }
    connection.release();
  }
}

export async function setPostSaved(
  id_post: number,
  id_usuario: number,
  salvo: boolean
) {
  if (salvo) {
    await db.execute(
      "INSERT IGNORE INTO posts_salvos (id_post, id_usuario) VALUES (?, ?)",
      [id_post, id_usuario]
    );
  } else {
    await db.execute(
      "DELETE FROM posts_salvos WHERE id_post = ? AND id_usuario = ?",
      [id_post, id_usuario]
    );
  }
}

export async function getPostComments(id_post: number) {
  const [rows] = await db.execute<PostCommentRow[]>(
    `
      SELECT
        c.id_comentario,
        c.id_usuario,
        u.nome AS nome_usuario,
        u.foto_perfil,
        c.comentario,
        c.data_comentario
      FROM comentarios c
      INNER JOIN usuarios u ON u.id_usuario = c.id_usuario
      WHERE c.id_post = ?
      ORDER BY c.data_comentario ASC, c.id_comentario ASC
    `,
    [id_post]
  );

  return rows;
}

export async function createPostComment(
  id_post: number,
  id_usuario: number,
  comentario: string
) {
  const [result] = await db.execute<ResultSetHeader>(
    "INSERT INTO comentarios (id_post, id_usuario, comentario) VALUES (?, ?, ?)",
    [id_post, id_usuario, comentario]
  );

  return { id_comentario: result.insertId };
}
