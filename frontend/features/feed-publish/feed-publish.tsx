import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { isAxiosError } from "axios";

import PostCard from "@/components/cards/postCard";
import {
  addPostComment,
  FeedPost,
  getPostComments,
  getFeedPosts,
  PostComment,
  setPostLike,
  setPostSaved,
  setUserFollowed,
} from "@/services/postService";
import { getLoggedUser } from "@/services/storage";

export default function FeedPublish() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggedUserId, setLoggedUserId] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [feedPosts, user] = await Promise.all([
        getFeedPosts(),
        getLoggedUser(),
      ]);
      setPosts(feedPosts);
      setLoggedUserId(user?.id_usuario ?? null);
    } catch (requestError: unknown) {
      console.error("Erro ao carregar feed:", requestError);
      if (isAxiosError(requestError) && !requestError.response) {
        setError(
          "Não foi possível conectar à API. Verifique se o backend está rodando na porta 3000 e se o celular está na mesma rede."
        );
      } else {
        setError(
          isAxiosError<{ error?: string }>(requestError)
            ? requestError.response?.data?.error ??
                "Não foi possível carregar as publicações."
            : requestError instanceof Error
              ? requestError.message
              : "Não foi possível carregar as publicações."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const openComments = useCallback(async (post: FeedPost) => {
    setSelectedPost(post);
    setComments([]);
    setCommentText("");
    setCommentsLoading(true);

    try {
      setComments(await getPostComments(post.id));
    } catch (requestError: unknown) {
      console.error("Erro ao carregar comentários:", requestError);
      Alert.alert(
        "Erro",
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível carregar os comentários."
      );
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const submitComment = useCallback(async () => {
    const content = commentText.trim();
    if (!selectedPost || !content || sendingComment) return;

    setSendingComment(true);
    try {
      await addPostComment(selectedPost.id, content);
      setCommentText("");
      setComments(await getPostComments(selectedPost.id));
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === selectedPost.id
            ? { ...post, comentarios: post.comentarios + 1 }
            : post
        )
      );
    } catch (requestError: unknown) {
      console.error("Erro ao enviar comentário:", requestError);
      Alert.alert(
        "Erro",
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível enviar o comentário."
      );
    } finally {
      setSendingComment(false);
    }
  }, [commentText, selectedPost, sendingComment]);

  useFocusEffect(
    useCallback(() => {
      void loadPosts();
    }, [loadPosts])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            isOwnPost={item.idUsuario === loggedUserId}
            onPressPerfil={() =>
              router.push({
                pathname: "/userProfile",
                params: { id: String(item.idUsuario) },
              })
            }
            onPressMenu={() => Alert.alert("Opções", "Menu da publicação")}
            onPressCurtir={async (curtido) => {
              await setPostLike(item.id, curtido);
              setPosts((currentPosts) =>
                currentPosts.map((post) =>
                  post.id === item.id
                    ? {
                        ...post,
                        curtido,
                        curtidas: Math.max(
                          0,
                          post.curtidas + (curtido ? 1 : -1)
                        ),
                      }
                    : post
                )
              );
            }}
            onPressComentar={() => void openComments(item)}
            onPressSalvar={async (salvo) => {
              await setPostSaved(item.id, salvo);
              setPosts((currentPosts) =>
                currentPosts.map((post) =>
                  post.id === item.id ? { ...post, salvo } : post
                )
              )
            }}
            onPressSeguir={item.idUsuario === loggedUserId ? undefined : async (seguindo) => {
              await setUserFollowed(item.idUsuario, seguindo);
              setPosts((currentPosts) =>
                currentPosts.map((post) =>
                  post.idUsuario === item.idUsuario
                    ? { ...post, seguindo }
                    : post
                )
              );
            }}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {loading
              ? "Carregando publicações..."
              : error ?? "Ainda não há publicações no feed."}
          </Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void loadPosts()}
            tintColor="#3CFF00"
            colors={["#3CFF00"]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          posts.length === 0 && styles.emptyList,
        ]}
      />

      <Modal
        visible={selectedPost !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedPost(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.commentsPanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comentários</Text>
              <Pressable
                onPress={() => setSelectedPost(null)}
                accessibilityRole="button"
                accessibilityLabel="Fechar comentários"
              >
                <Text style={styles.closeButton}>Fechar</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.commentsList}
              keyboardShouldPersistTaps="handled"
            >
              {commentsLoading ? (
                <Text style={styles.emptyComments}>Carregando comentários...</Text>
              ) : comments.length === 0 ? (
                <Text style={styles.emptyComments}>
                  Seja a primeira pessoa a comentar.
                </Text>
              ) : (
                comments.map((comment) => (
                  <Text key={comment.id_comentario} style={styles.comment}>
                    <Text style={styles.commentAuthor}>
                      {comment.nome_usuario}{" "}
                    </Text>
                    {comment.comentario}
                  </Text>
                ))
              )}
            </ScrollView>

            <View style={styles.commentInputRow}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Adicione um comentário..."
                placeholderTextColor="#777"
                maxLength={2000}
                style={styles.commentInput}
                returnKeyType="send"
                onSubmitEditing={() => void submitComment()}
                accessibilityLabel="Escreva um comentário"
              />
              <TouchableOpacity
                onPress={() => void submitComment()}
                disabled={!commentText.trim() || sendingComment}
                style={styles.sendCommentButton}
              >
                <Text style={styles.sendCommentText}>
                  {sendingComment ? "..." : "Enviar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  list: {
    paddingBottom: 30,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    padding: 24,
    color: "#AAA",
    fontSize: 15,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  commentsPanel: {
    height: "70%",
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: "#111",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    color: "#3CFF00",
    fontSize: 14,
  },
  commentsList: {
    flex: 1,
    paddingVertical: 12,
  },
  emptyComments: {
    paddingVertical: 24,
    color: "#AAA",
    textAlign: "center",
  },
  comment: {
    marginBottom: 14,
    color: "#DDD",
    fontSize: 14,
    lineHeight: 20,
  },
  commentAuthor: {
    color: "#FFF",
    fontWeight: "bold",
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  commentInput: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 6,
    color: "#FFF",
    backgroundColor: "#222",
  },
  sendCommentButton: {
    padding: 8,
  },
  sendCommentText: {
    color: "#3CFF00",
    fontWeight: "bold",
  },
});
