import { RowDataPacket } from "mysql2";
import { unlink } from "fs/promises";
import path from "path";
import { db } from "../config/database";
import { clothesUploadsDirectory } from "./clothesService";
import { postUploadsDirectory } from "./postService";


interface UserData {
    nome: string;
    email: string;
    senha_hash: string;
    cpf: string;
    foto_perfil?: string;
    bio?: string;
}


export async function createUser(data: UserData) {
    const { nome, email, senha_hash, cpf, foto_perfil, bio } = data;

    const sql = `insert into usuarios (nome, email, senha_hash, cpf, foto_perfil, bio) values (?, ?, ?, ?, ?, ?)`;
    const [result] = await db.execute(
        sql, [nome, email, senha_hash, cpf, foto_perfil ?? null, bio ?? null]
    );
    return result;
}

export async function loginUser(
    email:string
){

const sql = `SELECT * FROM usuarios WHERE email = ?`;

const [rows]:any = await db.execute(
    sql,
    [email]
);

return rows[0] ?? null;
}

export async function getAllUsers() {
    const sql = `SELECT id_usuario, nome, foto_perfil FROM usuarios ORDER BY nome`;

    const [rows] = await db.execute(sql);
    return rows;
}

export async function getUserById(id: number) {
    const sql = `SELECT id_usuario, nome, email, foto_perfil, bio FROM usuarios WHERE id_usuario = ?`;
    const [rows]: any = await db.execute(sql,[id]);

    if(rows.length === 0){
        throw new Error("Usuário não encontrado");
    }
    return rows[0];
}

export async function getAccountById(id: number) {
    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT id_usuario, nome, email, cpf, foto_perfil, bio
         FROM usuarios WHERE id_usuario = ?`,
        [id]
    );
    if (rows.length === 0) {
        throw new Error("USER_NOT_FOUND");
    }
    return rows[0];
}

export async function getAccountPasswordHash(id: number) {
    const [rows] = await db.execute<RowDataPacket[]>(
        "SELECT senha_hash FROM usuarios WHERE id_usuario = ?",
        [id]
    );
    return rows[0]?.senha_hash as string | undefined;
}

export interface UpdateAccountData {
    nome?: string;
    email?: string;
    cpf?: string;
    bio?: string | null;
    senha_hash?: string;
}

export async function updateAccount(id: number, data: UpdateAccountData) {
    const assignments: string[] = [];
    const values: (string | null)[] = [];

    if (data.nome !== undefined) {
        assignments.push("nome = ?");
        values.push(data.nome);
    }
    if (data.email !== undefined) {
        assignments.push("email = ?");
        values.push(data.email);
    }
    if (data.cpf !== undefined) {
        assignments.push("cpf = ?");
        values.push(data.cpf);
    }
    if (data.bio !== undefined) {
        assignments.push("bio = ?");
        values.push(data.bio);
    }
    if (data.senha_hash) {
        assignments.push("senha_hash = ?");
        values.push(data.senha_hash);
    }
    if (assignments.length === 0) {
        throw new Error("NO_ACCOUNT_FIELDS");
    }

    await db.execute(
        `UPDATE usuarios SET ${assignments.join(", ")} WHERE id_usuario = ?`,
        [...values, id]
    );
    return getAccountById(id);
}

export async function initializePasswordResetTable() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id_reset BIGINT AUTO_INCREMENT PRIMARY KEY,
            id_usuario INT NOT NULL,
            token_hash CHAR(64) NOT NULL UNIQUE,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_password_reset_user
                FOREIGN KEY (id_usuario)
                REFERENCES usuarios(id_usuario)
                ON UPDATE CASCADE
                ON DELETE CASCADE,
            INDEX idx_password_reset_user_created (id_usuario, created_at)
        ) ENGINE=InnoDB
    `);
}

