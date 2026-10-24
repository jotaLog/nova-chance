import { View, Text, StyleSheet, } from "react-native";

import PostHeader from "./postHeader";
import PostImage from "./postImage";
import PostActions from "./postActions";

export interface PostData {
  id: number;
  nomeUsuario: string;
  fotoPerfil?: string | null;
  subtitulo?: string;
  imagem: string | null;
  legenda?: string;
  curtidas?: number;
  comentarios?: number;
  curtido?: boolean;
  salvo?: boolean;
}

interface PostCardProps {
  post: PostData;
  onPressPerfil?: () => void;
  onPressMenu?: () => void;
  onPressCurtir?: (curtido: boolean) => void;
  onPressComentar?: () => void;
  onPressSalvar?: (salvo: boolean) => void;
}

export default function PostCard({
  post,
  onPressPerfil,
  onPressMenu,
  onPressCurtir,
  onPressComentar,
  onPressSalvar,
}: PostCardProps) {
  return (
    <View style={styles.card}>
      <PostHeader
        nome={post.nomeUsuario}
        fotoPerfil={post.fotoPerfil}
        subtitulo={post.subtitulo}
        onPressPerfil={onPressPerfil}
      />

      <PostImage imagem={post.imagem} aspectRatio={4 / 5} />

      <PostActions
        curtidasIniciais={post.curtidas}
        curtidoInicialmente={post.curtido}
        salvoInicialmente={post.salvo}
        comentarios={post.comentarios}
        onPressCurtir={onPressCurtir}
        onPressComentar={onPressComentar}
        onPressSalvar={onPressSalvar}
        onPressMenu={onPressMenu}
      />

      {post.legenda ? (
        <View style={styles.captionContainer}>
          <Text style={styles.captionName}>
            {post.nomeUsuario}{" "}
            <Text style={styles.captionText}>
              {post.legenda}
            </Text>
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "#080808",
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    paddingBottom: 12,
  },
  captionContainer: {
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  captionName: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
    lineHeight: 20,
  },
  captionText: {
    fontWeight: "normal",
    color: "#DDD",
  },
});
