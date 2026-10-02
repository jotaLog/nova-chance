import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from "react-native";

interface FormInputProps extends TextInputProps {
  label: string;
}

export default function FormInput({
  label,
  ...props
}: FormInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        {...props}
        placeholderTextColor="#777"
        style={[styles.input, props.multiline && styles.multiline]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 8,
  },

  label: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  input: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    color: "#FFF",
    fontSize: 14,
  },

  multiline: {
    height: 110,
    textAlignVertical: "top",
    paddingTop: 12,
  },
});
