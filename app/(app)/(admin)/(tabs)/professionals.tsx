import { Link } from "expo-router";
import { SafeAreaView, View, StyleSheet } from "react-native";
import Colors from "@/constants/Colors";
import ProfessionalList from "../professionalList";

export default function Professionals() {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.listContainer}>
          <ProfessionalList></ProfessionalList>
        </View>
        <Link push href="/addProfessional" style={styles.addButton}>
          Registrar profesional
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
      flex:1,
      paddingHorizontal: 20,
    },
    addButton: {
      backgroundColor: Colors.lightblue,
      fontWeight: "bold",
      width: '100%',
      height: 55,
      position: "relative",
      bottom: 0,
      justifyContent: "center",
      textAlign: 'center',
      color: Colors.white,
      fontSize: 16,
      lineHeight: 50
    },
  });