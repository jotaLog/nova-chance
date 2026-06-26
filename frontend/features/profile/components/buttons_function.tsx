import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const COLORS = {
  green: "#2ECC71",
  white: "#FFFFFF",
};

interface ButtonsFunctionProps {
  onTrocarPress?: () => void;
  onArmarioPress?: () => void;
  onDoarPress?: () => void;
}

export default function ButtonsFunction({
  onTrocarPress,
  onArmarioPress,
  onDoarPress,
}: ButtonsFunctionProps) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.button} onPress={onTrocarPress} activeOpacity={0.7}>
        <Text style={styles.buttonText}>trocar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={onArmarioPress} activeOpacity={0.7}>
        <Text style={styles.buttonText}>armario</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={onDoarPress} activeOpacity={0.7}>
        <Text style={styles.buttonText}>doar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  button: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#3CFF00",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
});
