import {Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

export default function Nutrimetas() {
    return (
      <Text style={styles.subtitle}>
        NUTRI<Text style={{ color: Colors.lightblue }}>METAS</Text>
      </Text>
    );
}

const styles = StyleSheet.create({
    subtitle: {
      fontSize: 30,
      fontWeight: 'bold',
      color: Colors.green,
    },
});