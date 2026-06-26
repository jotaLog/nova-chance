import { Text, View, Button } from 'react-native';
import { router } from 'expo-router';

export default function Home() {
    function goToLogin() {
      router.push('/login');
    }
    function goToRegister() {
      router.push('/register');
    }
    function goToProfile() {
      router.push('./profile');
    }

  return (
    <View>
      <Text>Hello, World!</Text>
      <Button title="Go to Login" onPress={goToLogin} />
      <Button title="Go to Register" onPress={goToRegister} />
      <Button title="Go to Profile" onPress={goToProfile} />
    </View> 
  );
}
