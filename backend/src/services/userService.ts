import { db } from "../config/database";


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

if(rows.length === 0){
    throw new Error("Usuário não encontrado");
}
return rows[0];
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
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
export async function followUser(
    idSeguidor: number,
    idSeguido: number
) {

    const sql = `
        INSERT INTO seguidores
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