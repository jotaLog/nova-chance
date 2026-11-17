import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { isAxiosError } from "axios";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { updateMyAccount } from "../../services/authService";

function getErrorMessage(error: unknown) {
  if (isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error ?? "Não foi possível concluir a operação.";
  }
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
}

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function savePassword() {
    if (saving) return;
    setErrorMessage("");

    if (!currentPassword || !newPassword) {
      setErrorMessage("Preencha sua senha atual e a nova senha.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("A nova senha e a confirmação não são iguais.");
      return;
    }

    setSaving(true);
    try {
      await updateMyAccount({
        senha_atual: currentPassword,
        nova_senha: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Senha atualizada", "Sua senha foi alterada com sucesso.");
    } catch (error: unknown) {
      console.error("Erro ao alterar senha:", error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Feather name="arrow-left" size={20} color="#FFF" />
        <Text style={styles.backText}>Voltar à conta</Text>
      </Pressable>

      <Text style={styles.title}>Alterar senha</Text>
      <Text style={styles.subtitle}>
        Confirme sua senha atual e escolha uma nova senha para sua conta.
      </Text>

      <Text style={styles.label}>Senha atual</Text>
      <TextInput
        value={currentPassword}
        onChangeText={setCurrentPassword}
        style={styles.input}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        accessibilityLabel="Senha atual"
      />

      <Text style={styles.label}>Nova senha</Text>
      <TextInput
        value={newPassword}
        onChangeText={setNewPassword}
        style={styles.input}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        maxLength={100}
        accessibilityLabel="Nova senha"
      />

      <Text style={styles.label}>Confirmar nova senha</Text>
      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        maxLength={100}
        accessibilityLabel="Confirmar nova senha"
      />

      {errorMessage ? (
        <Text style={styles.errorMessage}>{errorMessage}</Text>
      ) : null}

      <Pressable
        style={[styles.primaryButton, saving && styles.disabledButton]}
        onPress={() => void savePassword()}
        disabled={saving}
      >
        <Text style={styles.primaryButtonText}>
          {saving ? "Salvando..." : "Salvar nova senha"}
        </Text>
      </Pressable>

      <View style={styles.forgotPasswordRow}>
        <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push("/forgot-password")}
        >
          <Text style={styles.forgotPasswordLink}>Recuperar acesso</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 22,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  backText: {
    color: "#DDD",
    fontSize: 14,
  },
  title: {
    marginTop: 18,
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 20,
    color: "#999",
    fontSize: 13,
    lineHeight: 19,
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    color: "#DDD",
    fontSize: 13,
  },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 6,
    color: "#FFF",
    backgroundColor: "#111",
  },
  errorMessage: {
    marginTop: 14,
    color: "#FF8888",
    fontSize: 13,
    lineHeight: 19,
  },
  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
    borderRadius: 6,
    backgroundColor: "#3CFF00",
  },
  primaryButtonText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.55,
  },
  forgotPasswordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 18,
  },
  forgotPasswordText: {
    color: "#AAA",
    fontSize: 13,
  },
  forgotPasswordLink: {
    color: "#3CFF00",
    fontSize: 13,
    fontWeight: "bold",
  },
});
