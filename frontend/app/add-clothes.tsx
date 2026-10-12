import { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, } from "react-native";
import { isAxiosError } from "axios";

import { Feather } from "@expo/vector-icons";

import ImageOptionsCard from "@/components/cards/imageOptionsCard";
import FormInput from "@/components/forms/form-inputs";
import FormSelect from "@/components/forms/form-inputs-select";
import FormButton from "@/components/forms/form-button";
import { registerClothes } from "@/services/authService";

export default function AddClothes() {
  const [showOptions, setShowOptions] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tamanho, setTamanho] = useState("");
  const [estado, setEstado] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleAddClothes() {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await registerClothes({
        id_categoria: Number(categoria),
        id_tamanho: Number(tamanho),
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        imagem_url: null,
        estado,
      });

      setSuccess("Roupa cadastrada com sucesso.");
      setNome("");
      setCategoria("");
      setTamanho("");
      setEstado("");
      setDescricao("");
      setImage(null);
    } catch (requestError: unknown) {
      console.error("Erro ao cadastrar roupa:", requestError);
      if (isAxiosError<{ error?: string }>(requestError)) {
        setError(
          requestError.response?.data?.error ??
            "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
        );
      } else {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível cadastrar a roupa. Tente novamente."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Adicionar roupa</Text>

      {/* FOTO */}
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={() => setShowOptions(true)}
        activeOpacity={0.8}
      >
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.image}
          />
        ) : (
          <>
            <Feather
              name="image"
              size={35}
              color="#3CFF00"
            />

            <Text style={styles.imageText}>
              Adicionar foto da peça
            </Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.photoHint}>
        A foto selecionada ainda não é enviada para o servidor.
      </Text>

      {/* FORMULÁRIO */}
      <View style={styles.form}>
        <FormInput
          label="Nome da peça"
          placeholder="Ex: Camiseta preta"
          value={nome}
          onChangeText={setNome}
        />

        <FormSelect
          label="Categoria"
          selectedValue={categoria}
          onValueChange={setCategoria}
          options={[
            { label: "Calça", value: "1" },
            { label: "Calçado", value: "2" },
            { label: "Camiseta", value: "3" },
            { label: "Casaco", value: "4" },
            { label: "Acessórios", value: "5" },
            { label: "Óculos", value: "6" },
            { label: "Meia", value: "7" },
          ]}
        />

        <FormSelect
          label="Tamanho"
          selectedValue={tamanho}
          onValueChange={setTamanho}
          options={[
            { label: "PP", value: "1" },
            { label: "P", value: "2" },
            { label: "M", value: "3" },
            { label: "G", value: "4" },
            { label: "GG", value: "5" },
            { label: "XG", value: "6" },
            { label: "Único", value: "7" },
          ]}
        />

        <FormSelect
          label="Estado da peça"
          selectedValue={estado}
          onValueChange={setEstado}
          options={[
            { label: "Novo", value: "novo" },
            { label: "Seminovo", value: "seminovo" },
            { label: "Bom estado", value: "bom_estado" },
            { label: "Usado", value: "usado" },
          ]}
        />

        <FormInput
          label="Descrição"
          placeholder="Conte um pouco sobre a peça..."
          value={descricao}
          onChangeText={setDescricao}
          multiline
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        <FormButton
          title="ADICIONAR ROUPA"
          onPress={handleAddClothes}
          disabled={!nome.trim() || !categoria || !tamanho || !estado}
          loading={loading}
        />
      </View>

      {/* CARD DE ESCOLHA DA IMAGEM */}
      <ImageOptionsCard
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        onImageSelected={(uri) => setImage(uri)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 25,
  },

  imageContainer: {
    width: "100%",
    height: 220,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#3CFF00",
    borderRadius: 15,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  imageText: {
    color: "#AAA",
    fontSize: 14,
  },

  photoHint: {
    color: "#666",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 25,
  },

  error: {
    color: "#FF5C5C",
    fontSize: 14,
  },

  success: {
    color: "#3CFF00",
    fontSize: 14,
  },

  form: {
    width: "100%",
    gap: 20,
  },
});