import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import Colors from '@/constants/Colors';
import PatientList from '../PatientList';

export default function Expedientes() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.listContainer}>
      <Text style={styles.title}>Expedientes</Text>
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
    backgroundColor: Colors.lightblue,
  },
  listContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    top: -73,
    height: '103%',
  },
  addButton: {
    backgroundColor: Colors.lightblue,
    fontWeight: "bold",
    width: '100%',
    height: 55,
    position: "absolute",
    bottom: 0,
    justifyContent: "center",
    textAlign: 'center',
    color: Colors.white,
    fontSize: 16,
    lineHeight: 50
  },
  title: {
    marginVertical: 20,
    fontSize: 36,
    fontWeight: 'bold',
    backgroundColor: Colors.white,
  },
});