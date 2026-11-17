import { Response } from "express";

import { AuthRequest } from "../middleware/authMiddleware";
import {
  createPost,
  createPostComment,
  getFeedPosts,
  getPostComments,
  getSavedPosts,
  getUserPosts,
  setPostLike,
  setPostSaved,
} from "../services/postService";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const BASE64_PATTERN =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function listPosts(req: AuthRequest, res: Response) {
  const id_usuario = req.user?.id_usuario;
  if (!id_usuario) {
    return res.status(401).json({ error: "Você precisa estar logado." });
  }

  try {
    const posts = await getFeedPosts(id_usuario);
    const serverOrigin = `${req.protocol}://${req.get("host")}`;

    return res.json(
      posts.map((post) => ({
        id_post: post.id_post,
        id_usuario: post.id_usuario,
        nome_usuario: post.nome,
        foto_perfil: post.foto_perfil
          ? toAbsoluteUrl(post.foto_perfil, serverOrigin)
          : null,
        descricao_post: post.descricao_post,
        imagem_url: post.imagem_url
          ? toAbsoluteUrl(post.imagem_url, serverOrigin)
          : null,
        data_postagem: post.data_postagem,
        curtidas: Number(post.curtidas),
        comentarios: Number(post.comentarios),
        curtido: Boolean(post.curtido),
        salvo: Boolean(post.salvo),
        seguindo: Boolean(post.seguindo),
      }))
    );
  } catch (error: unknown) {
    console.error("Erro ao carregar feed:", error);
    return res.status(500).json({ error: "Erro ao carregar publicações." });
  }
}

function toAbsoluteUrl(url: string, origin: string) {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return new URL(url, origin).toString();
}

function formatPosts(posts: Awaited<ReturnType<typeof getFeedPosts>>, origin: string) {
  return posts.map((post) => ({
    id_post: post.id_post,
    id_usuario: post.id_usuario,
    nome_usuario: post.nome,
    foto_perfil: post.foto_perfil
      ? toAbsoluteUrl(post.foto_perfil, origin)
      : null,
    descricao_post: post.descricao_post,
    imagem_url: post.imagem_url
      ? toAbsoluteUrl(post.imagem_url, origin)
      : null,
    data_postagem: post.data_postagem,
    curtidas: Number(post.curtidas),
    comentarios: Number(post.comentarios),
    curtido: Boolean(post.curtido),
    salvo: Boolean(post.salvo),
    seguindo: Boolean(post.seguindo),
  }));
}

export async function updatePostLike(req: AuthRequest, res: Response) {
  const id_usuario = req.user?.id_usuario;
  const id_post = Number(req.params.id);
  const { curtido } = req.body ?? {};

  if (!id_usuario) {
    return res.status(401).json({ error: "Você precisa estar logado." });
  }
  if (!Number.isInteger(id_post) || id_post <= 0 || typeof curtido !== "boolean") {
    return res.status(400).json({ error: "Ação de curtida inválida." });
  }

  try {
    await setPostLike(id_post, id_usuario, curtido);
    return res.json({ curtido });
  } catch (error: unknown) {
    console.error("Erro ao atualizar curtida:", error);
    return res.status(500).json({ error: "Não foi possível atualizar a curtida." });
  }
}

export async function listUserPosts(req: AuthRequest, res: Response) {
  const viewerId = req.user?.id_usuario;
  const profileId = Number(req.params.id);
  if (!viewerId) return res.status(401).json({ error: "Você precisa estar logado." });
  if (!Number.isInteger(profileId) || profileId <= 0) {
    return res.status(400).json({ error: "Usuário inválido." });
  }

  try {
    const posts = await getUserPosts(viewerId, profileId);
    return res.json(formatPosts(posts, `${req.protocol}://${req.get("host")}`));
  } catch (error: unknown) {
    console.error("Erro ao carregar publicações do perfil:", error);
    return res.status(500).json({ error: "Não foi possível carregar as publicações." });
  }
}

export async function listSavedPosts(req: AuthRequest, res: Response) {
  const userId = req.user?.id_usuario;
  if (!userId) return res.status(401).json({ error: "Você precisa estar logado." });

  try {
    const posts = await getSavedPosts(userId);
    return res.json(formatPosts(posts, `${req.protocol}://${req.get("host")}`));
  } catch (error: unknown) {
    console.error("Erro ao carregar publicações salvas:", error);
    return res.status(500).json({ error: "Não foi possível carregar os itens salvos." });
  }
}

