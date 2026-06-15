import { Text, View, Button } from 'react-native';
import { router } from 'expo-router';

export default function Home() {
    function goToLogin() {
        router.push('/login');
    }
    function goToRegister() {
        router.push('/register');
    }

  return (
    <View>
      <Text>Hello, World!</Text>
      <Button title="Go to Login" onPress={goToLogin} />
      <Button title="Go to Register" onPress={goToRegister} />
    </View> 
  );
}
