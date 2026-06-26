import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

const COLORS = {
  green: "#2ECC71",
  white: "#FFFFFF",
  gray: "#9CA3AF",
  inactiveBar: "#2A2A2A",
};

export type PublishTabKey = "posts" | "salvos";

interface NavPublishProps {
  activeTab: PublishTabKey;
  onChangeTab: (tab: PublishTabKey) => void;
}

export default function NavPublish({ activeTab, onChangeTab }: NavPublishProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.tab}
        onPress={() => onChangeTab("posts")}
        activeOpacity={0.7}
      >
        <View style={styles.tabContent}>
          <Feather
            name="grid"
            size={16}
            color={activeTab === "posts" ? "#3CFF00" : COLORS.gray}
          />
          <Text style={[styles.tabLabel, activeTab === "posts" && styles.tabLabelActive]}>
            publicações
          </Text>
        </View>
        <View style={[styles.bar, activeTab === "posts" && styles.barActive]} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => onChangeTab("salvos")}
        activeOpacity={0.7}
      >
        <View style={styles.tabContent}>
          <Feather
            name="bookmark"
            size={16}
            color={activeTab === "salvos" ? "#3CFF00" : COLORS.gray}
          />
          <Text style={[styles.tabLabel, activeTab === "salvos" && styles.tabLabelActive]}>
            salvos
          </Text>
        </View>
        <View style={[styles.bar, activeTab === "salvos" && styles.barActive]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
  tab: {
    flex: 1,
    alignItems: "center",
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
  },
  tabLabel: {
    color: COLORS.gray,
    fontSize: 13,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: "#3CFF00",
  },
  bar: {
    width: "100%",
    height: 2,
    backgroundColor: COLORS.inactiveBar,
  },
  barActive: {
    backgroundColor: "#3CFF00",
  },
});
