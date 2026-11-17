import { useCallback, useState } from "react";
import {
  ActivityIndicator,
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
import { router, useFocusEffect } from "expo-router";

import { TradingClothes, getMyClothes } from "@/services/clothesService";
import { api } from "@/services/api";

function getImageUri(image: string | null) {
  if (!image) return null;
  return image.startsWith("/") ? `${api.defaults.baseURL}${image}` : image;
}

function getErrorMessage(error: unknown) {
  if (isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error ?? "Não foi possível carregar suas peças.";
  }
  return error instanceof Error ? error.message : "Não foi possível carregar suas peças.";
}

export default function WardrobeScreen() {
  const [clothes, setClothes] = useState<TradingClothes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClothes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setClothes(await getMyClothes());
    } catch (loadError: unknown) {
      console.error("Erro ao carregar armário:", loadError);
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadClothes();
    }, [loadClothes])
  );

  function renderClothing({ item }: { item: TradingClothes }) {
    const imageUri = getImageUri(item.imagem_url);

    return (
      <View style={styles.card}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.clothingImage} />
        ) : (
          <View style={[styles.clothingImage, styles.imagePlaceholder]}>
            <Feather name="image" size={32} color="#777" />
            <Text style={styles.placeholderText}>Sem foto</Text>
          </View>
        )}
        <Text style={styles.clothingName} numberOfLines={1}>
          {item.nome}
        </Text>
        <Text style={styles.clothingDetails} numberOfLines={1}>
          {[item.categoria, item.tamanho && `Tam. ${item.tamanho}`]
            .filter(Boolean)
            .join(" • ") || "Peça do seu armário"}
        </Text>
      </View>
    );
  }

  const emptyMessage = loading
    ? "Carregando suas peças..."
    : error ?? "Seu armário ainda está vazio. Adicione sua primeira peça!";

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Feather name="arrow-left" size={22} color="#FFF" />
        </Pressable>
        <View style={styles.heading}>
          <Text style={styles.title}>Meu armário</Text>
          <Text style={styles.subtitle}>
            {clothes.length} {clothes.length === 1 ? "peça" : "peças"}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/add-clothes")}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel="Adicionar peça ao armário"
        >
          <Feather name="plus" size={23} color="#000" />
        </Pressable>
      </View>

      <FlatList
        data={clothes}
        numColumns={2}
        keyExtractor={(item) => String(item.id_roupa)}
        renderItem={renderClothing}
        ListHeaderComponent={
          error && clothes.length > 0 ? (
            <Pressable
              onPress={() => void loadClothes()}
              style={styles.errorNotice}
              accessibilityRole="button"
            >
              <Text style={styles.errorNoticeText}>{error} Toque para tentar novamente.</Text>
            </Pressable>
          ) : null
        }
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.list,
          clothes.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#3CFF00" />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{emptyMessage}</Text>
              {error ? (
                <Pressable onPress={() => void loadClothes()} style={styles.retryButton}>
                  <Text style={styles.retryText}>Tentar novamente</Text>
                </Pressable>
              ) : null}
              {!error ? (
                <Pressable
                  onPress={() => router.push("/add-clothes")}
                  style={styles.emptyAddButton}
                >
                  <Text style={styles.emptyAddText}>Adicionar peça</Text>
                </Pressable>
              ) : null}
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void loadClothes()}
            tintColor="#3CFF00"
            colors={["#3CFF00"]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#252525",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  heading: {
    flex: 1,
    marginLeft: 6,
  },
  title: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 3,
    color: "#3CFF00",
    fontSize: 12,
    fontWeight: "600",
  },
  addButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#3CFF00",
  },
  list: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 24,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 6,
    backgroundColor: "#111",
  },
  clothingImage: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#FFF",
    resizeMode: "contain",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#191919",
  },
  placeholderText: {
    marginTop: 6,
    color: "#888",
    fontSize: 11,
  },
  clothingName: {
    marginTop: 9,
    marginHorizontal: 10,
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  clothingDetails: {
    marginTop: 4,
    marginBottom: 10,
    marginHorizontal: 10,
    color: "#999",
    fontSize: 11,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 28,
  },
  emptyText: {
    color: "#AAA",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  errorNotice: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 6,
    backgroundColor: "#2A1717",
  },
  errorNoticeText: {
    color: "#FF8A8A",
    fontSize: 12,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
    backgroundColor: "#222",
  },
  retryText: {
    color: "#FFF",
    fontWeight: "600",
  },
  emptyAddButton: {
    marginTop: 16,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 6,
    backgroundColor: "#3CFF00",
  },
  emptyAddText: {
    color: "#000",
    fontWeight: "700",
  },
});
