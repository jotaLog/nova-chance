import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { isAxiosError } from "axios";
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import { getMyAccount, updateMyAccount } from "../../services/authService";
import { saveLoggedUser } from "../../services/storage";

function getErrorMessage(error: unknown) {
  if (isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error ?? "Não foi possível concluir a operação.";
  }
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
}

export default function SensitiveSettings() {
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const original = useRef({ email: "", cpf: "" });
  const pendingChanges = useRef<{ email?: string; cpf?: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadAccount() {
        setLoading(true);
        setErrorMessage("");
        try {
          const account = await getMyAccount();
          if (!active) return;
          original.current = { email: account.email, cpf: account.cpf };
          setEmail(account.email);
          setCpf(account.cpf);
        } catch (error: unknown) {
          console.error("Erro ao carregar dados sensíveis:", error);
          if (active) {
            Alert.alert(
              "Não foi possível carregar sua conta",
              getErrorMessage(error)
            );
          }
        } finally {
          if (active) setLoading(false);
        }
      }

      void loadAccount();
      return () => {
        active = false;
      };
    }, [])
  );

  function requestSensitiveChange() {
    setErrorMessage("");
    const updatedEmail = email.trim();
    const updatedCpf = cpf.trim();
    const emailChanged = updatedEmail !== original.current.email;
    const cpfChanged = updatedCpf !== original.current.cpf;
    const changes = {
      ...(emailChanged ? { email: updatedEmail } : {}),
      ...(cpfChanged ? { cpf: updatedCpf } : {}),
    };

    if (!emailChanged && !cpfChanged) {
      setErrorMessage("Altere o email ou o CPF antes de continuar.");
      return;
    }
    if ((emailChanged && !updatedEmail) || (cpfChanged && !updatedCpf)) {
      setErrorMessage("Email e CPF não podem ficar vazios.");
      return;
    }

    pendingChanges.current = changes;
    setCurrentPassword("");
    setErrorMessage("");
    setPasswordModalVisible(true);
  }

  async function confirmSensitiveChange() {
    const changes = pendingChanges.current;
    if (!changes || !currentPassword || saving) return;

    setSaving(true);
    setErrorMessage("");
    try {
      const account = await updateMyAccount({
        ...changes,
        senha_atual: currentPassword,
      });
      await saveLoggedUser(account);
      original.current = { email: account.email, cpf: account.cpf };
      setEmail(account.email);
      setCpf(account.cpf);
      setPasswordModalVisible(false);
      pendingChanges.current = null;
      setCurrentPassword("");
      Alert.alert("Dados atualizados", "Email e CPF foram atualizados.");
    } catch (error: unknown) {
      console.error("Erro ao atualizar email ou CPF:", error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function closePasswordModal() {
    if (saving) return;
    setPasswordModalVisible(false);
    setCurrentPassword("");
    setErrorMessage("");
    pendingChanges.current = null;
  }

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color="#3CFF00" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color="#FFF" />
          <Text style={styles.backText}>Voltar à conta</Text>
        </Pressable>

        <Text style={styles.title}>Alterar email e CPF</Text>
        <Text style={styles.subtitle}>
          Ao confirmar, informe sua senha atual. Emails de teste são aceitos,
          mas a recuperação de senha exige um endereço que receba mensagens.
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          maxLength={254}
          accessibilityLabel="Email"
        />

        <Text style={styles.label}>CPF</Text>
        <TextInput
          value={cpf}
          onChangeText={setCpf}
          style={styles.input}
          keyboardType="numeric"
          maxLength={20}
          accessibilityLabel="CPF"
        />

        {errorMessage && !passwordModalVisible ? (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        ) : null}

        <Pressable
          style={[styles.primaryButton, saving && styles.disabledButton]}
          onPress={requestSensitiveChange}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>Alterar dados</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closePasswordModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            <View style={styles.modalIcon}>
              <Feather name="lock" size={22} color="#3CFF00" />
            </View>
            <Text style={styles.confirmTitle}>Confirme sua senha</Text>
            <Text style={styles.confirmDescription}>
              Digite sua senha atual para salvar as alterações de email ou CPF.
            </Text>

            <Text style={styles.label}>Senha atual</Text>
            <TextInput
              value={currentPassword}
              onChangeText={(value) => {
                setCurrentPassword(value);
                setErrorMessage("");
              }}
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              accessibilityLabel="Senha atual"
              onSubmitEditing={() => void confirmSensitiveChange()}
            />
            {errorMessage ? (
              <Text style={styles.modalError}>{errorMessage}</Text>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={closePasswordModal}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.confirmButton,
                  (saving || !currentPassword) && styles.disabledButton,
                ]}
                onPress={() => void confirmSensitiveChange()}
                disabled={saving || !currentPassword}
              >
                <Text style={styles.confirmButtonText}>
                  {saving ? "Salvando..." : "Confirmar"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
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
    marginTop: 16,
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 22,
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
    minHeight: 44,
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
    marginTop: 24,
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
  modalBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
    backgroundColor: "rgba(0,0,0,0.78)",
  },
  confirmCard: {
    width: "100%",
    maxWidth: 420,
    padding: 22,
    borderWidth: 1,
    borderColor: "#393939",
    borderRadius: 6,
    backgroundColor: "#111",
  },
  modalIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#1A2A14",
  },
  confirmTitle: {
    marginTop: 14,
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  confirmDescription: {
    marginTop: 7,
    color: "#AAA",
    fontSize: 13,
    lineHeight: 19,
  },
  modalError: {
    marginTop: 8,
    color: "#FF8888",
    fontSize: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 22,
  },
  cancelButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 6,
  },
  cancelButtonText: {
    color: "#DDD",
    fontWeight: "600",
  },
  confirmButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    borderRadius: 6,
    backgroundColor: "#3CFF00",
  },
  confirmButtonText: {
    color: "#000",
    fontWeight: "bold",
  },
});
