import AsyncStorage from "@react-native-async-storage/async-storage";

import type { PostData } from "@/components/cards/postCard";

const POSTS_KEY = "@NovaChance:posts";

function isPostData(value: unknown): value is PostData {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const post = value as Record<string, unknown>;
  return (
    typeof post.id === "number" &&
    typeof post.nomeUsuario === "string" &&
    (typeof post.imagem === "string" || post.imagem === null)
  );
}

export async function getPublishedPosts(): Promise<PostData[]> {
  const storedPosts = await AsyncStorage.getItem(POSTS_KEY);
  if (!storedPosts) {
    return [];
  }

  const parsed: unknown = JSON.parse(storedPosts);
  if (!Array.isArray(parsed) || !parsed.every(isPostData)) {
    throw new Error("Os posts salvos no dispositivo estão inválidos.");
  }

  return parsed;
}

export async function publishPost(imagem: string): Promise<void> {
  const posts = await getPublishedPosts();

  const newPost: PostData = {
    id: Date.now(),
    nomeUsuario: "Você",
    subtitulo: "Agora",
    imagem,
    curtidas: 0,
    comentarios: 0,
  };

  await AsyncStorage.setItem(POSTS_KEY, JSON.stringify([newPost, ...posts]));
}
