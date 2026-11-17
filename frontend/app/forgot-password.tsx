import { useState } from "react";
import {
  ActivityIndicator,
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

import { requestPasswordReset } from "../services/authService";

function getErrorMessage(error: unknown) {
  if (isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error ?? "Não foi possível solicitar a recuperação.";
  }
  return error instanceof Error
    ? error.message
    : "Não foi possível solicitar a recuperação.";
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  async function submitRequest() {
    if (submitting) return;
    setErrorMessage("");
    if (!email.trim()) {
      setErrorMessage("Informe o email da sua conta.");
      return;
    }

    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setRequestSent(true);
    } catch (error: unknown) {
      console.error("Erro ao solicitar recuperação de senha:", error);
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
            name={requestSent ? "mail" : "key"}
            size={24}
            color="#3CFF00"
          />
        </View>
        <Text style={styles.title}>
          {requestSent ? "Verifique seu email" : "Recuperar senha"}
        </Text>
        <Text style={styles.description}>
          {requestSent
            ? "Se esse email estiver cadastrado, enviaremos um link para redefinir sua senha. O link expira em 30 minutos."
            : "Informe o email associado à sua conta. Enviaremos um link seguro para redefinir sua senha."}
        </Text>

        {!requestSent ? (
          <>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              accessibilityLabel="Email da conta"
              editable={!submitting}
            />
            {errorMessage ? (
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            ) : null}
            <Pressable
              style={[styles.primaryButton, submitting && styles.disabledButton]}
              onPress={() => void submitRequest()}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.primaryButtonText}>Enviar link</Text>
              )}
            </Pressable>
          </>
        ) : null}

        <Pressable
          style={styles.backLink}
          onPress={() => router.replace("/login")}
          accessibilityRole="link"
        >
          <Text style={styles.backLinkText}>Voltar ao login</Text>
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
    marginTop: 22,
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
    marginTop: 18,
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
