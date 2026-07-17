import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_KEY = "@NovaChance:user";
const TOKEN_KEY = "@NovaChance:token";

export async function saveLogin(user: any, token: string) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getLoggedUser() {
  const user = await AsyncStorage.getItem(USER_KEY);

  if (!user) {
    return null;
  }

  return JSON.parse(user);
}

export async function getToken() {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

export async function logout() {
  await AsyncStorage.removeItem(USER_KEY);
  await AsyncStorage.removeItem(TOKEN_KEY);
}