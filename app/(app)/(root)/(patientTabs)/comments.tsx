import { Link } from "expo-router";
import { SafeAreaView, View, StyleSheet, Text } from "react-native";
import Colors from "@/constants/Colors";
import ShowComments from '@/app/(app)/(root)/showComment';
import { useGlobalSearchParams } from 'expo-router';

export default function Comments() {
    const { patientId } = useGlobalSearchParams(); //Nesecito que de alguna manera a Comments le lleguen ese parametro

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.listContainer}>
          <ShowComments goalId={patientId as string} />
        </View>
      </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
      flex:1,
      backgroundColor: Colors.white
    },
    listContainer: {
      flex: 1,
      alignContent: 'flex-end',
      paddingHorizontal: 20,
      top: "-6%",
      marginBottom: "-5%",
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