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
    const {
        nome,
        email,
        senha_hash,
        cpf,
        foto_perfil,
        bio
    } = data;

    const sql = `insert into usuarios (nome, email, senha_hash, cpf, foto_perfil, bio) values (?, ?, ?, ?, ?, ?)`;
    const [result] = await db.execute(
        sql, [nome, email, senha_hash, cpf, foto_perfil ?? null, bio ?? null]
    );
    return result;
}