import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, StyleSheet, TextInput as TextInputRn, ScrollView } from 'react-native';
import { Text, TextInput, Button } from "react-native-paper";
import { z } from "zod";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import firestore from '@react-native-firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import Colors from '@/constants/Colors';
import { View } from "@/components/Themed";
import { Dropdown } from "react-native-element-dropdown";
import { IDropdownRef } from "react-native-element-dropdown/lib/typescript/components/Dropdown/model";

const MAX_LINES = 6;

export const partialGoalForm = z.object({
  type: z
    .string()
    .min(1, { message: "Debe seleccionar un tipo" }),
  title: z
    .string()
    .min(1, { message: "Debe digitar un título" }),
  description: z
    .string()
    .min(1, { message: "Debes digitar una descripción" }),
});

type GoalFormType = z.infer<typeof partialGoalForm>

type Type = {
  id: string;
  name: string;
};

export default function AssignGoal() {
  const navigation = useNavigation();
  const route = useRoute();
  const patientId = route.params?.sessionDocId;
  const [typeData, setTypeData] = useState<Type[]>([]);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      type: '',
      title: '',
      description: '',
    },
    resolver: zodResolver(partialGoalForm),
  });

  const refs = {
    titleRef: React.useRef<TextInputRn>(null),
    descriptionRef: React.useRef<TextInputRn>(null),
    typeRef: React.useRef<IDropdownRef>(null),
  } as const;

  const onSubmit = (data: GoalFormType) => {
    console.log("Patient sent: ", patientId);
    navigation.navigate('configGoal', { formData: data, sessionDocId: patientId });
  };

  useEffect(() => {
    const unsubscribe = firestore().collection('Type').onSnapshot(
      (querySnapshot) => {
        try {
          const typeData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().Name
          }));
          setTypeData(typeData);
        } catch (error) {
          console.error("Error fetching types:", error);
        }
      },
      (error) => {
        console.error("Error listening to types collection:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Asignar Meta</Text>
      <Text style={styles.subtitle}>NUTRI<Text style={{ color: Colors.lightblue }}>METAS</Text></Text>
      <View style={styles.separator} lightColor={Colors.lightGray} darkColor={Colors.white} />

      <Controller
        control={control}
        render={({ field: { onChange, onBlur, name } }) => (
          <Dropdown
            ref={refs.typeRef}
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={typeData}
            search
            maxHeight={300}
            labelField="name"
            valueField="id"
            placeholder="Seleccione un tipo"
            searchPlaceholder="Buscar..."
            value={name}
            onChange={(item) => onChange(item?.id || '')}
            onBlur={onBlur}
          />
        )}
        name="type"
      />
      {errors.type ? (
        <Text style={styles.error}>{errors.type.message}</Text>
      ) : null}

      <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            ref={refs.descriptionRef}
            mode="outlined"
            label="Descripción"
            style={[styles.inputField, { minHeight: 140, maxHeight: 140 }]}
            multiline
            numberOfLines={MAX_LINES}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.description ? true : false}
            returnKeyType="next"
            onSubmitEditing={() => {
              refs.typeRef.current?.open();
            }}
            blurOnSubmit={false}
          />
        )}
        name="description" />
      {errors.description ? (
        <Text style={styles.error}>{errors.description.message}</Text>
      ) : null}

      <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            mode="outlined"
            label="Título"
            style={styles.inputField}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.title ? true : false}
            returnKeyType="next"
            autoFocus
            onSubmitEditing={() => {
              refs.descriptionRef.current?.focus();
            }}
            blurOnSubmit={false}
          />
        )}
        name="title" />
      {errors.title ? (
        <Text style={styles.error}>{errors.title.message}</Text>
      ) : null}

      <View style={styles.buttonContainer}>
        <Link href='/(tabs)/goals' style={{
          ...styles.button,
          borderWidth: 1,
          borderColor: "black",
          lineHeight: 35
        }}>
          Cancelar
        </Link>

        <Button
          style={{ ...styles.button, backgroundColor: Colors.lightblue }}
          mode="contained"
          onPress={handleSubmit((form) => {
            onSubmit({ ...form });
          })}
        >
          <Text style={{ fontSize: 16, color: Colors.white, fontWeight: 'bold' }}>Crear</Text>
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
    borderRadius: 5,
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
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%"
  },
  error: {
    color: Colors.red,
  },
  dropdown: {
    margin: 16,
    padding: 10,
    marginVertical: 10,
    width: "70%",
    height: 50,
    borderColor: Colors.gray,
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: Colors.white
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
});
