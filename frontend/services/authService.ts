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

export async function getUsers() {
  const response = await api.get("/users");
  return response.data;
}

export async function getUserProfile(id:number){
    const response = await api.get(`/users/${id}`);
    return response.data;
}

export async function followUser(idSeguido: number, idSeguidor: number) {
  const response = await api.post(`/users/${idSeguido}/follow`, {
    idSeguidor,
  });

  return response.data;
}

export async function unfollowUser(idSeguido: number, idSeguidor: number) {
  const response = await api.delete(`/users/${idSeguido}/follow`, {
    data: {
      idSeguidor,
    },
  });

  return response.data;
}

export async function checkFollowing(idSeguido: number, idSeguidor: number) {
  const response = await api.get(
    `/users/${idSeguido}/is-following/${idSeguidor}`
  );

  return response.data.following;
}

export async function getFollowers(id: number) {
  const response = await api.get(`/users/${id}/followers`);
  return response.data;
}

export async function getFollowing(id: number) {
    const response = await api.get(
        `/users/${id}/following`
    );
    return response.data;
}

export async function getFollowingUsers(id: number) {
  const response = await api.get(
    `/users/${id}/following/list`
  );
  return response.data;
}