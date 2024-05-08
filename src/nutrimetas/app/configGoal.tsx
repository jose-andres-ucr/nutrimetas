import { zodResolver } from "@hookform/resolvers/zod";
import { router, Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, StyleSheet, TextInput as TextInputRn, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button } from "react-native-paper";
import { z } from "zod";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { View } from "@/components/Themed";
import { Dropdown } from "react-native-element-dropdown";
import { useRoute } from '@react-navigation/native';
import DateTimePicker, { DatePickerOptions } from '@react-native-community/datetimepicker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import firestore from '@react-native-firebase/firestore';


const goalForm = z.object({
  modality: z
    .string()
    .min(1, { message: "Debe seleccionar alguna modalidad" }),
  frequency: z
    .number({ message: "Debe digitar un valor numerico" })
    .min(1, { message: "Debe digitar un valor mayor a 0" })
    .max(100, { message: "Debe digitar un valor menor o igual a 100" }),
  startDate: z
    .date(),
  deadline: z
    .date(),
});

type GoalFormType = z.infer<typeof goalForm>

export default function InfoGoals() {
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDeadlineDatePicker, setShowDeadlineDatePicker] = useState(false);
  const route = useRoute();
  const firstGoalData = route.params?.formData;


  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      modality: '',
      frequency: 0,
      startDate: new Date(),
      deadline: new Date(),
    },
    resolver: zodResolver(goalForm),
  });

  const refs = {
    modalityRef: React.useRef<TextInputRn>(null),
    frequencyRef: React.useRef<TextInputRn>(null),
    startDateRef: React.useRef<DatePickerOptions>(null),
    deadlineRef: React.useRef<DatePickerOptions>(null),
  } as const;

  const onSubmit = (data: GoalFormType) => {
    console.log("Enviados correctamente ", data)
    firestore()
      .collection('Goal')
      .add({
        Deadline: data.deadline,
        Description: data.description,
        Frequency: data.frequency,
        Modality: data.modality,
        StartDate: data.startDate,
        Title: data.title,
      })
      .then(() => {
        console.log('Goal added!');
        router.navigate('/(tabs)/');
      })
      .catch((error) => {
        console.error('Error adding goal: ', error);
      });
  };

  const [modalityData, setModalityData] = useState([]);

  useEffect(() => {
    const unsubscribe = firestore().collection('Modality').onSnapshot(querySnapshot => {
      const modalityData = querySnapshot.docs.map(doc => {
        return { label: doc.data().Type, value: doc.data().Type };
      });
      setModalityData(modalityData);
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
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={modalityData}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Seleccione una modalidad"
            searchPlaceholder="Buscar..."
            value={value}
            onChange={(item) => onChange(item?.value || '')}
            onBlur={onBlur}
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
            onChangeText={(text) => {
              const numericValue = parseFloat(text);
              if (!isNaN(numericValue)) {
                onChange(numericValue);
              } else {
                onChange(text);
              }
            }}
            value={value.toString()}
            error={errors.frequency ? true : false}
            keyboardType="numeric"
            returnKeyType="next"
            onSubmitEditing={() => {
              refs.frequencyRef.current?.focus();
            }}
            blurOnSubmit={false}
          />
        )}
        name="frequency" />
      {errors.frequency ? (
        <Text style={styles.error}>{errors.frequency.message}</Text>
      ) : null}

      <View style={[styles.textDate, { paddingTop: 5 }]}>
        <Text>Fecha de Inicio</Text>
      </View>
      <Controller
        control={control}
        render={({ field: { onChange, value } }) => (
          <View>
            <TouchableOpacity style={styles.datePickerStyle} onPress={() => setShowStartDatePicker(true)}>
              <Text>{value.toDateString()}</Text>
              <FontAwesome name="calendar" size={24} color="gray" />
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={value}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStartDatePicker(false);
                  onChange(selectedDate);
                }}
                minimumDate={new Date()}
                negativeButton={{ label: 'Cancelar' }}
                positiveButton={{ label: 'Aceptar' }}
              />
            )}
          </View>
        )}
        name="startDate"
        defaultValue={new Date()}
      />
      {errors.startDate ? (
        <Text style={styles.error}>{errors.startDate.message}</Text>
      ) : null}

      <View style={[styles.textDate, { paddingTop: 15 }]}>
        <Text>Fecha Límite</Text>
      </View>
      <Controller
        control={control}
        render={({ field: { onChange, value } }) => (
          <View>
            <TouchableOpacity style={styles.datePickerStyle} onPress={() => setShowDeadlineDatePicker(true)}>
              <Text>{value.toDateString()}</Text>
              <FontAwesome name="calendar" size={24} color="gray" />
            </TouchableOpacity>
            {showDeadlineDatePicker && (
              <DateTimePicker
                value={value}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDeadlineDatePicker(false);
                  onChange(selectedDate);
                }}
                minimumDate={new Date()}
                negativeButton={{ label: 'Cancelar' }}
                positiveButton={{ label: 'Aceptar' }}
              />
            )}
          </View>
        )}
        name="deadline" />
      {errors.deadline ? (
        <Text style={styles.error}>{errors.deadline.message}</Text>
      ) : null}

      <View style={styles.buttonContainer}>
        <Link href='/assingGoal' style={{
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
          onPress={handleSubmit((secondGoalData) => {
            onSubmit({ ...firstGoalData, ...secondGoalData });
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
    backgroundColor: 'white',
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
  datePickerStyle: {
    width: '70%',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'gray',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  textDate: {
    justifyContent: 'flex-start',
    width: '70%',
    backgroundColor: 'transparent',
  }
});
