import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, StyleSheet, TextInput as TextInputRn } from 'react-native';
import { Text, TextInput, Button } from "react-native-paper";
import { z } from "zod";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import Colors from '@/constants/Colors';
import { View } from "@/components/Themed";
import { Dropdown } from "react-native-element-dropdown";
import { IDropdownRef } from "react-native-element-dropdown/lib/typescript/components/Dropdown/model";

const MAX_LINES = 6;

const goalForm = z.object({
  title: z
    .string()
    .min(1, { message: "Debe digitar un título" }),
  description: z
    .string()
    .min(1, { message: "Debes digitar una descripción" }),
  category: z
    .string()
    .min(1, { message: "Debe seleccionar alguna categoría" }),
});

type GoalFormType = z.infer<typeof goalForm>

export default function AssignGoal() {
  const navigation = useNavigation();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      category: '',
    },
    resolver: zodResolver(goalForm),
  });

  const refs = {
    titleRef: React.useRef<TextInputRn>(null),
    descriptionRef: React.useRef<TextInputRn>(null),
    categoryRef: React.useRef<IDropdownRef>(null),
  } as const;

  const onSubmit = (data: GoalFormType) => {
    navigation.navigate('configGoal', { formData: data });
  };

  const [categoryData, setCategoryData] = useState([]);

  useEffect(() => {
    const unsubscribe = firestore().collection('Category').onSnapshot(querySnapshot => {
      const categoryData = querySnapshot.docs.map(doc => {
        return { label: doc.data().Type, value: doc.data().Type };
      });
      setCategoryData(categoryData);
    });

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Asignar Meta</Text>
      <Text style={styles.subtitle}>NUTRI<Text style={{ color: Colors.lightblue }}>METAS</Text></Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

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

      <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            ref={refs.descriptionRef}
            mode="outlined"
            label="Descripción"
            style={[styles.inputField, { minHeight: 110 }]}
            multiline        
            numberOfLines={MAX_LINES}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.description ? true : false}
            returnKeyType="next"
            onSubmitEditing={() => {
              refs.categoryRef.current?.open();
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
          <Dropdown
            ref={refs.categoryRef}
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={categoryData}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Seleccione una categoría"
            searchPlaceholder="Buscar..."
            value={value}
            onChange={(item) => onChange(item?.value || '')}
            onBlur={onBlur}
          />
        )}
        name="category"
      />
      {errors.category ? (
        <Text style={styles.error}>{errors.category.message}</Text>
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
          <Text style={{ fontSize: 16, color: "white", fontWeight: 'bold' }}>Crear</Text>
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
    color: "red",
  },
  dropdown: {
    margin: 16,
    padding: 10,
    marginVertical: 10,
    width: "70%",
    height: 50,
    borderColor: 'gray',
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: 'white'
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
