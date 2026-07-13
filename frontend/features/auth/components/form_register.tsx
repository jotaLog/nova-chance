import { Text, View, TextInput, StyleSheet, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import Checkbox from "expo-checkbox";
import { useState, useRef, useEffect } from "react";
import { FontAwesome } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { registerUser } from "../../../services/userService";

const Logo = require("../assets/image/logo-nova-chance.png");

export function FormRegister() {
  const [nome,setNome] = useState("");
  const [email,setEmail] = useState("");
  const [senha,setPassword] = useState("");
  const [cpf,setCpf] = useState("");

  async function handleRegisterUser() {
    try {
      const response = await registerUser({
        nome: nome,
        email: email,
        senha: senha,
        cpf: cpf,
        foto_perfil: null,
        bio: null
    });
    console.log(response);
    } catch (error) {
      console.error(error);
    }
  }

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);

      if (keyboardDidShow ) {
        scrollRef.current?.scrollTo({
          y: 400,
          animated: true,
        });
      }

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

  const scrollRef = useRef<ScrollView>(null);

  if (!acceptTerms) {
    console.log("Necessário aceitar os Termos de Uso e Política de Privacidade para criar uma conta.");
  }

  return (

    <ScrollView
      contentContainerStyle={[styles.container, isKeyboardVisible && { paddingBottom: 300 },]}
      showsVerticalScrollIndicator={false}
      decelerationRate={0.30}
      ref={scrollRef}
    >
      <View style={styles.content}>

        <View style={styles.container_logo}>
          <Image
            source={Logo}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

      {/* /////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}

        <View style={styles.container_title}>
          <Text style={styles.title}>Crie sua Conta!</Text>
        </View>

        <View style={styles.container_enter}>
          <TouchableOpacity style={styles.enter_methods}>
            <View style={styles.icon_container}>
              <FontAwesome 
              name="google"
              size={16}
              color="#fff" 
            />
            </View>
            <Text style={styles.enterMethods_txt_cont}> Entrar com google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.enter_methods}>
            <View style={styles.icon_container}>
              <MaterialIcons 
              name="phone-android"
              size={16}
              color="#fff" 
            />
            </View>
            <Text style={styles.enterMethods_txt_cont}> Entrar com Telefone</Text>
          </TouchableOpacity>
        </View>

      {/* /////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}

        <View style={styles.inputGroup}>
          <Text style={styles.txt_input_group}>
            Nome completo
          </Text>
          <TextInput
            placeholder=" "
            placeholderTextColor="#aaa"
            style={styles.input}
            onFocus={() => {
              scrollRef.current?.scrollTo({
                y: 250,
                animated: true,
              });
            }}
          />
          <Text style={styles.txt_input_group}>
            Email
          </Text>
          <TextInput
            placeholder=" "
            placeholderTextColor="#aaa"
            style={styles.input}
            // onFocus={() => {
            //   scrollRef.current?.scrollTo({
            //     y: 250,
            //     animated: true,
            //   });
            // }}
          />
          <Text style={styles.txt_input_group}>
            Senha
          </Text>
          
          <View style={styles.passwordContainer}>

            <TextInput
              placeholder=""
              placeholderTextColor="#aaa"
              secureTextEntry={!showPassword}
              style={styles.passwordInput}

              onFocus={() => {
                setIsPasswordFocused(true);
              }}
              onBlur={() => {
                setIsPasswordFocused(false);
              }}
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialIcons
                name={showPassword ? "visibility-off" : "visibility"}
                size={22}
                color="#999"
              />
            </TouchableOpacity>

          </View>

          {/* <Text style={styles.txt_input_group}>
            Confirmar Senha
          </Text>
          
          <View style={styles.passwordContainer}>

            <TextInput
              placeholder=""
              placeholderTextColor="#aaa"
              secureTextEntry={!showPassword}
              style={styles.passwordInput}

              onFocus={() => {
                setIsPasswordFocused(true);
              }}
              onBlur={() => {
                setIsPasswordFocused(false);
              }}
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialIcons
                name={showPassword ? "visibility-off" : "visibility"}
                size={22}
                color="#999"
              />
            </TouchableOpacity>

          </View> */}
        </View>

      {/* /////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}

        <View style={styles.container_terms}>
          <Checkbox
            value={acceptTerms}
            onValueChange={setAcceptTerms}
            color={acceptTerms ? "#3CFF00" : undefined}
          />
          <Text style={styles.terms_txt}>
            Aceito os{" "}
            <Text style={styles.link_terms}>
              Termos de Uso
            </Text>
            {" "}e a{" "}
            <Text style={styles.link_terms}>
              Política de Privacidade
            </Text>
          </Text>
        </View>

      {/* /////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}

        <View style={styles.button_container}>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>CRIAR CONTA</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.container_have_account}>
          <Text style={styles.have_txt}>
            Já tem uma conta? <Text style={styles.login_link}>Entrar</Text>
          </Text>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",  
    paddingHorizontal: 20,

    paddingTop: 50,
    paddingBottom: 100,

    padding: 10,
    margin: 10,
  },

  content: {
    width: "100%",
    maxWidth: 400,
  },

  container_logo: {
    alignItems: "center",
    marginBottom: 20,
  },

  logo: {
    width: 260,
    height: 160,
    resizeMode: "contain"
  },

  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },


  container_enter: {
    alignItems: "center",
    paddingVertical: 10,
  },

  enter_methods: {
    borderColor: "#3CFF00",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#111",

    margin: 10,
    padding: 10,
    paddingVertical: 7,
    paddingHorizontal: 14,
      
    color: '#ffff',

    maxWidth: 354,
    width: "100%",
    height: 40,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  icon_container: {
    width: 20,
    alignItems: "center",
  },

  enterMethods_txt_cont: {
    fontSize: 16,
    color: "#fff",      
  },

  container_title: {
    alignItems: "center",
    marginBottom: 25,
  },

  inputGroup: {
    gap: 15,
    marginBottom: 20,
    paddingTop: 20,
  },

  txt_input_group: {
    color: "#fff",
    fontSize: 16,
  },

  input: {
    borderColor: "#3CFF00",
    borderWidth: 1,
    borderRadius: 10,

    paddingVertical: 5,
    paddingHorizontal: 14,

    backgroundColor: "#111",
    color: "#fff",  
    fontSize: 15,

    maxWidth: 354,
    width: "100%",
    height: 40,
  },

  passwordContainer: {
    borderColor: "#3CFF00",
    borderWidth: 1,
    borderRadius: 10,

    backgroundColor: "#111",

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 14,

    maxWidth: 354,
    width: "100%",
    height: 40,
  },

  passwordInput: {
    flex: 1,

    color: "#fff",

    fontSize: 15,
  },

  container_terms: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
    maxWidth: 354,
    width: "100%",
  },

  terms_txt: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
  },

  "link_terms": {
    color: "#3CFF00",
    fontWeight: "bold",
  },

  button_container: {
    padding: 20,
    alignItems: "center",
    
    maxWidth: 354,
  },
  
  button: {
    alignItems: "center",
    backgroundColor: "#3CFF00",
    borderRadius: 20,
    
    width: "100%",
    height: 40,
    
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  buttonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
  },

  container_have_account: {
    alignItems: "center",
    paddingBottom: 20,
  },

  have_txt: {
    color: "#fff",
    fontSize: 14,
  },

  login_link: {
    color: "#3CFF00",
    fontWeight: "bold",
  },
});