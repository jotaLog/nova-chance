import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

interface PostActionsProps {
  curtidasIniciais?: number;
  curtidoInicialmente?: boolean;
  salvoInicialmente?: boolean;
  comentarios?: number;
  onPressCurtir?: (curtido: boolean) => void;
  onPressComentar?: () => void;
  onPressSalvar?: (salvo: boolean) => void;
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
  const [curtido, setCurtido] = useState(curtidoInicialmente);
  const [salvo, setSalvo] = useState(salvoInicialmente);

  const [curtidas, setCurtidas] = useState(
    curtidasIniciais
  );

  function alternarCurtida() {
    const novoEstado = !curtido;

    setCurtido(novoEstado);
    setCurtidas((atual) => atual + (novoEstado ? 1 : -1));

    onPressCurtir?.(novoEstado);
  }

  function alternarSalvo() {
    const novoEstado = !salvo;

    setSalvo(novoEstado);
    onPressSalvar?.(novoEstado);
  }

  return (
    <View style={styles.container}>
      <View style={styles.leftActions}>
        <TouchableOpacity
          style={styles.actionWithCount}
          onPress={alternarCurtida}
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
          onPress={alternarSalvo}
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
