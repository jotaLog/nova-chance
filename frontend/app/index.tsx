import { Text, View, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import { getUsers } from "../services/authService";
import UserCard from "@/components/userCard";

export default function Home() {

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [showUsers, setShowUsers] = useState(false);

  function goToLogin() {
    router.push("/login");
  }

  function goToRegister() {
    router.push("/register");
  }

  function goToChat() {
    router.push("/chat");
  }

  useEffect(() => {

    async function loadUsers() {
      try {
        const response = await getUsers();
        setUsers(response);
      } catch (error) {
        console.log(error);
      }
    }

    loadUsers();

  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      <Text style={styles.title}>
        Nova Chance
      </Text>

      <Text style={styles.subtitle}>
        Área de Testes
      </Text>

      <TouchableOpacity style={styles.button} onPress={goToLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={goToRegister}>
        <Text style={styles.buttonText}>Cadastro</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={goToChat}>
        <Text style={styles.buttonText}>Chat</Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Pesquisar usuário..."
        placeholderTextColor="#777"
        style={styles.input}
        value={search}
        onChangeText={setSearch}
        onFocus={() => setShowUsers(true)}
        onBlur={() => {
          if (search === "") {
            setShowUsers(false);
          }
        }}
      />

      {showUsers && (
        <View style={styles.searchResults}>
          {users
            .filter((user) =>
              user.nome
                .toLowerCase()
                .includes(search.toLowerCase())
            )
            .map((user) => (
              <UserCard
                key={user.id_usuario}
                nome={user.nome}
                foto_perfil={user.foto_perfil}
                lastMessage=""
                timeAgo=""
                onPress={() =>
                  router.push({
                    pathname: "/profile",
                    params: {
                      id: user.id_usuario,
                    },
                  })
                }
              />
            ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  content: {
    padding: 20,
    paddingTop: 70,
    paddingBottom: 50,
  },

  title: {
    color: "#3CFF00",
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
  },

  subtitle: {
    color: "#888",
    textAlign: "center",
    marginBottom: 35,
    marginTop: 5,
    fontSize: 16,
  },

  button: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#3CFF00",
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },

  input: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#3CFF00",
    borderRadius: 12,
    backgroundColor: "#111",
    color: "#FFF",
    paddingHorizontal: 15,
    height: 48,
    fontSize: 15,
  },
  
  searchResults: {
    marginTop: 12,
  },
});