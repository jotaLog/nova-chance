import { useState } from "react";
import {
  Alert,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";

interface PostActionsProps {
  curtidasIniciais?: number;
  curtidoInicialmente?: boolean;
  salvoInicialmente?: boolean;
  comentarios?: number;
  onPressCurtir?: (curtido: boolean) => void | Promise<void>;
  onPressComentar?: () => void;
  onPressSalvar?: (salvo: boolean) => void | Promise<void>;
  onPressMenu?: () => void;
}

export default function PostActions({
  curtidasIniciais = 0,
  curtidoInicialmente = false,
  salvoInicialmente = false,
  comentarios = 0,
  onPressCurtir,
  onPressComentar,
  onPressSalvar,
  onPressMenu,
}: PostActionsProps) {
  const [processingLike, setProcessingLike] = useState(false);
  const [processingSave, setProcessingSave] = useState(false);

  const curtido = curtidoInicialmente;
  const salvo = salvoInicialmente;
  const curtidas = curtidasIniciais;

  async function alternarCurtida() {
    if (processingLike) return;
    const novoEstado = !curtido;

    setProcessingLike(true);
    try {
      await onPressCurtir?.(novoEstado);
    } catch (error: unknown) {
      Alert.alert(
        "Erro",
        error instanceof Error ? error.message : "Não foi possível curtir."
      );
    } finally {
      setProcessingLike(false);
    }
  }

  async function alternarSalvo() {
    if (processingSave) return;
    const novoEstado = !salvo;

    setProcessingSave(true);
    try {
      await onPressSalvar?.(novoEstado);
    } catch (error: unknown) {
      Alert.alert(
        "Erro",
        error instanceof Error ? error.message : "Não foi possível salvar."
      );
    } finally {
      setProcessingSave(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.leftActions}>
        <TouchableOpacity
          style={styles.actionWithCount}
          onPress={() => void alternarCurtida()}
          disabled={processingLike}
          activeOpacity={0.7}
          accessibilityLabel={curtido ? "Descurtir" : "Curtir"}
        >
          <Feather
            name="heart"
            size={23}
            color={curtido ? "#3CFF00" : "#FFF"}
          />
          <Text style={styles.countText}>{curtidas}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionWithCount}
          onPress={onPressComentar}
          activeOpacity={0.7}
          accessibilityLabel="Comentar"
        >
          <Feather name="message-circle" size={23} color="#FFF" />
          <Text style={styles.countText}>{comentarios}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.action}
          onPress={() => {}}
          activeOpacity={0.7}
          accessibilityLabel="Compartilhar"
        >
          <Feather name="send" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.action}
          onPress={() => void alternarSalvo()}
          disabled={processingSave}
          activeOpacity={0.7}
          accessibilityLabel={salvo ? "Remover dos salvos" : "Salvar"}
        >
          <Feather
            name="bookmark"
            size={23}
            color={salvo ? "#3CFF00" : "#FFF"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.action}
          onPress={onPressMenu}
          activeOpacity={0.7}
          accessibilityLabel="Mais opções da publicação"
        >
          <Feather name="more-vertical" size={23} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  action: {
    paddingVertical: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  actionWithCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 3,
  },
  countText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
  },
});
