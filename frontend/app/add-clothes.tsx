import { View, StyleSheet } from 'react-native';
import { Clothes_form } from '@/features/clothes-add/components/clothes-form';

export default function AddClothes() {
    return (
        <View style={styles.container}>
            <Clothes_form/>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    }
});