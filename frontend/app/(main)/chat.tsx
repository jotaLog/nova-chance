import { useCallback, useState } from "react";
import { Alert, FlatList, Image, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";

import UserCard from "../../components/userCard";
import {
  ConversationSummary,
  getConversations,
} from "../../services/messageService";
import { getFollowingUsers } from "../../services/authService";
import { getLoggedUser } from "../../services/storage";
import { api } from "../../services/api";

interface ChatContact {
  id_usuario: number;
  nome: string;
  foto_perfil: string | null;
  ultima_mensagem?: string;
  nao_lidas?: number;
}

function toImageUri(uri: string | null) {
  if (!uri || /^https?:\/\//i.test(uri)) return uri ?? undefined;
  return `${api.defaults.baseURL}${uri}`;
}

export default function Chat() {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const loggedUser = await getLoggedUser();
      if (!loggedUser) {
        setContacts([]);
        return;
      }

      const [conversations, following] = await Promise.all([
        getConversations(),
        getFollowingUsers(loggedUser.id_usuario),
      ]);
      const contactMap = new Map<number, ChatContact>();
      (following as ChatContact[]).forEach((user) =>
        contactMap.set(Number(user.id_usuario), user)
      );
      (conversations as ConversationSummary[]).forEach((conversation) =>
        contactMap.set(Number(conversation.id_usuario), {
          ...contactMap.get(Number(conversation.id_usuario)),
          ...conversation,
        })
      );
      setContacts(Array.from(contactMap.values()));
    } catch (error: unknown) {
      console.error("Erro ao carregar conversas:", error);
      Alert.alert(
        "Não foi possível carregar mensagens",
        error instanceof Error ? error.message : "Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/logo-nova-chance.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <View style={styles.divider} />

      <FlatList
        data={contacts}
        keyExtractor={(item) => String(item.id_usuario)}
        renderItem={({ item }) => (
          <UserCard
            nome={item.nome}
            foto_perfil={toImageUri(item.foto_perfil)}
            lastMessage={item.ultima_mensagem ?? "Iniciar conversa"}
            timeAgo={item.nao_lidas ? `${item.nao_lidas} não lidas` : ""}
            onPress={() =>
              router.push({
                pathname: "/conversation",
                params: {
                  id: String(item.id_usuario),
                  name: item.nome,
                  photo: item.foto_perfil ?? "",
                },
              })
            }
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loading
              ? "Carregando conversas..."
              : "Siga alguém ou inicie uma troca para começar uma conversa."}
          </Text>
        }
        onRefresh={() => void load()}
        refreshing={loading}
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
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8,
  },
  logo: {
    width: 140,
    height: 60,
  },
  title: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    color: "#9CA3AF",
    fontSize: 22,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
    marginBottom: 4,
    backgroundColor: "#1A1A1A",
  },
  empty: {
    padding: 28,
    color: "#999",
    textAlign: "center",
  },
});
