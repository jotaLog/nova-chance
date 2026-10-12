import {View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, ActivityIndicator,} from "react-native";

import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

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

  // Abrir galeria
  async function selectFromGallery() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        alert("Precisamos de permissão para acessar sua galeria.");
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (!result.canceled) {
        onImageSelected(result.assets[0].uri);
        onClose();
      }

    } catch (error) {
      console.log("Erro ao selecionar imagem:", error);
    }
  }

  // Abrir câmera
  async function takePhoto() {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        alert("Precisamos de permissão para acessar sua câmera.");
        return;
      }

      const result =
        await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (!result.canceled) {
        onImageSelected(result.assets[0].uri);
        onClose();
      }

    } catch (error) {
      console.log("Erro ao tirar foto:", error);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>

          <TouchableWithoutFeedback>
            <View style={styles.card}>

              <View style={styles.indicator} />

              <View style={styles.header}>
                <Text style={styles.title}>
                  Adicionar imagem
                </Text>

                <TouchableOpacity onPress={onClose}>
                  <Feather
                    name="x"
                    size={23}
                    color="#FFF"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>
                Escolha como deseja adicionar a foto da sua peça.
              </Text>

              {/* Opções */}
              <View style={styles.options}>

                <TouchableOpacity
                  style={styles.option}
                  onPress={selectFromGallery}
                  disabled={loading}
                >
                  <View style={styles.iconContainer}>
                    <Feather
                      name="image"
                      size={25}
                      color="#3CFF00"
                    />
                  </View>

                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>
                      Escolher da galeria
                    </Text>

                    <Text style={styles.optionDescription}>
                      Selecione uma imagem do seu celular.
                    </Text>
                  </View>

                  <Feather
                    name="chevron-right"
                    size={20}
                    color="#777"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.option}
                  onPress={takePhoto}
                  disabled={loading}
                >
                  <View style={styles.iconContainer}>
                    <Feather
                      name="camera"
                      size={25}
                      color="#3CFF00"
                    />
                  </View>

                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>
                      Tirar uma foto
                    </Text>

                    <Text style={styles.optionDescription}>
                      Abra a câmera e fotografe sua peça.
                    </Text>
                  </View>

                  <Feather
                    name="chevron-right"
                    size={20}
                    color="#777"
                  />
                </TouchableOpacity>

              </View>

            </View>
          </TouchableWithoutFeedback>

        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },

  card: {
    backgroundColor: "#111",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 3,
  },

  indicator: {
    width: 40,
    height: 4,
    borderRadius: 5,
    backgroundColor: "#555",
    alignSelf: "center",
    marginBottom: 22,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#999",
    fontSize: 13,
    marginTop: 8,
    marginBottom: 22,
  },

  options: {
    gap: 12,
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 3,
    padding: 14,
    gap: 12,
  },

  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },

  optionText: {
    flex: 1,
    gap: 4,
  },

  optionTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },

  optionDescription: {
    color: "#888",
    fontSize: 11,
  },
});
