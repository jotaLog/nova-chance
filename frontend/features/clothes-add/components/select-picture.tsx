import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

interface ImageOptionsCardProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (uri: string) => void;
}

export default function ImageOptionsCard({
  visible,
  onClose,
  onImageSelected,
}: ImageOptionsCardProps) {
  const [loading, setLoading] = useState(false);

  async function chooseImage(source: "camera" | "library") {
    setLoading(true);

    try {
      const permission =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permissão necessária",
          source === "camera"
            ? "Permita o acesso à câmera para tirar uma foto."
            : "Permita o acesso às fotos para escolher uma imagem."
        );
        return;
      }

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              quality: 1,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              quality: 1,
            });

      const image = result.assets?.[0];
      if (!result.canceled && image) {
        onImageSelected(image.uri);
        onClose();
      }
    } catch (error: unknown) {
      console.error("Erro ao selecionar imagem:", error);
      Alert.alert(
        "Erro",
        "Não foi possível abrir a câmera ou as fotos. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Adicionar foto</Text>

          <Pressable
            style={styles.option}
            onPress={() => chooseImage("camera")}
            disabled={loading}
          >
            <Text style={styles.optionText}>Tirar foto</Text>
          </Pressable>

          <Pressable
            style={styles.option}
            onPress={() => chooseImage("library")}
            disabled={loading}
          >
            <Text style={styles.optionText}>Escolher da galeria</Text>
          </Pressable>

          <Pressable
            style={styles.cancel}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  card: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#151515",
  },
  title: {
    marginBottom: 12,
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  option: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  optionText: {
    color: "#FFF",
    fontSize: 16,
  },
  cancel: {
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 12,
  },
  cancelText: {
    color: "#3CFF00",
    fontSize: 16,
    fontWeight: "bold",
  },
});