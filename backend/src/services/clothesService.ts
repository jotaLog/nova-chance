import { db } from "../config/database";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

interface ClothesData {
  id_usuario: number;
  id_categoria: number;
  id_tamanho: number;
  nome: string;
  descricao?: string | null;
  imagem_url?: string | null;
  marca?: string | null;
  estado: string;
  disponivel_troca: boolean;
  imagem_base64?: string | null;
  mime_type?: string | null;
}

interface TradingClothesRow extends RowDataPacket {
  id_roupa: number;
  id_usuario: number;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  marca: string | null;
  estado: string | null;
  categoria: string | null;
  tamanho: string | null;
  nome_usuario: string;
  foto_perfil: string | null;
  favorita: number;
  total_interesses: number;
}

interface ExchangeRow extends RowDataPacket {
  id_troca: number;
  id_roupa_solicitada: number;
  nome_roupa: string;
  imagem_url: string | null;
  nome_solicitante: string;
  foto_perfil: string | null;
  mensagem_proposta: string | null;
  data_criacao: Date | string;
}

export const clothesUploadsDirectory = path.resolve(
  __dirname,
  "../../uploads/clothes"
);

async function columnExists(table: string, column: string) {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

export async function initializeClothesTables() {
  if (!(await columnExists("roupas", "id_usuario"))) {
    await db.query(`
      ALTER TABLE roupas
      ADD COLUMN id_usuario INT NULL,
      ADD CONSTRAINT fk_roupa_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
    `);
  }

  if (!(await columnExists("roupas", "estado"))) {
    await db.query("ALTER TABLE roupas ADD COLUMN estado VARCHAR(50) NULL");
  }

  if (!(await columnExists("roupas", "disponivel_troca"))) {
    await db.query(
      "ALTER TABLE roupas ADD COLUMN disponivel_troca TINYINT(1) NOT NULL DEFAULT 0"
    );
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS favoritos (
      id_favorito INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      id_usuario INT NOT NULL,
      id_roupa INT NOT NULL,
      data_adicionado DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_favorito_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT fk_favorito_roupa
        FOREIGN KEY (id_roupa) REFERENCES roupas(id_roupa)
        ON UPDATE CASCADE ON DELETE CASCADE,
      UNIQUE KEY uq_favorito_usuario_roupa (id_usuario, id_roupa)
    )
  `);
  if (await columnExists("roupas_favoritas", "id_roupa")) {
    await db.query(`
      INSERT IGNORE INTO favoritos (id_usuario, id_roupa, data_adicionado)
      SELECT id_usuario, id_roupa, data_criacao FROM roupas_favoritas
    `);
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS trocas (
      id_troca INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      id_solicitante INT NOT NULL,
      id_destinatario INT NOT NULL,
      id_roupa_solicitada INT NULL,
      mensagem_proposta TEXT,
      status_troca ENUM('pendente', 'aceita', 'recusada', 'cancelada', 'concluida')
        DEFAULT 'pendente',
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_conclusao DATETIME NULL,
      CONSTRAINT fk_troca_solicitante
        FOREIGN KEY (id_solicitante) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE RESTRICT,
      CONSTRAINT fk_troca_destinatario
        FOREIGN KEY (id_destinatario) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE RESTRICT,
      CONSTRAINT fk_troca_roupa_solicitada
        FOREIGN KEY (id_roupa_solicitada) REFERENCES roupas(id_roupa)
        ON UPDATE CASCADE ON DELETE RESTRICT
    )
  `);

  if (!(await columnExists("trocas", "id_roupa_solicitada"))) {
    await db.query(`
      ALTER TABLE trocas
      ADD COLUMN id_roupa_solicitada INT NULL,
      ADD CONSTRAINT fk_troca_roupa_solicitada
        FOREIGN KEY (id_roupa_solicitada)
        REFERENCES roupas(id_roupa)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
    `);
  }
}

export async function createClothes(data: ClothesData) {
  const {
    id_usuario, id_categoria, id_tamanho, nome, descricao, marca, estado,
    disponivel_troca,
  } = data;
  const extensionByMimeType: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };
  let imagem_url = data.imagem_url ?? null;
  let imagePath: string | null = null;
  if (data.imagem_base64) {
    const extension = data.mime_type ? extensionByMimeType[data.mime_type] : null;
    if (!extension || !/^[A-Za-z0-9+/]+={0,2}$/.test(data.imagem_base64)) {
      throw new Error("INVALID_IMAGE");
    }

    await mkdir(clothesUploadsDirectory, { recursive: true });
    const filename = `${randomUUID()}${extension}`;
    imagePath = path.join(clothesUploadsDirectory, filename);
    imagem_url = `/uploads/clothes/${filename}`;
    await writeFile(imagePath, Buffer.from(data.imagem_base64, "base64"), {
      flag: "wx",
    });
  }

  const sql = `
    INSERT INTO roupas
      (id_usuario, id_categoria, id_tamanho, nome, descricao, imagem_url, marca, estado, disponivel_troca)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    const [result] = await db.execute<ResultSetHeader>(sql, [
      id_usuario, id_categoria, id_tamanho, nome, descricao ?? null, imagem_url, marca ?? null, estado,
      disponivel_troca,
    ]);

    return {
      id_roupa: result.insertId,
      id_usuario,
      id_categoria,
      id_tamanho,
      nome,
      descricao: descricao ?? null,
      imagem_url,
      marca: data.marca ?? null,
      estado,
      disponivel_troca,
    };
  } catch (error: unknown) {
    if (imagePath) {
      try {
        await unlink(imagePath);
      } catch (cleanupError: unknown) {
        console.error("Não foi possível remover imagem de roupa não salva:", cleanupError);
      }
    }
    throw error;
  }
}

export async function getTradingClothes(id_usuario: number) {
  const [rows] = await db.execute<TradingClothesRow[]>(
    `
      SELECT
        r.id_roupa,
        r.id_usuario,
        r.nome,
        r.descricao,
        r.imagem_url,
        r.marca,
        r.estado,
        c.nome AS categoria,
        t.nome AS tamanho,
        u.nome AS nome_usuario,
        u.foto_perfil,
        EXISTS(
          SELECT 1 FROM favoritos rf
          WHERE rf.id_roupa = r.id_roupa AND rf.id_usuario = ?
        ) AS favorita,
        (
          SELECT COUNT(*) FROM favoritos rf
          WHERE rf.id_roupa = r.id_roupa
        ) AS total_interesses
      FROM roupas r
      INNER JOIN usuarios u ON u.id_usuario = r.id_usuario
      LEFT JOIN categorias c ON c.id_categoria = r.id_categoria
      LEFT JOIN tamanhos t ON t.id_tamanho = r.id_tamanho
      WHERE r.disponivel_troca = 1 AND r.id_usuario <> ?
      ORDER BY r.id_roupa DESC
    `,
    [id_usuario, id_usuario]
  );
  return rows;
}

export async function getMyClothes(id_usuario: number) {
  const [rows] = await db.execute<TradingClothesRow[]>(
    `SELECT
       r.id_roupa,
       r.id_usuario,
       r.nome,
       r.descricao,
       r.imagem_url,
       r.marca,
       r.estado,
       c.nome AS categoria,
       t.nome AS tamanho,
       u.nome AS nome_usuario,
       u.foto_perfil,
       0 AS favorita,
       (
         SELECT COUNT(*) FROM favoritos rf
         WHERE rf.id_roupa = r.id_roupa
       ) AS total_interesses,
       r.disponivel_troca
     FROM roupas r
     INNER JOIN usuarios u ON u.id_usuario = r.id_usuario
     LEFT JOIN categorias c ON c.id_categoria = r.id_categoria
     LEFT JOIN tamanhos t ON t.id_tamanho = r.id_tamanho
     WHERE r.id_usuario = ?
     ORDER BY r.id_roupa DESC`,
    [id_usuario]
  );
  return rows;
}

export async function getFavoriteClothes(id_usuario: number) {
  const [rows] = await db.execute<TradingClothesRow[]>(
    `SELECT
       r.id_roupa,
       r.id_usuario,
       r.nome,
       r.descricao,
       r.imagem_url,
       r.marca,
       r.estado,
       c.nome AS categoria,
       t.nome AS tamanho,
       u.nome AS nome_usuario,
       u.foto_perfil,
       1 AS favorita,
       (
         SELECT COUNT(*) FROM favoritos rf
         WHERE rf.id_roupa = r.id_roupa
       ) AS total_interesses
     FROM favoritos saved
     INNER JOIN roupas r ON r.id_roupa = saved.id_roupa
     INNER JOIN usuarios u ON u.id_usuario = r.id_usuario
     LEFT JOIN categorias c ON c.id_categoria = r.id_categoria
     LEFT JOIN tamanhos t ON t.id_tamanho = r.id_tamanho
     WHERE saved.id_usuario = ?
     ORDER BY saved.data_adicionado DESC, r.id_roupa DESC`,
    [id_usuario]
  );
  return rows;
}

export async function setClothesAvailability(
  id_roupa: number,
  id_usuario: number,
  disponivel_troca: boolean
) {
  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE roupas
     SET disponivel_troca = ?
     WHERE id_roupa = ? AND id_usuario = ?`,
    [disponivel_troca, id_roupa, id_usuario]
  );
  if (result.affectedRows === 0) {
    throw new Error("ROUPA_NAO_ENCONTRADA");
  }
}

