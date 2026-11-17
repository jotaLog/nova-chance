import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { isAxiosError } from "axios";
import { router } from "expo-router";

import CamPhoto from "@/features/postScreen/cam-photo";
import ChosePhoto from "@/features/postScreen/chose-photo";
import { publishPost } from "@/services/postService";
import { logout } from "@/services/storage";

export default function PostScreen() {
  const [image, setImage] = useState<{
    uri: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const [description, setDescription] = useState("");
  const [publishing, setPublishing] = useState(false);

  async function handlePublish() {
    if (!image || publishing) {
      return;
    }

    setPublishing(true);
    try {
      await publishPost({
        imagemBase64: image.base64,
        mimeType: image.mimeType,
        description: description.trim(),
      });
      setImage(null);
      setDescription("");
      Alert.alert(
        "Publicado com sucesso",
        "Sua publicação foi compartilhada no feed."
      );
    } catch (error: unknown) {
      console.error("Erro ao publicar post:", error);
      if (isAxiosError<{ error?: string }>(error)) {
        if (error.response?.status === 401) {
          await logout();
          Alert.alert(
            "Sessão inválida",
            "Faça login novamente para publicar um post.",
            [{ text: "Fazer login", onPress: () => router.replace("/login") }]
          );
        } else if (!error.response) {
          Alert.alert(
            "API indisponível",
            "Não foi possível conectar ao backend. Inicie o servidor e verifique se o dispositivo está na mesma rede."
          );
        } else {
          Alert.alert(
            "Não foi possível publicar",
            error.response?.data?.error ??
              "Não foi possível conectar ao servidor. Tente novamente."
          );
        }
      } else {
        Alert.alert(
          "Não foi possível publicar",
          error instanceof Error
            ? error.message
            : "O post não foi salvo. Tente novamente."
        );
      }
    } finally {
      setPublishing(false);
    }
  }

  return (
    <View style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TextInput
          style={styles.captionInput}
          value={description}
          onChangeText={setDescription}
          placeholder="Escreva uma descrição para o post..."
          placeholderTextColor="#777"
          maxLength={500}
          multiline
          textAlignVertical="top"
          accessibilityLabel="Descrição do post"
        />
        <Text style={styles.characterCount}>{description.length}/500</Text>

        <View style={styles.preview}>
          {image ? (
            <Image
              source={{ uri: image.uri }}
              style={styles.image}
              resizeMode="cover"
              accessibilityLabel="Prévia da imagem da publicação"
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>
                A imagem escolhida aparecerá aqui
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <CamPhoto onImageSelected={setImage} />
          <ChosePhoto onImageSelected={setImage} />
        </View>

        <TouchableOpacity
          style={[
            styles.publishButton,
            (!image || publishing) && styles.publishButtonDisabled,
          ]}
          onPress={handlePublish}
          disabled={!image || publishing}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Confirmar publicação do post"
        >
          <Text style={styles.publishButtonText}>
            {publishing ? "Publicando..." : "Publicar post"}
          </Text>
        </TouchableOpacity>

        {image ? (
          <Text style={styles.selectedHint}>
            Imagem selecionada. Você pode escolher outra quando quiser.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  captionInput: {
    minHeight: 96,
    marginBottom: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 6,
    color: "#FFF",
    fontSize: 15,
    backgroundColor: "#111",
  },
  characterCount: {
    marginBottom: 16,
    color: "#777",
    fontSize: 12,
    textAlign: "right",
  },
  preview: {
    width: "100%",
    aspectRatio: 4 / 5,
    overflow: "hidden",
    borderRadius: 6,
    backgroundColor: "#151515",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#444",
    borderRadius: 6,
  },
  placeholderText: {
    color: "#777",
    fontSize: 15,
    textAlign: "center",
  },
  actions: {
    gap: 12,
    marginTop: 20,
  },
  publishButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    borderRadius: 6,
    backgroundColor: "#3CFF00",
  },
  publishButtonDisabled: {
    backgroundColor: "#315022",
  },
  publishButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  selectedHint: {
    marginTop: 14,
    color: "#3CFF00",
    fontSize: 13,
    textAlign: "center",
  },
});