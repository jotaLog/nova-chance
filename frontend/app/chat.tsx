import { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, FlatList, } from "react-native";
import { router } from "expo-router";

import UserCard from "../components/userCard";

import { getFollowingUsers } from "../services/authService";
import { getLoggedUser } from "../services/storage";

const Logo = require("../assets/images/logo-nova-chance.png");

export default function Chat() {
  const [conversas, setConversas] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
    try {
      const loggedUser = await getLoggedUser();

      if (!loggedUser) return;
      const users = await getFollowingUsers(
        loggedUser.id_usuario
      );

      setConversas(users);

    } catch (e) {
      console.log(e);
    }
  }

    load();
}, []);

  return (
    <View style={styles.screen}>

      <View style={styles.header}>
        <Image source={Logo} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>Mensagens</Text>
      </View>

      <View style={styles.divider} />

      <FlatList
        data={conversas}
        keyExtractor={(item) => String(item.id_usuario)}
        renderItem={({ item }) => (
          <UserCard
            nome={item.nome}
            foto_perfil={item.foto_perfil}
            lastMessage="Iniciar conversa"
            timeAgo=""
            onPress={() => router.push({
                pathname: "/profile",
                params: {
                    id: item.id_usuario,
                },
            })}
            />
        )}
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
    paddingTop: 48,
    paddingBottom: 8,
  },
  logo: {
    width: 140,
    height: 60,
  },
  titleRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: {
    color: "#9CA3AF",
    fontSize: 22,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#1a1a1a",
    marginHorizontal: 20,
    marginBottom: 4,
  },
});