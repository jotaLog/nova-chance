import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { isAxiosError } from "axios";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { resetPassword } from "../services/authService";
import { logout } from "../services/storage";

function getErrorMessage(error: unknown) {
  if (isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error ?? "Não foi possível redefinir a senha.";
  }
  return error instanceof Error
    ? error.message
    : "Não foi possível redefinir a senha.";
}

export default function ResetPassword() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(
    token ? "" : "O link não contém um token válido."
  );
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  async function submitNewPassword() {
    if (submitting || !token) return;
    setErrorMessage("");
    if (newPassword.length < 6) {
      setErrorMessage("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("A senha e a confirmação não são iguais.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      await logout();
      setCompleted(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      console.error("Erro ao redefinir senha:", error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <View style={styles.icon}>
          <Feather
            name={completed ? "check" : "lock"}
            size={24}
            color="#3CFF00"
          />
        </View>
        <Text style={styles.title}>
          {completed ? "Senha redefinida" : "Criar nova senha"}
        </Text>
        <Text style={styles.description}>
          {completed
            ? "Sua senha foi alterada. Entre novamente com a nova senha."
            : "Escolha uma senha com pelo menos 6 caracteres."}
        </Text>

        {!completed && token ? (
          <>
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
              style={[styles.primaryButton, submitting && styles.disabledButton]}
              onPress={() => void submitNewPassword()}
              disabled={submitting}
            >
              <Text style={styles.primaryButtonText}>
                {submitting ? "Salvando..." : "Redefinir senha"}
              </Text>
            </Pressable>
          </>
        ) : null}

        {errorMessage && !token ? (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        ) : null}

        {(completed || !token) && (
          <Pressable
            style={styles.backLink}
            onPress={() => router.replace("/login")}
            accessibilityRole="link"
          >
            <Text style={styles.backLinkText}>Voltar ao login</Text>
          </Pressable>
        )}
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
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: 24,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 6,
    backgroundColor: "#111",
  },
  icon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#1A2A14",
  },
  title: {
    marginTop: 16,
    color: "#FFF",
    fontSize: 23,
    fontWeight: "bold",
  },
  description: {
    marginTop: 8,
    color: "#AAA",
    fontSize: 14,
    lineHeight: 21,
  },
  label: {
    marginTop: 18,
    marginBottom: 7,
    color: "#DDD",
    fontSize: 13,
  },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#3CFF00",
    borderRadius: 6,
    color: "#FFF",
    backgroundColor: "#080808",
  },
  errorMessage: {
    marginTop: 10,
    color: "#FF8888",
    fontSize: 13,
    lineHeight: 19,
  },
  primaryButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    borderRadius: 6,
    backgroundColor: "#3CFF00",
  },
  primaryButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
  backLink: {
    alignSelf: "center",
    marginTop: 20,
    padding: 8,
  },
  backLinkText: {
    color: "#3CFF00",
    fontSize: 13,
    fontWeight: "bold",
  },
});
