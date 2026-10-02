import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

interface FormButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function FormButton({
  title,
  onPress,
  disabled = false,
  loading = false,
}: FormButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#000" />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#3CFF00",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },

  buttonText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "bold",
  },

  disabled: {
    opacity: 0.5,
  },
});
