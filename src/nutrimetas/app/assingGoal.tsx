import { zodResolver } from "@hookform/resolvers/zod";
import { router, Link } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, StyleSheet, TextInput as TextInputRn } from 'react-native';
import { Text, TextInput, Button } from "react-native-paper";
import { z } from "zod";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import Colors from '@/constants/Colors';
import { View } from "@/components/Themed";
import { useNavigation } from '@react-navigation/native';

const goalForm = z.object({
  title: z
  .string(),
});

type GoalFormType = z.infer<typeof goalForm>

export default function AssignGoal() {

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Asignar Meta</Text>
      <Text style={styles.subtitle}>NUTRI<Text style={{color: Colors.lightblue}}>METAS</Text></Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
          
      <View style={styles.buttonContainer}>
        <Link href='/(tabs)/' style={{
          ...styles.button, 
          borderWidth: 1,
          borderColor: "black",
          lineHeight: 35
          }}>
            Cancelar
        </Link>

        <Link push href="/configGoal" style={{...styles.button,  lineHeight: 35, backgroundColor: Colors.lightblue}}>
          <Text style={{fontSize: 16, color: "white", fontWeight:'bold'}}>Continuar</Text>
        </Link>
      </View>

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    color: "#FFFFFF"
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.green
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  inputField: {
    marginVertical: 10,
    width: "70%"
  },
  button: {
    height: 40,
    borderRadius:5,
    width: 165,
    marginTop: 24,
    textAlign: "center",
    alignSelf: "center",
    fontSize: 16,
    fontWeight: "bold"
  },
  buttonContainer: {
    marginTop: 40,
    backgroundColor: "transparent",
    flexDirection:"row", 
    justifyContent: "space-evenly",
    width: "100%"
  },
  error: {
    color: "red",
  },
});