export async function createPasswordResetToken(
    email: string,
    tokenHash: string
): Promise<"created" | "not_found" | "throttled"> {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [users] = await connection.execute<RowDataPacket[]>(
            `SELECT id_usuario FROM usuarios
             WHERE LOWER(email) = LOWER(?) LIMIT 1 FOR UPDATE`,
            [email]
        );
        if (users.length === 0) {
            await connection.commit();
            return "not_found";
        }

        const userId = Number(users[0].id_usuario);
        const [recentRequests] = await connection.execute<RowDataPacket[]>(
            `SELECT id_reset FROM password_reset_tokens
             WHERE id_usuario = ?
               AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)
             LIMIT 1`,
            [userId]
        );
        if (recentRequests.length > 0) {
            await connection.commit();
            return "throttled";
        }

        await connection.execute(
            "DELETE FROM password_reset_tokens WHERE id_usuario = ?",
            [userId]
        );
        await connection.execute(
            `INSERT INTO password_reset_tokens (id_usuario, token_hash, expires_at)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))`,
            [userId, tokenHash]
        );
        await connection.commit();
        return "created";
    } catch (error: unknown) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function deletePasswordResetToken(tokenHash: string) {
    await db.execute(
        "DELETE FROM password_reset_tokens WHERE token_hash = ?",
        [tokenHash]
    );
}

export async function consumePasswordResetToken(
    tokenHash: string,
    passwordHash: string
) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [tokens] = await connection.execute<RowDataPacket[]>(
            `SELECT id_usuario FROM password_reset_tokens
             WHERE token_hash = ? AND expires_at > NOW()
             LIMIT 1 FOR UPDATE`,
            [tokenHash]
        );
        if (tokens.length === 0) {
            await connection.rollback();
            return false;
        }

        const userId = Number(tokens[0].id_usuario);
        await connection.execute(
            "UPDATE usuarios SET senha_hash = ? WHERE id_usuario = ?",
            [passwordHash, userId]
        );
        await connection.execute(
            "DELETE FROM password_reset_tokens WHERE id_usuario = ?",
            [userId]
        );
        await connection.commit();
        return true;
    } catch (error: unknown) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function tableExists(
    connection: Awaited<ReturnType<typeof db.getConnection>>,
    tableName: string
) {
    const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT 1 FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
        [tableName]
    );
    return rows.length > 0;
}

