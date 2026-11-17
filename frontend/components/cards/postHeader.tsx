import { useState } from "react";
import {
  Alert,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";

interface PostHeaderProps {
  nome: string;
  fotoPerfil?: string | null;
  subtitulo?: string;
  onPressPerfil?: () => void;
  seguindo?: boolean;
  onPressSeguir?: (seguindo: boolean) => void | Promise<void>;
  isOwnUser?: boolean;
}

export default function PostHeader({
  nome,
  fotoPerfil,
  subtitulo,
  onPressPerfil,
  seguindo = false,
  onPressSeguir,
  isOwnUser = false,
}: PostHeaderProps) {
  const [updatingFollow, setUpdatingFollow] = useState(false);

  async function toggleFollow() {
    if (!onPressSeguir || updatingFollow) return;

    setUpdatingFollow(true);
    try {
      await onPressSeguir(!seguindo);
    } catch (error: unknown) {
      Alert.alert(
        "Erro",
        error instanceof Error ? error.message : "Não foi possível seguir."
      );
    } finally {
      setUpdatingFollow(false);
    }
  }

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
        onPress={() => void toggleFollow()}
        disabled={isOwnUser || !onPressSeguir || updatingFollow}
        activeOpacity={0.7}
        accessibilityLabel={seguindo ? "Deixar de seguir" : "Seguir usuário"}
      >
        <Text style={[styles.followText, seguindo && styles.followingText]}>
          {isOwnUser ? "Você" : seguindo ? "Seguindo" : "Seguir"}
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
