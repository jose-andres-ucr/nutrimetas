import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

export default function Expedientes() {
  return (
    <SafeAreaView style={styles.container}>
      <Link push href="/addPatient" style={styles.addButton}>
            Registrar paciente
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white'
  },
  addButton: {
    backgroundColor: "#0386D0",
    width: '100%',
    height: 50,
    position: "absolute",
    bottom: 0,
    justifyContent: "center",
    textAlign: 'center',
    color: 'white',
    fontSize: 16,
    lineHeight: 50
  }
});