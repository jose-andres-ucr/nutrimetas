import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Expedientes() {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.addButton}>
        <Text style={{
          color: 'white',
          textAlign: 'center',
          fontSize: 16
        }}>
          Registrar paciente
        </Text>
      </TouchableOpacity>
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
    justifyContent: "center"
  }
});