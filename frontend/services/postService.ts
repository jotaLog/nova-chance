import { api } from "./api";
import { followUser, unfollowUser } from "./authService";
import { getToken } from "./storage";

interface PublishPostData {
  imagemBase64: string;
  mimeType: string;
  description: string;
}

interface FeedPostResponse {
  id_post: number;
  id_usuario: number;
  nome_usuario: string;
  foto_perfil: string | null;
  descricao_post: string | null;
  imagem_url: string | null;
  curtidas: number;
  comentarios: number;
  curtido: boolean;
  salvo: boolean;
  seguindo: boolean;
}

export interface FeedPost {
  id: number;
  idUsuario: number;
  nomeUsuario: string;
  fotoPerfil: string | null;
  imagem: string | null;
  legenda: string;
  curtidas: number;
  comentarios: number;
  curtido: boolean;
  salvo: boolean;
  seguindo: boolean;
}

export interface PostComment {
  id_comentario: number;
  id_usuario: number;
  nome_usuario: string;
  foto_perfil: string | null;
  comentario: string;
  data_comentario: string;
}

async function getPostAuthHeaders() {
  const token = await getToken();
  if (!token) {
    throw new Error("Você precisa estar logado para interagir com o feed.");
  }

  return { Authorization: `Bearer ${token}` };
}

export async function getFeedPosts(): Promise<FeedPost[]> {
  const response = await api.get<FeedPostResponse[]>("/posts", {
    headers: await getPostAuthHeaders(),
  });

  return response.data.map(mapFeedPost);
}

export async function setPostLike(id: number, curtido: boolean) {
  await api.put(
    `/posts/${id}/like`,
    { curtido },
    { headers: await getPostAuthHeaders() }
  );
}

export async function setPostSaved(id: number, salvo: boolean) {
  await api.put(
    `/posts/${id}/save`,
    { salvo },
    { headers: await getPostAuthHeaders() }
  );
}

export async function setUserFollowed(idUsuario: number, seguindo: boolean) {
  if (seguindo) {
    await followUser(idUsuario, 0);
  } else {
    await unfollowUser(idUsuario, 0);
  }
}

export async function getPostComments(id: number): Promise<PostComment[]> {
  const response = await api.get<PostComment[]>(`/posts/${id}/comments`, {
    headers: await getPostAuthHeaders(),
  });

  return response.data;
}

export async function getUserPosts(idUsuario: number): Promise<FeedPost[]> {
  const response = await api.get<FeedPostResponse[]>(`/posts/user/${idUsuario}`, {
    headers: await getPostAuthHeaders(),
  });
  return response.data.map(mapFeedPost);
}

export async function getSavedPosts(): Promise<FeedPost[]> {
  const response = await api.get<FeedPostResponse[]>("/posts/saved", {
    headers: await getPostAuthHeaders(),
  });
  return response.data.map(mapFeedPost);
}

function mapFeedPost(post: FeedPostResponse): FeedPost {
  return {
    id: post.id_post,
    idUsuario: post.id_usuario,
    nomeUsuario: post.nome_usuario,
    fotoPerfil: post.foto_perfil,
    imagem: post.imagem_url,
    legenda: post.descricao_post ?? "",
    curtidas: post.curtidas,
    comentarios: post.comentarios,
    curtido: post.curtido,
    salvo: post.salvo,
    seguindo: post.seguindo,
  };
}

export async function addPostComment(id: number, comentario: string) {
  const response = await api.post<{ id_comentario: number }>(
    `/posts/${id}/comments`,
    { comentario },
    { headers: await getPostAuthHeaders() }
  );

  return response.data;
}

export async function publishPost(data: PublishPostData) {
  const response = await api.post(
    "/posts",
    {
      imagem_base64: data.imagemBase64,
      mime_type: data.mimeType,
      descricao_post: data.description,
    },
    {
      headers: await getPostAuthHeaders(),
    }
  );

  return response.data as { id_post: number; message: string };
}
