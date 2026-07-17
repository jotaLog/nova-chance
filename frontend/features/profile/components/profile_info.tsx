import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

const COLORS = {
  background: "#000000",
  green: "#3CFF00",
  white: "#FFFFFF",
  gray: "#9CA3AF",
  border: "#3CFF00",
};

export interface ProfileStats {
  publicacoes: number;
  seguindo: number;
  seguidores: number;
}

export interface ProfileInfoData {
  avatarUrl?: string; // se vier vazio, mostra um ícone de placeholder
  name: string;
  username: string;
  stats: ProfileStats;
  tagIcon?: keyof typeof Feather.glyphMap;
  tagText: string; // ex: "estilo próprio" ou "closet sempre"
  tagHighlight?: string; // parte em destaque (verde), ex: "atualizado" ou "@dudinhawagirl"
  location: string;
}

interface ProfileInfoProps {
  data: ProfileInfoData;
  isOwnProfile: boolean;
  isFollowing?: boolean;
  onSettingsPress?: () => void;
  onFollowPress?: () => void;
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileInfo({
  data,
  isOwnProfile,
  isFollowing = false,
  onSettingsPress,
  onFollowPress,
}: ProfileInfoProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {data.avatarUrl ? (
          <Image source={{ uri: data.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Feather name="user" size={28} color={"#3CFF00"} />
          </View>
        )}

        <View style={styles.nameBlock}>
          <Text style={styles.name}>{data.name}</Text>
          <Text style={styles.username}>@{data.username}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatItem label="publicações" value={data.stats.publicacoes} />
        <StatItem label="seguindo" value={data.stats.seguindo} />
        <StatItem label="seguidores" value={data.stats.seguidores} />
      </View>

      {isOwnProfile ? (
        <TouchableOpacity style={styles.actionButton} onPress={onSettingsPress} activeOpacity={0.7}>
          <Feather name="settings" size={16} color={"#3CFF00"} />
          <Text style={styles.actionButtonText}>configurações</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.actionButton} onPress={onFollowPress} activeOpacity={0.7}>
          <Text style={styles.actionButtonText}>{isFollowing ? "seguindo" : "seguir"}</Text>
        </TouchableOpacity>
      )}

      {!!data.tagText && (
        <View style={styles.tagRow}>
          {data.tagIcon && <Feather name={data.tagIcon} size={14} color={"#3CFF00"} />}
          <Text style={styles.tagText}>
            {data.tagText}{" "}
            {!!data.tagHighlight && <Text style={styles.tagHighlight}>{data.tagHighlight}</Text>}
          </Text>
        </View>
      )}

      <View style={styles.locationRow}>
        <Feather name="map-pin" size={14} color={COLORS.gray} />
        <Text style={styles.locationText}>{data.location}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#3CFF00",
    alignItems: "center",
    justifyContent: "center",
  },
  nameBlock: {
    gap: 2,
  },
  name: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  username: {
    color: COLORS.gray,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 4,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  statLabel: {
    color: COLORS.gray,
    fontSize: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 10,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tagText: {
    color: COLORS.white,
    fontSize: 13,
  },
  tagHighlight: {
    color: "#3CFF00",
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    color: COLORS.gray,
    fontSize: 13,
  },
});
