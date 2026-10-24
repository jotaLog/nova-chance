import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";

import PostCard, { PostData } from "@/components/cards/postCard";
import { getPublishedPosts } from "@/services/postStorage";

const postsIniciais: PostData[] = [
  {
    id: 1,
    nomeUsuario: "Maria",
    subtitulo: "Porto Alegre, RS",
    fotoPerfil: null,
    imagem:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800",
    legenda: "Montando looks com peças de brechó! 💚",
    curtidas: 24,
    comentarios: 3,
  },
  {
    id: 2,
    nomeUsuario: "Pedro",
    subtitulo: "Novo post",
    fotoPerfil: null,
    imagem:
      "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=800",
    legenda: "Estilo é usar aquilo que combina contigo.",
    curtidas: 12,
    comentarios: 0,
  },
];

export default function FeedPublish() {
  const [posts, setPosts] = useState(postsIniciais);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadPublishedPosts() {
        try {
          const publishedPosts = await getPublishedPosts();
          if (active) {
            setPosts([...publishedPosts, ...postsIniciais]);
          }
        } catch (error: unknown) {
          console.error("Erro ao carregar posts publicados:", error);
          Alert.alert(
            "Erro",
            "Não foi possível carregar as publicações salvas."
          );
        }
      }

      void loadPublishedPosts();

      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nova Chance</Text>

      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPressPerfil={() =>
              Alert.alert("Perfil", `Perfil de ${item.nomeUsuario}`)
            }
            onPressMenu={() => Alert.alert("Opções", "Menu da publicação")}
            onPressCurtir={(curtido) => {
              setPosts((atuais) =>
                atuais.map((post) =>
                  post.id === item.id
                    ? {
                        ...post,
                        curtido,
                        curtidas:
                          (post.curtidas ?? 0) + (curtido ? 1 : -1),
                      }
                    : post
                )
              );
            }}
            onPressComentar={() =>
              Alert.alert("Comentários", "Abrir comentários")
            }
            onPressSalvar={(salvo) =>
              Alert.alert(
                salvo
                  ? "Publicação salva"
                  : "Publicação removida dos salvos"
              )
            }
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  title: {
    color: "#3CFF00",
    fontSize: 23,
    fontWeight: "bold",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  list: {
    paddingBottom: 30,
  },
});