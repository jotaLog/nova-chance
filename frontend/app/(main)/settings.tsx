import { useCallback, useState } from "react";
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

import {
  deleteMyAccount,
  getMyAccount,
  updateMyAccount,
} from "../../services/authService";
import { logout, saveLoggedUser } from "../../services/storage";

function getErrorMessage(error: unknown) {
  if (isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error ?? "Não foi possível concluir a operação.";
  }
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
}

export default function Settings() {
  const [nome, setNome] = useState("");
  const [bio, setBio] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadAccount() {
        setLoading(true);
        try {
          const account = await getMyAccount();
          if (!active) return;
          setNome(account.nome);
          setBio(account.bio ?? "");
        } catch (error: unknown) {
          console.error("Erro ao carregar conta:", error);
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

  async function saveChanges() {
    if (saving) return;
    setSaving(true);
    try {
      const account = await updateMyAccount({
        nome: nome.trim(),
        bio: bio.trim(),
      });
      await saveLoggedUser(account);
      setNome(account.nome);
      setBio(account.bio ?? "");
      Alert.alert("Dados atualizados", "Seu nome e sua bio foram salvos.");
    } catch (error: unknown) {
      console.error("Erro ao salvar dados da conta:", error);
      Alert.alert("Não foi possível salvar", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function openDeleteConfirmation() {
    setDeletePassword("");
    setDeleteError("");
    setDeleteModalVisible(true);
  }

  async function performDeleteAccount() {
    if (!deletePassword) {
      setDeleteError("Digite sua senha para confirmar a exclusão.");
      return;
    }

    setSaving(true);
    setDeleteError("");
    try {
      await deleteMyAccount(deletePassword);
      await logout();
      setDeleteModalVisible(false);
      Alert.alert("Conta excluída", "Sua conta foi removida.", [
        { text: "OK", onPress: () => router.replace("/login") },
      ]);
    } catch (error: unknown) {
      console.error("Erro ao excluir conta:", error);
      setDeleteError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function switchUser() {
    await logout();
    router.replace("/login");
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
          <Text style={styles.backText}>Voltar ao perfil</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Informações do perfil</Text>
        <Text style={styles.label}>Nome</Text>
        <TextInput
          value={nome}
          onChangeText={setNome}
          style={styles.input}
          maxLength={100}
          accessibilityLabel="Nome"
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          style={[styles.input, styles.bioInput]}
          multiline
          maxLength={300}
          textAlignVertical="top"
          accessibilityLabel="Bio"
        />

        <Pressable
          style={[styles.primaryButton, saving && styles.disabledButton]}
          onPress={() => void saveChanges()}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>
            {saving ? "Salvando..." : "Salvar nome e bio"}
          </Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Dados sensíveis</Text>
        <Text style={styles.sectionDescription}>
          Email, CPF e senha são alterados em uma tela separada e exigem a
          confirmação da sua senha atual.
        </Text>
        <Pressable
          style={styles.linkButton}
          onPress={() => router.push("/change-password")}
        >
          <Feather name="lock" size={18} color="#3CFF00" />
          <Text style={styles.linkButtonText}>Alterar senha</Text>
          <Feather name="chevron-right" size={18} color="#888" />
        </Pressable>
        <Pressable
          style={styles.linkButton}
          onPress={() => router.push("/sensitive-settings")}
        >
          <Feather name="shield" size={18} color="#3CFF00" />
          <Text style={styles.linkButtonText}>Alterar email ou CPF</Text>
          <Feather name="chevron-right" size={18} color="#888" />
        </Pressable>

        <Text style={styles.sectionTitle}>Sessão</Text>
        <Pressable style={styles.secondaryButton} onPress={() => void switchUser()}>
          <Feather name="log-out" size={17} color="#FFF" />
          <Text style={styles.secondaryButtonText}>Trocar usuário</Text>
        </Pressable>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Excluir conta</Text>
          <Text style={styles.dangerDescription}>
            A exclusão é permanente. Você precisará confirmar sua senha. Trocas
            em andamento podem impedir a remoção para preservar o histórico.
          </Text>
          <Pressable
            style={[styles.deleteButton, saving && styles.disabledButton]}
            onPress={openDeleteConfirmation}
            disabled={saving}
          >
            <Feather name="trash-2" size={17} color="#FFF" />
            <Text style={styles.deleteButtonText}>Excluir minha conta</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            <View style={styles.modalIcon}>
              <Feather name="alert-triangle" size={23} color="#FF7777" />
            </View>
            <Text style={styles.confirmTitle}>Confirmar exclusão</Text>
            <Text style={styles.confirmDescription}>
              Essa ação é permanente. Digite sua senha para excluir a conta.
            </Text>

            <Text style={styles.label}>Senha atual</Text>
            <TextInput
              value={deletePassword}
              onChangeText={(value) => {
                setDeletePassword(value);
                setDeleteError("");
              }}
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              accessibilityLabel="Senha atual para excluir a conta"
              onSubmitEditing={() => void performDeleteAccount()}
            />
            {deleteError ? (
              <Text style={styles.deleteError}>{deleteError}</Text>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setDeleteModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.confirmDeleteButton,
                  (saving || !deletePassword) && styles.disabledButton,
                ]}
                onPress={() => void performDeleteAccount()}
                disabled={saving || !deletePassword}
              >
                <Text style={styles.deleteButtonText}>
                  {saving ? "Excluindo..." : "Excluir conta"}
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
  sectionTitle: {
    marginTop: 22,
    marginBottom: 10,
    color: "#3CFF00",
    fontSize: 15,
    fontWeight: "700",
  },
  sectionDescription: {
    marginBottom: 8,
    color: "#999",
    fontSize: 13,
    lineHeight: 19,
  },
  label: {
    marginTop: 9,
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
  bioInput: {
    minHeight: 90,
    paddingTop: 12,
  },
  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
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
  linkButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 6,
    marginTop: 8,
    backgroundColor: "#111",
  },
  linkButtonText: {
    flex: 1,
    color: "#EEE",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 6,
    backgroundColor: "#151515",
  },
  secondaryButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  dangerZone: {
    marginTop: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: "#5A2020",
    borderRadius: 6,
    backgroundColor: "#160C0C",
  },
  dangerTitle: {
    color: "#FF7777",
    fontSize: 15,
    fontWeight: "bold",
  },
  dangerDescription: {
    marginTop: 6,
    marginBottom: 12,
    color: "#BB9999",
    fontSize: 12,
    lineHeight: 18,
  },
  deleteButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 6,
    backgroundColor: "#A32929",
  },
  deleteButtonText: {
    color: "#FFF",
    fontWeight: "bold",
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
    backgroundColor: "#321717",
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
  deleteError: {
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
  confirmDeleteButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: "#A32929",
  },
});
