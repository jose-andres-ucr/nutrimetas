import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import Colors from '@/constants/Colors';
import PatientList from '../PatientList';

export default function Expedientes() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.listContainer}>
        <PatientList />
      </View>
      <Link push href="/addPatient" style={styles.addButton}>
        Registrar paciente
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    backgroundColor: "white"
  },
  listContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    top: -50
  },
  addButton: {
    backgroundColor: Colors.lightblue,
    fontWeight: "bold",
    width: '100%',
    height: 50,
    position: "absolute",
    bottom: 0,
    justifyContent: "center",
    textAlign: 'center',
    color: 'white',
    fontSize: 16,
    lineHeight: 50
  },
});