export async function deleteAccount(id: number) {
    const connection = await db.getConnection();
    const uploadedFiles: Array<{ url: string; directory: string; prefix: string }> = [];
    try {
        await connection.beginTransaction();
        const [users] = await connection.execute<RowDataPacket[]>(
            "SELECT id_usuario FROM usuarios WHERE id_usuario = ? FOR UPDATE",
            [id]
        );
        if (users.length === 0) {
            throw new Error("USER_NOT_FOUND");
        }

        if (await tableExists(connection, "trocas")) {
            const [exchanges] = await connection.execute<RowDataPacket[]>(
                `SELECT id_troca FROM trocas
                 WHERE id_solicitante = ? OR id_destinatario = ? LIMIT 1`,
                [id, id]
            );
            if (exchanges.length > 0) {
                throw new Error("USER_HAS_EXCHANGES");
            }
        }

        if (
            (await tableExists(connection, "troca_itens")) &&
            (await tableExists(connection, "guarda_roupa_usuario"))
        ) {
            const [exchangeItems] = await connection.execute<RowDataPacket[]>(
                `SELECT ti.id_troca_item
                 FROM troca_itens ti
                 INNER JOIN guarda_roupa_usuario g ON g.id_guarda = ti.id_item_guarda
                 WHERE ti.id_usuario = ? OR g.id_usuario = ?
                 LIMIT 1`,
                [id, id]
            );
            if (exchangeItems.length > 0) {
                throw new Error("USER_HAS_EXCHANGES");
            }
        }

        const deleteOwnedRows = async (
            table: string,
            condition: string,
            parameters: number[]
        ) => {
            if (await tableExists(connection, table)) {
                await connection.execute(
                    `DELETE FROM ${table} WHERE ${condition}`,
                    parameters
                );
            }
        };

        if (await tableExists(connection, "posts")) {
            const [posts] = await connection.execute<RowDataPacket[]>(
                "SELECT imagem_url FROM posts WHERE id_usuario = ? AND imagem_url IS NOT NULL",
                [id]
            );
            posts.forEach((post) => {
                if (typeof post.imagem_url === "string") {
                    uploadedFiles.push({
                        url: post.imagem_url,
                        directory: postUploadsDirectory,
                        prefix: "/uploads/posts/",
                    });
                }
            });
        }
        if (await tableExists(connection, "roupas")) {
            const [clothes] = await connection.execute<RowDataPacket[]>(
                "SELECT imagem_url FROM roupas WHERE id_usuario = ? AND imagem_url IS NOT NULL",
                [id]
            );
            clothes.forEach((clothing) => {
                if (typeof clothing.imagem_url === "string") {
                    uploadedFiles.push({
                        url: clothing.imagem_url,
                        directory: clothesUploadsDirectory,
                        prefix: "/uploads/clothes/",
                    });
                }
            });
        }

        await deleteOwnedRows("troca_itens", "id_usuario = ?", [id]);
        await deleteOwnedRows("guarda_roupa_usuario", "id_usuario = ?", [id]);
        await deleteOwnedRows("seguidores", "id_seguidor = ? OR id_seguido = ?", [id, id]);
        await deleteOwnedRows("mensagens", "id_remetente = ? OR id_destinatario = ?", [id, id]);
        await deleteOwnedRows("comentarios", "id_usuario = ?", [id]);
        await deleteOwnedRows("curtidas", "id_usuario = ?", [id]);
        await deleteOwnedRows("posts_salvos", "id_usuario = ?", [id]);
        await deleteOwnedRows("favoritos", "id_usuario = ?", [id]);
        await deleteOwnedRows("roupas_favoritas", "id_usuario = ?", [id]);
        await deleteOwnedRows("posts", "id_usuario = ?", [id]);
        await deleteOwnedRows("roupas", "id_usuario = ?", [id]);

        await connection.execute("DELETE FROM usuarios WHERE id_usuario = ?", [id]);
        await connection.commit();

        for (const uploadedFile of uploadedFiles) {
            if (!uploadedFile.url.startsWith(uploadedFile.prefix)) continue;
            const filename = path.basename(uploadedFile.url);
            if (
                !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/i.test(filename)
            ) {
                continue;
            }
            const filePath = path.resolve(uploadedFile.directory, filename);
            if (path.dirname(filePath) !== uploadedFile.directory) continue;
            try {
                const [references] = await db.execute<RowDataPacket[]>(
                    `SELECT 1 FROM posts WHERE imagem_url = ?
                     UNION ALL
                     SELECT 1 FROM roupas WHERE imagem_url = ?
                     LIMIT 1`,
                    [uploadedFile.url, uploadedFile.url]
                );
                if (references.length > 0) continue;
                await unlink(filePath);
            } catch (error: unknown) {
                if (
                    typeof error === "object" &&
                    error !== null &&
                    "code" in error &&
                    error.code === "ENOENT"
                ) {
                    continue;
                }
                console.error("Não foi possível remover mídia da conta excluída:", error);
            }
        }
    } catch (error: unknown) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
export async function followUser(
    idSeguidor: number,
    idSeguido: number
) {

    const sql = `
        INSERT IGNORE INTO seguidores
        (id_seguidor, id_seguido)
        VALUES (?, ?)
    `;

    await db.execute(sql, [
        idSeguidor,
        idSeguido
    ]);
}

export async function unfollowUser(
    idSeguidor: number,
    idSeguido: number
) {

    const sql = `
        DELETE FROM seguidores
        WHERE id_seguidor = ?
        AND id_seguido = ?
    `;

    await db.execute(sql, [
        idSeguidor,
        idSeguido
    ]);
}

export async function isFollowing(
    idSeguidor: number,
    idSeguido: number
) {

    const sql = `
        SELECT *
        FROM seguidores
        WHERE id_seguidor = ?
        AND id_seguido = ?
    `;

    const [rows]: any = await db.execute(sql, [
        idSeguidor,
        idSeguido
    ]);

    return rows.length > 0;
}

export async function getFollowersCount(
    idUsuario: number
) {

    const sql = `
        SELECT COUNT(*) AS total
        FROM seguidores
        WHERE id_seguido = ?
    `;

    const [rows]: any = await db.execute(sql, [
        idUsuario
    ]);

    return rows[0].total;
}

export async function getFollowingCount(
    idUsuario: number
) {

    const sql = `
        SELECT COUNT(*) AS total
        FROM seguidores
        WHERE id_seguidor = ?
    `;

    const [rows]: any = await db.execute(sql, [
        idUsuario
    ]);

    return rows[0].total;
}

export async function getFollowingUsers(
    idUsuario: number
) {

    const sql = `SELECT u.id_usuario, u.nome, u.foto_perfil FROM seguidores s INNER JOIN usuarios u ON u.id_usuario = s.id_seguido WHERE s.id_seguidor = ? ORDER BY u.nome`;

    const [rows] = await db.execute(
        sql,
        [idUsuario]
    );

    return rows;
}