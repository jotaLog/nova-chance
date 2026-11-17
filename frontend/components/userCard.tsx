import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

interface UserCardProps {
  nome: string;
  lastMessage?: string;
  timeAgo?: string;
  foto_perfil?: string | null;
  onPress?: () => void;
}

export default function UserCard({
  nome,
  lastMessage,
  timeAgo,
  foto_perfil,
  onPress,
}: UserCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarContainer}>
        {foto_perfil ? (
          <Image source={{ uri: foto_perfil }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Feather name="user" size={22} color="#3CFF00" />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.nome}>{nome}</Text>
        {lastMessage ? (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessage}
          </Text>
        ) : null}
      </View>

      {timeAgo ? (
        <Text style={styles.timeAgo}>{timeAgo}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    backgroundColor: "#000",
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#3CFF00",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  nome: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  lastMessage: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  timeAgo: {
    color: "#9CA3AF",
    fontSize: 12,
    alignSelf: "flex-start",
    marginTop: 2,
  },
});