export async function setClothesFavorite(
  id_roupa: number,
  id_usuario: number,
  favorita: boolean
) {
  const [clothes] = await db.execute<RowDataPacket[]>(
    "SELECT id_roupa FROM roupas WHERE id_roupa = ? AND disponivel_troca = 1 AND id_usuario <> ?",
    [id_roupa, id_usuario]
  );
  if (clothes.length === 0) {
    throw new Error("ROUPA_INDISPONIVEL");
  }

  if (favorita) {
    await db.execute(
      "INSERT IGNORE INTO favoritos (id_usuario, id_roupa) VALUES (?, ?)",
      [id_usuario, id_roupa]
    );
  } else {
    await db.execute(
      "DELETE FROM favoritos WHERE id_roupa = ? AND id_usuario = ?",
      [id_roupa, id_usuario]
    );
  }
}

export async function requestClothesExchange(
  id_roupa: number,
  id_solicitante: number
) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [clothes] = await connection.execute<RowDataPacket[]>(
      `SELECT id_usuario, nome
       FROM roupas
       WHERE id_roupa = ? AND disponivel_troca = 1
       FOR UPDATE`,
      [id_roupa]
    );
    const clothing = clothes[0];
    if (!clothing) throw new Error("ROUPA_INDISPONIVEL");
    if (Number(clothing.id_usuario) === id_solicitante) {
      throw new Error("NAO_PODE_SOLICITAR_PROPRIA_ROUPA");
    }

    const [existing] = await connection.execute<RowDataPacket[]>(
      `SELECT id_troca
       FROM trocas
       WHERE id_roupa_solicitada = ?
         AND id_solicitante = ?
         AND status_troca = 'pendente'
       LIMIT 1`,
      [id_roupa, id_solicitante]
    );
    if (existing.length > 0) throw new Error("SOLICITACAO_JA_EXISTE");

    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO trocas
        (id_solicitante, id_destinatario, id_roupa_solicitada, mensagem_proposta)
       VALUES (?, ?, ?, ?)`,
      [
        id_solicitante,
        clothing.id_usuario,
        id_roupa,
        `Tenho interesse na roupa: ${clothing.nome}`,
      ]
    );
    await connection.commit();
    return { id_troca: result.insertId };
  } catch (error: unknown) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getIncomingClothesExchanges(id_usuario: number) {
  const [rows] = await db.execute<ExchangeRow[]>(
    `SELECT
       tr.id_troca,
       tr.id_roupa_solicitada,
       r.nome AS nome_roupa,
       r.imagem_url,
       u.nome AS nome_solicitante,
       u.foto_perfil,
       tr.mensagem_proposta,
       tr.data_criacao
     FROM trocas tr
     INNER JOIN roupas r ON r.id_roupa = tr.id_roupa_solicitada
     INNER JOIN usuarios u ON u.id_usuario = tr.id_solicitante
     WHERE tr.id_destinatario = ? AND tr.status_troca = 'pendente'
     ORDER BY tr.data_criacao DESC, tr.id_troca DESC`,
    [id_usuario]
  );
  return rows;
}

export async function respondToClothesExchange(
  id_troca: number,
  id_destinatario: number,
  status: "aceita" | "recusada"
) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [requests] = await connection.execute<RowDataPacket[]>(
      `SELECT id_roupa_solicitada
       FROM trocas
       WHERE id_troca = ? AND id_destinatario = ? AND status_troca = 'pendente'
       FOR UPDATE`,
      [id_troca, id_destinatario]
    );
    const request = requests[0];
    if (!request) throw new Error("SOLICITACAO_NAO_ENCONTRADA");

    if (status === "aceita") {
      const [clothes] = await connection.execute<RowDataPacket[]>(
        `SELECT disponivel_troca
         FROM roupas
         WHERE id_roupa = ?
         FOR UPDATE`,
        [request.id_roupa_solicitada]
      );
      if (!clothes[0] || Number(clothes[0].disponivel_troca) !== 1) {
        throw new Error("ROUPA_INDISPONIVEL");
      }

      await connection.execute(
        "UPDATE roupas SET disponivel_troca = 0 WHERE id_roupa = ?",
        [request.id_roupa_solicitada]
      );
      await connection.execute(
        `UPDATE trocas
         SET status_troca = 'recusada'
         WHERE id_roupa_solicitada = ? AND status_troca = 'pendente' AND id_troca <> ?`,
        [request.id_roupa_solicitada, id_troca]
      );
    }

    await connection.execute(
      "UPDATE trocas SET status_troca = ? WHERE id_troca = ?",
      [status, id_troca]
    );
    await connection.commit();
  } catch (error: unknown) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
