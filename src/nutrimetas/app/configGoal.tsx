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


const goalForm = z.object({
  modality: z
    .string(),
  frequency: z
    .string()
    .min(1, { message: "El número debe ser mayor 1" })
    .max(50),
  startDate: z
    .string(),
  deadline: z      
    .string(),
});

type GoalFormType = z.infer<typeof goalForm>

export default function InfoGoals() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      modality: '',
      frequency: '',
      startDate: '',
      deadline: ''
    },
    resolver: zodResolver(goalForm),
  });

  const refs = {
    modalityRef: React.useRef<TextInputRn>(null),
    frequencyRef: React.useRef<TextInputRn>(null),
    startDateRef: React.useRef<TextInputRn>(null),
    deadlineRef: React.useRef<TextInputRn>(null),
  } as const;

  const onSubmit = (data: GoalFormType) => {
    console.log("Enviados correctamente ", data)
  };

  return (
    <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Asignar Meta</Text>
        <Text style={styles.subtitle}>NUTRI<Text style={{color: Colors.lightblue}}>METAS</Text></Text>
        <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

        <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
            mode="outlined"
            label="Modalidad"
            style={styles.inputField}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.modality?true:false}
            keyboardType="default"
            returnKeyType="next"
            onSubmitEditing={() => {
                refs.modalityRef.current?.focus();
            }}
            blurOnSubmit={false}
            />
        )}
        name="modality"
        />
        {errors.modality ? (
            <Text style={styles.error}>{errors.modality.message}</Text>
        ) : null}

        <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            mode="outlined"
            label="Frecuencia"
            style={styles.inputField}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.frequency?true:false}
            keyboardType="numeric"
            returnKeyType="next"
            onSubmitEditing={() => {
              refs.frequencyRef.current?.focus();
            }}
            blurOnSubmit={false}
          />
        )}
        name="frequency"/>
        {errors.frequency ? (
          <Text style={styles.error}>{errors.frequency.message}</Text>
        ) : null}

        <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
            mode="outlined"
            label="Fecha de Inicio"
            style={styles.inputField}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.startDate?true:false}
            keyboardType="default"
            returnKeyType="next"
            onSubmitEditing={() => {
                refs.startDateRef.current?.focus();
            }}
            blurOnSubmit={false}
            />
        )}
        name="startDate"/>
        {errors.startDate ? (
            <Text style={styles.error}>{errors.startDate.message}</Text>
        ) : null}

        <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
            mode="outlined"
            label="Fecha límite"
            style={styles.inputField}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value.toString()}
            error={errors.deadline?true:false}
            keyboardType="default"
            returnKeyType="next"
            onSubmitEditing={() => {
                refs.deadlineRef.current?.focus();
            }}
            blurOnSubmit={false}
            />
        )}
        name="deadline"/>
        {errors.deadline ? (
            <Text style={styles.error}>{errors.deadline.message}</Text>
        ) : null}
          
        <View style={styles.buttonContainer}>
            <Link href='/(tabs)/' style={{
            ...styles.button, 
            borderWidth: 1,
            borderColor: "black",
            lineHeight: 35
            }}>
                Cancelar
            </Link>

            <Button
            style={{...styles.button, backgroundColor: Colors.lightblue}}
            mode="contained"
            onPress={handleSubmit((form) => {
                onSubmit({...form });
            })}
            >
            <Text style={{fontSize: 16, color: "white", fontWeight:'bold'}}>Continuar</Text>
            </Button>
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
