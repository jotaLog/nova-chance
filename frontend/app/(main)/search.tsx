import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, router } from "expo-router";

import UserCard from "../../components/userCard";
import { getUsers } from "../../services/authService";
import { api } from "../../services/api";

interface SearchUser {
  id_usuario: number;
  nome: string;
  foto_perfil: string | null;
}

function imageUri(url: string | null) {
  if (!url || /^https?:\/\//i.test(url)) return url ?? undefined;
  return `${api.defaults.baseURL}${url}`;
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(await getUsers());
    } catch (requestError: unknown) {
      console.error("Erro ao buscar usuários:", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível carregar os usuários."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadUsers();
    }, [loadUsers])
  );

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return users.filter((user) =>
      user.nome.toLocaleLowerCase().includes(normalizedQuery)
    );
  }, [query, users]);

  return (
    <View style={styles.screen}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar por nome..."
        placeholderTextColor="#777"
        style={styles.searchInput}
        accessibilityLabel="Buscar usuários por nome"
        returnKeyType="search"
      />

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#3CFF00" />
      ) : error ? (
        <Text style={styles.message}>{error}</Text>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => String(item.id_usuario)}
          renderItem={({ item }) => (
            <UserCard
              nome={item.nome}
              foto_perfil={imageUri(item.foto_perfil)}
              onPress={() =>
                router.push({
                  pathname: "/userProfile",
                  params: { id: String(item.id_usuario) },
                })
              }
            />
          )}
          ListEmptyComponent={
            <Text style={styles.message}>
              {query.trim()
                ? "Nenhuma pessoa encontrada."
                : "Ainda não há usuários para mostrar."}
            </Text>
          }
          contentContainerStyle={filteredUsers.length === 0 && styles.emptyList}
          onRefresh={() => void loadUsers()}
          refreshing={loading}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
  },
  title: {
    paddingHorizontal: 20,
    paddingTop: 22,
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    paddingHorizontal: 20,
    paddingTop: 6,
    color: "#999",
    fontSize: 13,
    lineHeight: 19,
  },
  searchInput: {
    height: 46,
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#303030",
    borderRadius: 6,
    color: "#FFF",
    backgroundColor: "#121212",
  },
  loading: {
    marginTop: 32,
  },
  message: {
    padding: 24,
    color: "#999",
    textAlign: "center",
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
});
