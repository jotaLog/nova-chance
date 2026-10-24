import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

interface CamPhotoProps {
  onImageSelected: (image: {
    uri: string;
    base64: string;
    mimeType: string;
  }) => void;
}

export default function CamPhoto({ onImageSelected }: CamPhotoProps) {
  const [loading, setLoading] = useState(false);

  async function takePhoto() {
    setLoading(true);

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permissão necessária",
          "Permita o acesso à câmera para tirar uma foto."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      const image = result.assets?.[0];
      if (!result.canceled && image) {
        if (!image.base64) {
          Alert.alert("Erro", "Não foi possível ler os dados da foto.");
          return;
        }

        onImageSelected({
          uri: image.uri,
          base64: image.base64,
          mimeType: image.mimeType ?? "image/jpeg",
        });
      }
    } catch (error: unknown) {
      console.error("Erro ao tirar foto para publicação:", error);
      Alert.alert(
        "Erro",
        "Não foi possível abrir a câmera. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={takePhoto}
      disabled={loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Tirar foto para publicação"
    >
      <Feather name="camera" size={20} color="#000" />
      <Text style={styles.buttonText}>
        {loading ? "Abrindo câmera..." : "Tirar foto"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#3CFF00",
  },
  buttonText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "bold",
  },
});