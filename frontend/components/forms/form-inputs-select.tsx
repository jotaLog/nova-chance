import { View, Text, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";

interface SelectOption {
  label: string;
  value: string;
}

interface FormSelectProps {
  label: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}

export default function FormSelect({
  label,
  selectedValue,
  onValueChange,
  options,
  placeholder = "Selecione uma opção",
}: FormSelectProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.selectContainer}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          dropdownIconColor="#3CFF00"
          style={styles.picker}
        >
          <Picker.Item
            label={placeholder}
            value=""
            color="#888"
          />

          {options.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
              color="#FFF"
            />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 8,
  },

  label: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },

  selectContainer: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    overflow: "hidden",
    height: 50,
    justifyContent: "center",
  },

  picker: {
    color: "#FFF",
    width: "100%",
  },
});
