import { zodResolver } from "@hookform/resolvers/zod";
import { router, Link } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, StyleSheet, Image, TextInput as TextInputRn } from 'react-native';
import { Text, TextInput, Button } from "react-native-paper";
import { z } from "zod";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import firestore from '@react-native-firebase/firestore';
import { showMessage } from "react-native-flash-message";

import Colors from '@/constants/Colors';
import { View } from "@/components/Themed";


const patientForm = z.object({
  firstName: z
    .string()
    .min(4, { message: "El nombre debe tener al menos 4 caracteres" })
    .max(32, { message: "El nombre debe tener máximo 32 caracteres" }),
  lastName: z
    .string()
    .min(4, { message: "El apellido debe tener al menos 4 caracteres" })
    .max(32, { message: "El apellido debe tener máximo 32 caracteres" }),
  id: z
    .string()
    .min(9, { message: "El número de cédula no es válido." })
    .max(9, { message: "El número de cédula no es válido." }),
  phone: z
    .string()
    .min(8, { message: "El número no es válido." })
    .max(8, { message: "El número no es válido." }),
  email: z
    .string()
    .email({message: "El correo es inválido."}),
  password: z      
    .string()
    .min(5, { message: "La contraseña debe tener al menos 5 caracteres" })
});

type PatientFormType = z.infer<typeof patientForm>

export default function AddPatient() {

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      id: '',
      phone: '',
      email: '',
      password: ''
    },
    resolver: zodResolver(patientForm),
  });

  const refs = {
    firstNameRef: React.useRef<TextInputRn>(null),
    lastNameRef: React.useRef<TextInputRn>(null),
    phoneRef: React.useRef<TextInputRn>(null),
    idRef: React.useRef<TextInputRn>(null),
    emailRef: React.useRef<TextInputRn>(null),
    passwordRef: React.useRef<TextInputRn>(null),
  } as const;

  const onSubmit = (data: PatientFormType) => {
    firestore()
      .collection('Patient')
      .add({
        firstName: data.firstName,
        lastName: data.lastName,
        id: data.id,
        phone: data.phone,
        email: data.email,
        password: data.password,
      })
      .then(() => {
        console.log('User added!');
        router.navigate('/(tabs)/expedientes')
      });
  };

  const successfulAddition = () => {
    showMessage({
        type: "success",
        message: "Success",
        description: "Patient succesfully added",
        backgroundColor: "#6dc067", 
        color: "#FFFFFF", 
        icon: props => <Image source={{uri: 'https://www.iconpacks.net/icons/5/free-icon-green-check-mark-approval-16196.png'}} {...props} />,
        style: {
        borderRadius: 10, 
        },
    })
    }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Registro de pacientes</Text>
      <Text style={styles.subtitle}>NUTRI<Text style={{color: Colors.lightblue}}>METAS</Text></Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

      <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            mode="outlined"
            label="Primer Nombre"
            style={styles.inputField}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.firstName?true:false}
            keyboardType="default"
            returnKeyType="next"
            onSubmitEditing={() => {
              refs.firstNameRef.current?.focus();
            }}
            blurOnSubmit={false}
          />
        )}
        name="firstName"
      />
      {errors.firstName ? (
        <Text style={styles.error}>{errors.firstName.message}</Text>
      ) : null}

      <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            mode="outlined"
            label="Apellido completo"
            style={styles.inputField}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.lastName?true:false}
            keyboardType="default"
            returnKeyType="next"
            onSubmitEditing={() => {
              refs.lastNameRef.current?.focus();
            }}
            blurOnSubmit={false}
          />
        )}
        name="lastName"
      />
      {errors.lastName ? (
        <Text style={styles.error}>{errors.lastName.message}</Text>
      ) : null}

      <Controller
        control={control}
        render={({ field: { onChange, onBlur } }) => (
          <TextInput
            mode="outlined"
            label="Cédula"
            style={styles.inputField}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.id?true:false}
            keyboardType="numeric"
            returnKeyType="next"
            onSubmitEditing={() => {
              refs.idRef.current?.focus();
            }}
            blurOnSubmit={false}
          />
        )}
        name="id"
      />
      {errors.id ? (
        <Text style={styles.error}>{errors.id.message}</Text>
      ) : null}

      <Controller
        control={control}
        render={({ field: { onChange, onBlur } }) => (
          <TextInput
            mode="outlined"
            label="Teléfono"
            style={styles.inputField}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.phone?true:false}
            keyboardType="numeric"
            returnKeyType="next"
            onSubmitEditing={() => {
              refs.phoneRef.current?.focus();
            }}
            blurOnSubmit={false}
          />
        )}
        name="phone"
      />
      {errors.phone ? (
        <Text style={styles.error}>{errors.phone.message}</Text>
      ) : null}
    
      <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            mode="outlined"
            label="Correo electrónico"
            style={styles.inputField}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.email?true:false}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            onSubmitEditing={() => {
              refs.emailRef.current?.focus();
            }}
            blurOnSubmit={false}
          />
        )}
        name="email"
      />
      {errors.email ? (
        <Text style={styles.error}>{errors.email.message}</Text>
      ) : null}

      <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            ref={refs.passwordRef}
            mode="outlined"
            label="Password"
            secureTextEntry
            style={styles.inputField}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.password?true:false}
            autoCapitalize="none"
            autoComplete="password"
          />
        )}
        name="password"
      />
      {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
          
      <View style={styles.buttonContainer}>
        <Link href='/(tabs)/expedientes' style={{
          ...styles.button, 
          borderWidth: 1,
          borderColor: "black",
          lineHeight: 35
          }}>
            Cancelar
        </Link>

        <Button
          style={{...styles.button, backgroundColor: Colors.lightblue}}
          icon="content-save"
          mode="contained"
          onPress={() => {handleSubmit((form) => {
            onSubmit({...form });
          })(); successfulAddition()
          }}
        >
          <Text style={{fontSize: 16, color: "white", fontWeight:'bold'}}>Registrar</Text>
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
    color: Colors.white,
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
    backgroundColor: Colors.transparent,
    flexDirection:"row", 
    justifyContent: "space-evenly",
    width: "100%"
  },
  error: {
    color: Colors.red,
  },
});
