import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

interface ChosePhotoProps {
  onImageSelected: (image: {
    uri: string;
    base64: string;
    mimeType: string;
  }) => void;
}

export default function ChosePhoto({ onImageSelected }: ChosePhotoProps) {
  const [loading, setLoading] = useState(false);

  async function choosePhoto() {
    setLoading(true);

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permissão necessária",
          "Permita o acesso às fotos para escolher uma imagem."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      const image = result.assets?.[0];
      if (!result.canceled && image) {
        if (!image.base64) {
          Alert.alert("Erro", "Não foi possível ler os dados da imagem.");
          return;
        }

        onImageSelected({
          uri: image.uri,
          base64: image.base64,
          mimeType: image.mimeType ?? "image/jpeg",
        });
      }
    } catch (error: unknown) {
      console.error("Erro ao selecionar foto para publicação:", error);
      Alert.alert(
        "Erro",
        "Não foi possível abrir a galeria. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={choosePhoto}
      disabled={loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Escolher foto da galeria para publicação"
    >
      <Feather name="image" size={20} color="#FFF" />
      <Text style={styles.buttonText}>
        {loading ? "Abrindo galeria..." : "Escolher da galeria"}
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
    borderWidth: 1,
    borderColor: "#3CFF00",
    backgroundColor: "#111",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
  },
});