export async function updatePostSaved(req: AuthRequest, res: Response) {
  const id_usuario = req.user?.id_usuario;
  const id_post = Number(req.params.id);
  const { salvo } = req.body ?? {};

  if (!id_usuario) {
    return res.status(401).json({ error: "Você precisa estar logado." });
  }
  if (!Number.isInteger(id_post) || id_post <= 0 || typeof salvo !== "boolean") {
    return res.status(400).json({ error: "Ação de salvar inválida." });
  }

  try {
    await setPostSaved(id_post, id_usuario, salvo);
    return res.json({ salvo });
  } catch (error: unknown) {
    console.error("Erro ao atualizar post salvo:", error);
    return res.status(500).json({ error: "Não foi possível salvar a publicação." });
  }
}

export async function listPostComments(req: AuthRequest, res: Response) {
  const id_post = Number(req.params.id);
  if (!req.user?.id_usuario) {
    return res.status(401).json({ error: "Você precisa estar logado." });
  }
  if (!Number.isInteger(id_post) || id_post <= 0) {
    return res.status(400).json({ error: "Publicação inválida." });
  }

  try {
    const comments = await getPostComments(id_post);
    return res.json(
      comments.map((comment) => ({
        id_comentario: comment.id_comentario,
        id_usuario: comment.id_usuario,
        nome_usuario: comment.nome_usuario,
        foto_perfil: comment.foto_perfil
          ? toAbsoluteUrl(
              comment.foto_perfil,
              `${req.protocol}://${req.get("host")}`
            )
          : null,
        comentario: comment.comentario,
        data_comentario: comment.data_comentario,
      }))
    );
  } catch (error: unknown) {
    console.error("Erro ao carregar comentários:", error);
    return res.status(500).json({ error: "Não foi possível carregar comentários." });
  }
}

export async function addPostComment(req: AuthRequest, res: Response) {
  const id_usuario = req.user?.id_usuario;
  const id_post = Number(req.params.id);
  const { comentario } = req.body ?? {};

  if (!id_usuario) {
    return res.status(401).json({ error: "Você precisa estar logado." });
  }
  if (
    !Number.isInteger(id_post) ||
    id_post <= 0 ||
    typeof comentario !== "string" ||
    !comentario.trim() ||
    comentario.trim().length > 2000
  ) {
    return res.status(400).json({
      error: "O comentário é obrigatório e deve ter até 2000 caracteres.",
    });
  }

  try {
    const result = await createPostComment(
      id_post,
      id_usuario,
      comentario.trim()
    );
    return res.status(201).json(result);
  } catch (error: unknown) {
    console.error("Erro ao adicionar comentário:", error);
    return res.status(500).json({ error: "Não foi possível adicionar comentário." });
  }
}

export async function publishPost(req: AuthRequest, res: Response) {
  const id_usuario = req.user?.id_usuario;
  if (!id_usuario) {
    return res.status(401).json({ error: "Você precisa estar logado." });
  }

  const { imagem_base64, mime_type, descricao_post } = req.body ?? {};
  if (
    typeof imagem_base64 !== "string" ||
    !imagem_base64 ||
    imagem_base64.length > Math.ceil(MAX_IMAGE_SIZE_BYTES / 3) * 4 ||
    !BASE64_PATTERN.test(imagem_base64) ||
    typeof mime_type !== "string" ||
    !ALLOWED_MIME_TYPES.has(mime_type)
  ) {
    return res.status(400).json({
      error: "Envie uma imagem JPEG, PNG ou WebP válida de até 5 MB.",
    });
  }

  if (
    descricao_post !== undefined &&
    (typeof descricao_post !== "string" || descricao_post.length > 500)
  ) {
    return res.status(400).json({
      error: "A descrição deve ter no máximo 500 caracteres.",
    });
  }

  const imagem = Buffer.from(imagem_base64, "base64");
  if (imagem.length === 0 || imagem.length > MAX_IMAGE_SIZE_BYTES) {
    return res.status(400).json({
      error: "A imagem deve ter no máximo 5 MB.",
    });
  }

  try {
    const post = await createPost({
      id_usuario,
      imagem,
      mime_type,
      descricao_post:
        typeof descricao_post === "string" && descricao_post.trim()
          ? descricao_post.trim()
          : null,
    });

    return res.status(201).json({
      message: "Post publicado com sucesso.",
      ...post,
    });
  } catch (error: unknown) {
    console.error("Erro ao salvar post:", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DATA_TOO_LONG"
    ) {
      return res.status(400).json({
        error: "A descrição ou imagem excede o limite aceito pelo banco.",
      });
    }

    return res.status(500).json({ error: "Erro ao salvar publicação." });
  }
}
