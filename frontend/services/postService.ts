import { api } from "./api";
import { getToken } from "./storage";

interface PublishPostData {
  imagemBase64: string;
  mimeType: string;
  description: string;
}

export async function publishPost(data: PublishPostData) {
  const token = await getToken();
  if (!token) {
    throw new Error("Você precisa estar logado para publicar um post.");
  }

  const response = await api.post(
    "/posts",
    {
      imagem_base64: data.imagemBase64,
      mime_type: data.mimeType,
      descricao_post: data.description,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data as { id_post: number; message: string };
}
