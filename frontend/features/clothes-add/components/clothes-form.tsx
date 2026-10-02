import { Text, View, TextInput, StyleSheet, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { useState, useRef, useEffect } from "react";
import { router } from "expo-router";
import FormInput from "../../../components/forms/form-inputs";
import FormSelect from "../../../components/forms/form-inputs-select";
import FormButton from "../../../components/forms/form-button";

export function Clothes_form () {
    const scrollRef = useRef<ScrollView>(null);
    
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [tamanho, setTamanho] = useState("");
    const [condition, setCondition] = useState("");

    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    async function handleAddClothing() {

    }

    useEffect(() => {
      const keyboardDidShow = Keyboard.addListener("keyboardDidShow", () => {
        setKeyboardVisible(true);
        scrollRef.current?.scrollTo({
          y: 400,
          animated: true,
        });
      });

      const keyboardDidHide = Keyboard.addListener(
        "keyboardDidHide",
        () => {
          setKeyboardVisible(false);
        }
      );

      return () => {
        keyboardDidShow.remove();
        keyboardDidHide.remove();
      };
    }, []);

    return (
      <ScrollView
        contentContainerStyle={[styles.container, isKeyboardVisible && { paddingBottom: 300 }]}
        showsVerticalScrollIndicator={false}
        decelerationRate={0.3}
        ref={scrollRef}
      >
        <View style={[styles.formContainer]}>
          <FormInput
            label="Nome"
            placeholder="Digite o nome da roupa"
            value={name}
            onChangeText={setName}
          />

          <FormInput
            label="descrição"
            placeholder="Digite a descrição da roupa"
            value={description}
            onChangeText={setDescription}
          />

          <FormSelect
            label="Categoria"
            selectedValue={category}
            onValueChange={setCategory}
            options={[
              { label: "Camiseta", value: "camiseta" },
              { label: "Calça", value: "calça" },
              { label: "Vestido", value: "vestido" },
            ]}
          />

          <FormSelect
            label="Tamanho"
            selectedValue={tamanho}
            onValueChange={setTamanho}
            options={[  
              { label: "PP", value: "pp" },  
              { label: "P", value:  "p" },
              { label: "M", value: "m" },
              { label: "G", value: "g" },
              { label: "GG", value: "gg" },
              { label: "XG", value: "xg" },
            ]}
          />

          <FormSelect
            label="Condição"
            selectedValue={condition}
            onValueChange={setCondition}
            options={[  
              { label: "Nova", value: "nova" },  
              { label: "Usada", value:  "usada" },
              { label: "Desgastada", value: "desgastada" },
            ]}
          />
        </View>

        <View>
          <FormButton title="Adicionar Roupa" onPress={handleAddClothing} />
        </View>
      </ScrollView>
    );
}  

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    formContainer: {
        padding: 20,
    },
    FormSelect: {
        fontSize: 16,
        color: "#000000",
    },
}); 