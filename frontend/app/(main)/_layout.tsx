import { useContext } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { SessionContext } from "../../contexts/sessionContext";

const hiddenTabOptions = {
  href: null,
  tabBarStyle: { display: "none" as const },
};

export default function MainLayout() {
  const session = useContext(SessionContext);
  const insets = useSafeAreaInsets();

  if (!session) {
    throw new Error("SessionContext não foi disponibilizado no layout principal.");
  }

  if (session.status !== "authenticated") {
    return (
      <View style={styles.gate}>
        {session.status === "checking" || session.status === "unauthenticated" ? (
          <ActivityIndicator color="#3CFF00" />
        ) : (
          <View style={styles.errorCard}>
            <Feather name="wifi-off" size={28} color="#FF8A8A" />
            <Text style={styles.errorText}>
              Não foi possível verificar sua sessão. Confira a conexão com o
              servidor e tente novamente.
            </Text>
            <Pressable
              style={styles.retryButton}
              onPress={session.retry}
              accessibilityRole="button"
            >
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
            <Pressable
              onPress={() => void session.endSession()}
              accessibilityRole="button"
            >
              <Text style={styles.loginLink}>Encerrar sessão e ir para login</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Tabs
        initialRouteName="feed"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#3CFF00",
          tabBarInactiveTintColor: "#929292",
          tabBarStyle: {
            height: 62 + insets.bottom,
            paddingTop: 6,
            paddingBottom: Math.max(insets.bottom, 5),
            backgroundColor: "#080808",
            borderTopColor: "#252525",
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "600",
          },
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen
          name="feed"
          options={{
            title: "Feed",
            tabBarIcon: ({ color, size }) => (
              <Feather name="home" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Buscar",
            tabBarIcon: ({ color, size }) => (
              <Feather name="search" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="clothesFeed"
          options={{
            title: "Trocas",
            tabBarIcon: ({ color, size }) => (
              <Feather name="repeat" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="postScreen"
          options={{
            title: "Publicar",
            tabBarIcon: ({ color, size }) => (
              <Feather name="plus-square" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Mensagens",
            tabBarIcon: ({ color, size }) => (
              <Feather name="message-circle" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
            tabBarIcon: ({ color, size }) => (
              <Feather name="user" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen name="add-clothes" options={hiddenTabOptions} />
        <Tabs.Screen name="wardrobe" options={hiddenTabOptions} />
        <Tabs.Screen name="conversation" options={hiddenTabOptions} />
        <Tabs.Screen name="settings" options={hiddenTabOptions} />
        <Tabs.Screen name="sensitive-settings" options={hiddenTabOptions} />
        <Tabs.Screen name="change-password" options={hiddenTabOptions} />
        <Tabs.Screen name="userProfile" options={{ href: null }} />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  gate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#000",
  },
  errorCard: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    padding: 24,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 6,
    backgroundColor: "#111",
  },
  errorText: {
    marginTop: 14,
    color: "#DDD",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  retryButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    marginTop: 20,
    borderRadius: 6,
    backgroundColor: "#3CFF00",
  },
  retryText: {
    color: "#000",
    fontWeight: "bold",
  },
  loginLink: {
    marginTop: 16,
    color: "#AAA",
    fontSize: 13,
  },
});
