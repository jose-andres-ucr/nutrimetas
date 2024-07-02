import { SafeAreaView, View, StyleSheet, Text } from "react-native";
import Colors from "@/constants/Colors";
import ShowComments from '@/app/(app)/(root)/showComment';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Comments() {
  const [patientId, setPatientId] = useState<string | null>(null);

  useEffect(() => {
      const getPatientId = async () => {
          try {
              const storedPatientId = await AsyncStorage.getItem('selectedPatientId');
              if (storedPatientId) {
                  setPatientId(storedPatientId);
                  console.log("BREAKPOINT pac", storedPatientId)
              }
          } catch (error) {
              console.error('Error fetching patient ID from local storage:', error);
          }
      };

      getPatientId();
  }, []);


    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.listContainer}>
          <ShowComments userId={patientId as string} />
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