import { zodResolver } from "@hookform/resolvers/zod";
import { router, Link } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, StyleSheet, Image, TextInput as TextInputRn, ScrollView } from 'react-native';
import { Text, TextInput, Button } from "react-native-paper";
import { z } from "zod";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { showMessage } from "react-native-flash-message";

import Colors from '@/constants/Colors';
import { View } from "@/components/Themed";
import MaskInput from "react-native-mask-input";


const patientForm = z.object({
  firstName: z
    .string()
    .min(3, { message: "El nombre debe tener al menos 3 caracteres" })
    .max(32, { message: "El nombre debe tener máximo 32 caracteres" }),
  lastName: z
    .string()
    .min(2, { message: "El apellido debe tener al menos 2 caracteres" })
    .max(32, { message: "El apellido debe tener máximo 32 caracteres" }),
  idNumber: z
    .string()
    .min(11, { message: "El número de cédula no es válido." })
    .max(11, { message: "El número de cédula no es válido." }),
  phone: z
    .string()
    .min(9, { message: "El número no es válido." })
    .max(9, { message: "El número no es válido." }),
  email: z
    .string()
    .email({message: "El correo es inválido."}),
  password: z      
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
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
      idNumber: '',
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
    idNumberRef: React.useRef<TextInputRn>(null),
    emailRef: React.useRef<TextInputRn>(null),
    passwordRef: React.useRef<TextInputRn>(null),
  } as const;

  const idExists = async (idNumber: string) => {
    try {
      const user = await firestore().collection('Patient').where('idNumber', '==', idNumber).get();
      return user.empty? false: true;
    } catch (error) {
      console.error("Error al comprobar si el usuario ya existe: ", error);
      throw new Error("Error al comprobar si el usuario ya existe.");
    }
  }

  const onSubmit = async (data: PatientFormType) => {
    try {
      const userExists = await idExists(data.idNumber);
      if (!userExists) {
        const doc = await firestore()
          .collection('Patient')
          .add({
            firstName: data.firstName,
            lastName: data.lastName,
            idNumber: data.idNumber,
            phone: data.phone,
            email: data.email,
          });
  
        try {
          const authUser = await auth().createUserWithEmailAndPassword(data.email, data.password);
          // Se agrega el campo uid al usuario en firestore
          await firestore()
            .collection('Patient')
            .doc(doc.id)
            .update({
              'uid': authUser.user.uid
            })
          console.log('Usuario agregado!')
          router.replace('/(tabs)/expedientes')
          successfulAddition()
        } catch (error) {
          // Si ocurre un error al crear el usuario en Auth, elimina el documento agregado previamente en Firestore
          console.log("Error guardando credenciales del usuario: ", error);
          await firestore().collection('Patient').doc(doc.id).delete();
          console.log('Documento eliminado debido a error en la creación del usuario');
          somethingWentWrong();
        }
      } else {
        console.log("El usuario ya existe");
        alreadyExistAlert();
      }
    } catch (error) {
      console.log("Error tratando de agregar paciente: ", error);
      somethingWentWrong();
    }
  };

  const successfulAddition = () => {
    showMessage({
        position: "bottom",
        type: "success",
        message: "Exito!",
        description: "Paciente añadido exitosamente.",
        backgroundColor: Colors.green, 
        color: Colors.white, 
        icon: props => <Image source={{uri: 'https://www.iconpacks.net/icons/5/free-icon-green-check-mark-approval-16196.png'}} {...props} />,
        style: {
        borderRadius: 10, 
        },
    })
  }
  
  const alreadyExistAlert = () => {
    showMessage({
        position: "bottom",
        type: "warning",
        message: "Atención",
        description: "El paciente ya existe.",
        backgroundColor: Colors.gray, 
        color: Colors.white, 
        icon: props => <Image source={{uri: 'https://www.iconpacks.net/icons/3/free-icon-warning-sign-9773.png'}} {...props} />,
        style: {
        borderRadius: 10, 
        },
    })
  }

  const somethingWentWrong = () => {
    showMessage({
        position: "bottom",
        type: "danger",
        message: "Error",
        description: "Algo salió mal.",
        backgroundColor: Colors.gray, 
        color: Colors.white, 
        icon: props => <Image source={{uri: 'https://www.iconpacks.net/icons/3/free-icon-warning-sign-9743.png'}} {...props} />,
        style: {
        borderRadius: 10, 
        },
    })
  }

  return (
    <ScrollView>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Registro de pacientes</Text>
        <Text style={styles.subtitle}>NUTRI<Text style={{color: Colors.lightblue}}>METAS</Text></Text>
        <View style={styles.separator} lightColor={Colors.lightGray} darkColor={Colors.white} />

        <Controller
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              mode="outlined"
              label="Nombre"
              style={styles.inputField}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.firstName?true:false}
              keyboardType="default"
              returnKeyType="next"
              autoFocus
              onSubmitEditing={() => {
                refs.lastNameRef.current?.focus();
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
              ref={refs.lastNameRef}
              mode="outlined"
              label="Apellidos"
              style={styles.inputField}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.lastName?true:false}
              keyboardType="default"
              returnKeyType="next"
              onSubmitEditing={() => {
                refs.idNumberRef.current?.focus();
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
          render={({ field: { onChange, onBlur, value } }) => (
            <MaskInput
              ref={refs.idNumberRef}
              style={styles.specialInputs}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              mask={[/\d/, '-', /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/]}
              keyboardType="numeric"
              returnKeyType="next"
              onSubmitEditing={() => {
                refs.phoneRef.current?.focus();
              }}
              blurOnSubmit={false}
              placeholder="Cédula"
            />
          )}
          name="idNumber"
        />
        {errors.idNumber ? (
          <Text style={styles.error}>{errors.idNumber.message}</Text>
        ) : null}

        <Controller
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <MaskInput
              ref={refs.phoneRef}
              style={styles.specialInputs}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              mask={[/\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/]}
              keyboardType="numeric"
              returnKeyType="next"
              onSubmitEditing={() => {
                refs.emailRef.current?.focus();
              }}
              blurOnSubmit={false}
              placeholder="Teléfono"
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
              ref={refs.emailRef}
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
                refs.passwordRef.current?.focus();
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
            onPress={() => {
              handleSubmit((form) => {
                onSubmit({...form });
              })();
            }}
          >
            <Text style={{fontSize: 16, color: "white", fontWeight:'bold'}}>Registrar</Text>
          </Button>
        </View>

        {/* Use a light status bar on iOS to account for the black space above the modal */}
        <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    color: Colors.white,
    marginTop: 50
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
    backgroundColor: Colors.white,
    marginVertical: 10,
    width: "70%",
  },
  specialInputs: {
    marginVertical: 10,
    height: 55,
    width: "70%",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray,
    borderRadius: 5,
    padding: 15
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
