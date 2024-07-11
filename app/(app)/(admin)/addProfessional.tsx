import { zodResolver } from "@hookform/resolvers/zod";
import { router, Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Image, TextInput as TextInputRn, ScrollView } from 'react-native';
import { Text, TextInput, Button } from "react-native-paper";
import { z } from "zod";
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import { showMessage } from "react-native-flash-message";
import { useMutation } from "@tanstack/react-query"

import Colors from '@/constants/Colors';
import { View } from "@/components/Themed";
import React from "react";

const professionalForm = z.object({
    firstName: z
      .string()
      .min(3, { message: "El nombre debe tener al menos 3 caracteres" })
      .max(32, { message: "El nombre debe tener máximo 32 caracteres" }),
    lastName: z
      .string()
      .min(2, { message: "El apellido debe tener al menos 2 caracteres" })
      .max(32, { message: "El apellido debe tener máximo 32 caracteres" }),
    email: z
      .string()
      .email({message: "El correo es inválido."}),
    password: z      
      .string()
      .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
  });

  type ProfessionalFormType = z.infer<typeof professionalForm>

  export default function AddProfessional() {
  
    const {
      control,
      handleSubmit,
      formState: { errors },
    } = useForm({
      defaultValues: {
        firstName: '',
        lastName: '',
        email: '',
        password: ''
      },
      resolver: zodResolver(professionalForm),
    });
  
    const refs = {
      firstNameRef: React.useRef<TextInputRn>(null),
      lastNameRef: React.useRef<TextInputRn>(null),
      emailRef: React.useRef<TextInputRn>(null),
      passwordRef: React.useRef<TextInputRn>(null),
    } as const;
  
    const idExists = async (email: string) => {
      try {
        const professional = await firestore()
          .collection('Professionals')
          .where('email', '==', email)
          .get();
        return professional.empty? false: true;
      } catch (error) {
        console.error("Error al comprobar si el usuario ya existe: ", error);
        throw new Error("Error al comprobar si el usuario ya existe.");
      }
    }
  
    const onSubmit = async (data: ProfessionalFormType) => {
      try {
        const userExists = await idExists(data.email)
        if (!userExists) {
          const newUser = await firestore()
            .collection('Professionals')
            .add({
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email
            })
          
          if (newUser) {
            await firestore()
              .collection('Metadata')
              .doc(data.email)
              .set({
                role: 'Professional',
                verified: false,
                password: data.password
              })
            console.log('Usuario agregado!')
            successfulAddition()
          }
  
          router.replace('/(app)/(admin)/(tabs)/professionals')
          return newUser
        } else {
          console.log("El usuario ya existe") 
          alreadyExistAlert()
          return userExists
        }
      } catch (error) {
        console.log("Error tratando de agregar profesional: ", error)
        await firestore()
          .collection('Professionals')
          .doc(data.email)
          .delete()
        router.replace('/(app)/(root)/(tabs)/expedientes')
        somethingWentWrong();
      }
    };
  
    const mutation = useMutation({
      mutationFn: onSubmit
    })
  
    const successfulAddition = () => {
      showMessage({
          position: "top",
          type: "success",
          message: "Exito!",
          description: "Profesional añadido exitosamente.",
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
          position: "top",
          type: "warning",
          message: "Atención",
          description: "El profesional ya existe.",
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
          position: "top",
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
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Registro de profesionales</Text>
            <Text style={styles.subtitle}>NUTRI<Text style={{color: Colors.lightblue}}>METAS</Text></Text>
            <View style={styles.separator} lightColor={Colors.lightGray} darkColor={Colors.white} />
            <Controller
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                mode="outlined"
                label="Nombres"
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.firstName?true:false}
                keyboardType="default"
                returnKeyType="next"
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
                    refs.emailRef.current?.focus();
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
            <Link href='/(app)/(admin)/(tabs)/professionals' style={{
                ...styles.button, 
                borderWidth: 1,
                borderColor: "black",
                lineHeight: 35
                }}>
                Cancelar
            </Link>

            { mutation.isPending ? (
                <>
                <View style={{... styles.button, backgroundColor: Colors.lightGray, alignItems: "center", paddingVertical: 5}}>
                    <Image style={{width: 30, height: 30}} source={require("@/assets/images/loading.gif")}/>
                </View>
                </>
            ) : (
                <>
                <Button
                    style={{...styles.button, backgroundColor: Colors.lightblue}}
                    icon="content-save"
                    mode="contained"
                    onPress={() => {
                    handleSubmit((form) => {
                        mutation.mutate({...form})
                    })();
                    }}
                >
                    <Text style={{fontSize: 16, color:Colors.white, fontWeight:'bold'}}>Registrar</Text>  
                </Button>
                </>
            )}
            </View>
        </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
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