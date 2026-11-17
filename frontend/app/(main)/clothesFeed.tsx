import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { isAxiosError } from "axios";
import { useFocusEffect, router } from "expo-router";

import {
  getIncomingClothesExchanges,
  getMyClothes,
  getTradingClothes,
  IncomingClothesExchange,
  requestClothesExchange,
  respondToClothesExchange,
  setClothesAvailability,
  setClothesFavorite,
  TradingClothes,
} from "@/services/clothesService";
import { api } from "@/services/api";

type FeedView = "clothes" | "mine" | "requests";

function getErrorMessage(error: unknown) {
  if (isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error ?? "Não foi possível concluir a operação.";
  }
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}

function getImageUri(image: string | null) {
  if (!image) return null;
  return image.startsWith("/") ? `${api.defaults.baseURL}${image}` : image;
}

export default function ClothesFeed() {
  const [clothes, setClothes] = useState<TradingClothes[]>([]);
  const [myClothes, setMyClothes] = useState<TradingClothes[]>([]);
  const [requests, setRequests] = useState<IncomingClothesExchange[]>([]);
  const [view, setView] = useState<FeedView>("clothes");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyClothingId, setBusyClothingId] = useState<number | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [clothingItems, ownedClothing, incomingRequests] = await Promise.all([
        getTradingClothes(),
        getMyClothes(),
        getIncomingClothesExchanges(),
      ]);
      setClothes(clothingItems);
      setMyClothes(ownedClothing);
      setRequests(incomingRequests);
    } catch (requestError: unknown) {
      console.error("Erro ao carregar feed de trocas:", requestError);
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadFeed();
    }, [loadFeed])
  );

  async function toggleFavorite(item: TradingClothes) {
    if (busyClothingId !== null) return;
    const favorita = !Boolean(item.favorita);
    setBusyClothingId(item.id_roupa);
    try {
      await setClothesFavorite(item.id_roupa, favorita);
      setClothes((current) =>
        current.map((clothing) =>
          clothing.id_roupa === item.id_roupa
            ? {
                ...clothing,
                favorita,
                total_interesses: Math.max(
                  0,
                  clothing.total_interesses + (favorita ? 1 : -1)
                ),
              }
            : clothing
        )
      );
    } catch (requestError: unknown) {
      Alert.alert("Não foi possível atualizar", getErrorMessage(requestError));
    } finally {
      setBusyClothingId(null);
    }
  }

  function confirmExchange(item: TradingClothes) {
    Alert.alert(
      "Solicitar troca",
      `Enviar uma solicitação para trocar "${item.nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Solicitar",
          onPress: () => void sendExchangeRequest(item),
        },
      ]
    );
  }

  async function sendExchangeRequest(item: TradingClothes) {
    if (busyClothingId !== null) return;
    setBusyClothingId(item.id_roupa);
    try {
      await requestClothesExchange(item.id_roupa);
      Alert.alert(
        "Solicitação enviada",
        `Sua solicitação para trocar pela peça "${item.nome}" foi enviada.`,
        [
          { text: "Depois", style: "cancel" },
          {
            text: "Abrir conversa",
            onPress: () =>
              router.push({
                pathname: "/conversation",
                params: {
                  id: String(item.id_usuario),
                  name: item.nome_usuario,
                  photo: item.foto_perfil ?? "",
                  initialMessage: `Olá! Tenho interesse em trocar pela peça "${item.nome}". Ela ainda está disponível?`,
                },
              }),
          },
        ]
      );
    } catch (requestError: unknown) {
      Alert.alert("Não foi possível solicitar a troca", getErrorMessage(requestError));
    } finally {
      setBusyClothingId(null);
    }
  }

  async function toggleAvailability(item: TradingClothes) {
    if (busyClothingId !== null) return;
    const disponivel_troca = !Boolean(item.disponivel_troca);
    setBusyClothingId(item.id_roupa);
    try {
      await setClothesAvailability(item.id_roupa, disponivel_troca);
      await loadFeed();
      Alert.alert(
        "Peça atualizada",
        disponivel_troca
          ? "Sua peça está disponível no feed de trocas."
          : "Sua peça foi removida do feed de trocas."
      );
    } catch (requestError: unknown) {
      Alert.alert("Não foi possível atualizar a peça", getErrorMessage(requestError));
    } finally {
      setBusyClothingId(null);
    }
  }

  async function answerRequest(
    request: IncomingClothesExchange,
    status: "aceita" | "recusada"
  ) {
    if (busyRequestId !== null) return;
    setBusyRequestId(request.id_troca);
    try {
      await respondToClothesExchange(request.id_troca, status);
      await loadFeed();
      Alert.alert(
        status === "aceita" ? "Troca aceita" : "Solicitação recusada",
        status === "aceita"
          ? "A peça foi removida do feed de roupas disponíveis."
          : "A solicitação de troca foi recusada."
      );
    } catch (requestError: unknown) {
      Alert.alert("Não foi possível responder", getErrorMessage(requestError));
    } finally {
      setBusyRequestId(null);
    }
  }

  function renderClothing({ item }: { item: TradingClothes }) {
    const imageUri = getImageUri(item.imagem_url);
    const isBusy = busyClothingId === item.id_roupa;
    return (
      <View style={styles.card}>
        <View style={styles.ownerRow}>
          <View style={styles.avatar}>
            {item.foto_perfil ? (
              <Image source={{ uri: getImageUri(item.foto_perfil) ?? "" }} style={styles.avatarImage} />
            ) : (
              <Feather name="user" size={18} color="#AAA" />
            )}
          </View>
          <Text style={styles.ownerName}>{item.nome_usuario}</Text>
          <View style={styles.availableTag}>
            <Text style={styles.availableText}>PARA TROCA</Text>
          </View>
        </View>

        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.clothingImage} />
        ) : (
          <View style={[styles.clothingImage, styles.imagePlaceholder]}>
            <Feather name="image" size={42} color="#555" />
            <Text style={styles.placeholderText}>Sem foto</Text>
          </View>
        )}

        <View style={styles.cardContent}>
          <Text style={styles.clothingName}>{item.nome}</Text>
          <Text style={styles.details}>
            {[item.categoria, item.tamanho && `Tamanho ${item.tamanho}`, item.estado]
              .filter(Boolean)
              .join("  •  ")}
          </Text>
          {item.marca ? <Text style={styles.details}>Marca: {item.marca}</Text> : null}
          {item.descricao ? <Text style={styles.description}>{item.descricao}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={[styles.actionButton, styles.favoriteButton]}
              onPress={() => void toggleFavorite(item)}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel={Boolean(item.favorita) ? "Remover dos favoritos" : "Tenho interesse"}
            >
              <Feather
                name="heart"
                size={17}
                color={Boolean(item.favorita) ? "#FF5C7A" : "#FFF"}
              />
              <Text style={styles.actionText}>
                Tenho interesse
              </Text>
              <Text style={styles.interestCount}>{item.total_interesses}</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.exchangeButton]}
              onPress={() => confirmExchange(item)}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel="Solicitar troca"
            >
              <Feather name="repeat" size={17} color="#000" />
              <Text style={styles.exchangeText}>{isBusy ? "Enviando..." : "Trocar"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  function renderRequest({ item }: { item: IncomingClothesExchange }) {
    const isBusy = busyRequestId === item.id_troca;
    return (
      <View style={styles.requestCard}>
        <Text style={styles.requestTitle}>{item.nome_solicitante} quer trocar</Text>
        <Text style={styles.requestClothing}>{item.nome_roupa}</Text>
        {item.mensagem_proposta ? (
          <Text style={styles.requestMessage}>{item.mensagem_proposta}</Text>
        ) : null}
        <View style={styles.requestActions}>
          <Pressable
            style={[styles.requestButton, styles.declineButton]}
            onPress={() => void answerRequest(item, "recusada")}
            disabled={isBusy}
          >
            <Text style={styles.declineText}>Recusar</Text>
          </Pressable>
          <Pressable
            style={[styles.requestButton, styles.acceptButton]}
            onPress={() => void answerRequest(item, "aceita")}
            disabled={isBusy}
          >
            <Text style={styles.acceptText}>{isBusy ? "..." : "Aceitar troca"}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderMyClothing({ item }: { item: TradingClothes }) {
    const imageUri = getImageUri(item.imagem_url);
    const isAvailable = Boolean(item.disponivel_troca);
    const isBusy = busyClothingId === item.id_roupa;
    return (
      <View style={styles.myClothingCard}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.myClothingImage} />
        ) : (
          <View style={[styles.myClothingImage, styles.imagePlaceholder]}>
            <Feather name="image" size={28} color="#555" />
          </View>
        )}
        <View style={styles.myClothingInfo}>
          <Text style={styles.clothingName}>{item.nome}</Text>
          <Text style={styles.details}>
            {[item.categoria, item.tamanho && `Tamanho ${item.tamanho}`]
              .filter(Boolean)
              .join("  •  ")}
          </Text>
          <Text style={[styles.availabilityStatus, isAvailable && styles.availableText]}>
            {isAvailable ? "Visível no feed de trocas" : "Fora do feed de trocas"}
          </Text>
          <Pressable
            style={[styles.availabilityButton, isAvailable && styles.disableAvailabilityButton]}
            onPress={() => void toggleAvailability(item)}
            disabled={isBusy}
          >
            <Text style={[styles.availabilityButtonText, isAvailable && styles.disableAvailabilityText]}>
              {isBusy
                ? "Atualizando..."
                : isAvailable
                  ? "Tirar do feed"
                  : "Disponibilizar para troca"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const displayedItems =
    view === "clothes" ? clothes : view === "mine" ? myClothes : requests;
  const emptyMessage = loading
    ? "Carregando..."
    : error ?? (
      view === "clothes"
        ? "Ainda não há roupas disponíveis para troca."
        : view === "mine"
          ? "Você ainda não cadastrou roupas."
          : "Você não tem solicitações de troca pendentes."
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Voltar ao feed de publicações"
        >
          <Feather name="arrow-left" size={20} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, view === "clothes" && styles.activeTab]}
          onPress={() => setView("clothes")}
        >
          <Text style={[styles.tabText, view === "clothes" && styles.activeTabText]}>Roupas</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, view === "mine" && styles.activeTab]}
          onPress={() => setView("mine")}
        >
          <Text style={[styles.tabText, view === "mine" && styles.activeTabText]}>Minhas peças</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, view === "requests" && styles.activeTab]}
          onPress={() => setView("requests")}
        >
          <Text style={[styles.tabText, view === "requests" && styles.activeTabText]}>
            Solicitações{requests.length ? ` (${requests.length})` : ""}
          </Text>
        </Pressable>
      </View>

      <FlatList<TradingClothes | IncomingClothesExchange>
        data={displayedItems}
        keyExtractor={(item) =>
          String(view === "requests"
            ? (item as IncomingClothesExchange).id_troca
            : (item as TradingClothes).id_roupa)
        }
        renderItem={({ item }) =>
          view === "clothes"
            ? renderClothing({ item: item as TradingClothes })
            : view === "mine"
              ? renderMyClothing({ item: item as TradingClothes })
              : renderRequest({ item: item as IncomingClothesExchange })
        }
        ListEmptyComponent={<Text style={styles.emptyText}>{emptyMessage}</Text>}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void loadFeed()}
            tintColor="#3CFF00"
            colors={["#3CFF00"]}
          />
        }
        contentContainerStyle={[styles.list, displayedItems.length === 0 && styles.emptyList]}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        style={styles.floatingAddButton}
        onPress={() => router.push("/add-clothes")}
        accessibilityRole="button"
        accessibilityLabel="Cadastrar uma roupa para troca"
      >
        <Feather name="plus" size={26} color="#000" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
  },
  floatingAddButton: {
    position: "absolute",
    right: 20,
    bottom: 80,
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#3CFF00",
    elevation: 8,
    zIndex: 2,
  },
  tabs: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  tab: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#171717",
  },
  activeTab: {
    backgroundColor: "#3CFF00",
  },
  tabText: {
    color: "#DDD",
    fontWeight: "600",
  },
  activeTabText: {
    color: "#000",
  },
  list: {
    paddingBottom: 110,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyText: {
    padding: 24,
    color: "#AAA",
    fontSize: 15,
    textAlign: "center",
  },
  card: {
    marginHorizontal: 10,
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    paddingBottom: 14,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#222",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  ownerName: {
    flex: 1,
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  availableTag: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#16310C",
  },
  availableText: {
    color: "#3CFF00",
    fontSize: 10,
    fontWeight: "bold",
  },
  clothingImage: {
    width: "100%",
    height: 290,
    backgroundColor: "#111",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#777",
    marginTop: 8,
  },
  cardContent: {
    paddingHorizontal: 8,
    paddingTop: 12,
  },
  clothingName: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "bold",
  },
  details: {
    color: "#AAA",
    fontSize: 12,
    marginTop: 5,
  },
  description: {
    color: "#DDD",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  actionButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  favoriteButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#444",
    backgroundColor: "#151515",
  },
  actionText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  interestCount: {
    color: "#AAA",
    fontSize: 12,
  },
  exchangeButton: {
    minWidth: 104,
    backgroundColor: "#3CFF00",
  },
  exchangeText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
  },
  requestCard: {
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 16,
    borderRadius: 6,
    backgroundColor: "#111",
  },
  requestTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
  requestClothing: {
    color: "#3CFF00",
    fontSize: 14,
    marginTop: 6,
  },
  requestMessage: {
    color: "#AAA",
    fontSize: 13,
    marginTop: 8,
  },
  requestActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 14,
  },
  requestButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  declineButton: {
    backgroundColor: "#272727",
  },
  declineText: {
    color: "#DDD",
    fontWeight: "600",
  },
  acceptButton: {
    backgroundColor: "#3CFF00",
  },
  acceptText: {
    color: "#000",
    fontWeight: "bold",
  },
  myClothingCard: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 12,
    borderRadius: 6,
    backgroundColor: "#111",
  },
  myClothingImage: {
    width: 92,
    height: 110,
    borderRadius: 6,
    backgroundColor: "#1A1A1A",
  },
  myClothingInfo: {
    flex: 1,
    justifyContent: "center",
  },
  availabilityStatus: {
    color: "#AAA",
    fontSize: 12,
    marginTop: 8,
  },
  availabilityButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#3CFF00",
  },
  availabilityButtonText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
  },
  disableAvailabilityButton: {
    backgroundColor: "#272727",
  },
  disableAvailabilityText: {
    color: "#DDD",
  },
});