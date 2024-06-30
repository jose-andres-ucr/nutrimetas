import { Link } from "expo-router";
import { SafeAreaView, View, StyleSheet, Text } from "react-native";
import Colors from "@/constants/Colors";

export default function Professionals() {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.listContainer}>
          <Text>Funciona</Text>
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
      paddingHorizontal: 20,
      top: -55,
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