import { api } from "./api";

interface RegisterData {
    nome:string;
    email:string;
    senha:string;
    cpf:string;
    foto_perfil?:string | null;
    bio?:string | null;
}

interface LoginData {
    email:string;
    senha:string;
}

export async function registerUser(data:RegisterData){
    const response = await api.post(
        "/users/register",
        data
    );
    return response.data;
}

export async function login(data:LoginData){
    const response = await api.post(
        "/users/login",
        data
    );
    return response.data;
}