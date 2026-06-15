import { View, StyleSheet } from 'react-native';
import { FormRegister } from '../features/auth/components/form_register';

export default function Register() {
    return (
        <View style={styles.container}>
            <FormRegister/>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    }
});