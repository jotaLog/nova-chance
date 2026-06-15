import { View, StyleSheet } from 'react-native';
import { FormLogin } from '../features/auth/components/form_login';

export default function Login() {
    return (
        <View style={styles.container}>
            <FormLogin/>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    }
});