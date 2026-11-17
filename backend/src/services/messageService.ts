import { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "../config/database";

export interface MessageRow extends RowDataPacket {
  id_mensagem: number;
  id_remetente: number;
  id_destinatario: number;
  mensagem: string;
  data_envio: Date | string;
  lida: number;
}

export async function initializeMessagesTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS mensagens (
      id_mensagem INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      id_remetente INT NOT NULL,
      id_destinatario INT NOT NULL,
      mensagem TEXT NOT NULL,
      data_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
      lida BOOLEAN DEFAULT FALSE,
      CONSTRAINT fk_mensagem_remetente
        FOREIGN KEY (id_remetente) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT fk_mensagem_destinatario
        FOREIGN KEY (id_destinatario) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE CASCADE,
      INDEX idx_mensagens_conversa (id_remetente, id_destinatario, id_mensagem)
    )
  `);
}

export async function createMessage(
  senderId: number,
  recipientId: number,
  content: string
) {
  const [recipients] = await db.execute<RowDataPacket[]>(
    "SELECT id_usuario FROM usuarios WHERE id_usuario = ? LIMIT 1",
    [recipientId]
  );
  if (recipients.length === 0) {
    throw new Error("DESTINATARIO_NAO_ENCONTRADO");
  }

  const [result] = await db.execute<ResultSetHeader>(
    "INSERT INTO mensagens (id_remetente, id_destinatario, mensagem) VALUES (?, ?, ?)",
    [senderId, recipientId, content]
  );
  const [rows] = await db.execute<MessageRow[]>(
    `SELECT id_mensagem, id_remetente, id_destinatario, mensagem, data_envio, lida
     FROM mensagens WHERE id_mensagem = ?`,
    [result.insertId]
  );
  return rows[0];
}

export async function getConversation(userId: number, otherUserId: number) {
  const [rows] = await db.execute<MessageRow[]>(
    `SELECT id_mensagem, id_remetente, id_destinatario, mensagem, data_envio, lida
     FROM mensagens
     WHERE (id_remetente = ? AND id_destinatario = ?)
        OR (id_remetente = ? AND id_destinatario = ?)
     ORDER BY id_mensagem ASC`,
    [userId, otherUserId, otherUserId, userId]
  );

  await db.execute(
    `UPDATE mensagens SET lida = TRUE
     WHERE id_remetente = ? AND id_destinatario = ? AND lida = FALSE`,
    [otherUserId, userId]
  );
  return rows;
}

export async function getConversations(userId: number) {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT
       u.id_usuario,
       u.nome,
       u.foto_perfil,
       latest.mensagem AS ultima_mensagem,
       latest.data_envio AS data_envio,
       (
         SELECT COUNT(*) FROM mensagens unread
         WHERE unread.id_remetente = u.id_usuario
           AND unread.id_destinatario = ?
           AND unread.lida = FALSE
       ) AS nao_lidas
     FROM (
       SELECT
         CASE WHEN id_remetente = ? THEN id_destinatario ELSE id_remetente END AS other_id,
         MAX(id_mensagem) AS latest_id
       FROM mensagens
       WHERE id_remetente = ? OR id_destinatario = ?
       GROUP BY other_id
     ) conversations
     INNER JOIN mensagens latest ON latest.id_mensagem = conversations.latest_id
     INNER JOIN usuarios u ON u.id_usuario = conversations.other_id
     ORDER BY latest.id_mensagem DESC`,
    [userId, userId, userId, userId]
  );
  return rows;
}
