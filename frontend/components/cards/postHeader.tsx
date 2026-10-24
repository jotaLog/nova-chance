import { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

interface PostHeaderProps {
  nome: string;
  fotoPerfil?: string | null;
  subtitulo?: string;
  onPressPerfil?: () => void;
}

export default function PostHeader({
  nome,
  fotoPerfil,
  subtitulo,
  onPressPerfil,
}: PostHeaderProps) {
  const [seguindo, setSeguindo] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.userInfo}
        onPress={onPressPerfil}
        activeOpacity={0.8}
      >
        {fotoPerfil ? (
          <Image
            source={{ uri: fotoPerfil }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Feather name="user" size={22} color="#3CFF00" />
          </View>
        )}

        <View style={styles.textContainer}>
          <Text style={styles.nome} numberOfLines={1}>
            {nome}
          </Text>

          {subtitulo ? (
            <Text style={styles.subtitulo} numberOfLines={1}>
              {subtitulo}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.followButton, seguindo && styles.followingButton]}
        onPress={() => setSeguindo((atual) => !atual)}
        activeOpacity={0.7}
        accessibilityLabel={seguindo ? "Deixar de seguir" : "Seguir usuário"}
      >
        <Text style={[styles.followText, seguindo && styles.followingText]}>
          {seguindo ? "Seguindo" : "Seguir"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#222",
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    gap: 3,
  },
  nome: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  subtitulo: {
    color: "#999",
    fontSize: 12,
  },
  followButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#3CFF00",
    borderRadius: 7,
    marginLeft: 8,
  },
  followingButton: {
    borderColor: "#555",
  },
  followText: {
    color: "#3CFF00",
    fontSize: 13,
    fontWeight: "bold",
  },
  followingText: {
    color: "#AAA",
  },
});
