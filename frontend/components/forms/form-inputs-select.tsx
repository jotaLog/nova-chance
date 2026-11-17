import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

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
  const [visible, setVisible] = useState(false);
  const selectedLabel =
    options.find((option) => option.value === selectedValue)?.label ?? placeholder;

  function selectOption(value: string) {
    onValueChange(value);
    setVisible(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.selectContainer}>
        <Pressable
          style={styles.selectButton}
          onPress={() => setVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${selectedLabel}`}
          accessibilityHint="Abre a lista de opções"
        >
          <Text
            style={[
              styles.selectedText,
              !selectedValue && styles.placeholderText,
            ]}
            numberOfLines={1}
          >
            {selectedLabel}
          </Text>
          <Feather name="chevron-down" size={20} color="#3CFF00" />
        </Pressable>
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Fechar opções"
          />
          <View style={styles.optionDialog}>
            <Text style={styles.dialogTitle}>{label}</Text>
            <ScrollView
              style={styles.optionList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Pressable
                style={[
                  styles.option,
                  !selectedValue && styles.selectedOption,
                ]}
                onPress={() => selectOption("")}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.optionText,
                    !selectedValue && styles.selectedOptionText,
                  ]}
                >
                  {placeholder}
                </Text>
              </Pressable>
          {options.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.option,
                option.value === selectedValue && styles.selectedOption,
              ]}
              onPress={() => selectOption(option.value)}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.optionText,
                  option.value === selectedValue && styles.selectedOptionText,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    borderRadius: 5,
    overflow: "hidden",
    height: 50,
    justifyContent: "center",
  },
  selectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  selectedText: {
    flex: 1,
    color: "#FFF",
    fontSize: 16,
  },
  placeholderText: {
    color: "#888",
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
  },
  optionDialog: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "75%",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    backgroundColor: "#111",
  },
  dialogTitle: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    color: "#3CFF00",
    fontSize: 16,
    fontWeight: "700",
  },
  optionList: {
    flexGrow: 0,
  },
  option: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderTopColor: "#242424",
  },
  selectedOption: {
    backgroundColor: "#1C3315",
  },
  optionText: {
    color: "#FFF",
    fontSize: 16,
  },
  selectedOptionText: {
    color: "#3CFF00",
    fontWeight: "600",
  },
});
