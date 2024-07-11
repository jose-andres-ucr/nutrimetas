import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import Colors from '@/constants/Colors';
import { View } from "@/components/Themed";
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
    flex:1,
    backgroundColor: Colors.white
  },
  listContainer: {
    paddingHorizontal: 20,
    top: -10,
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
});