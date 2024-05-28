import { zodResolver } from "@hookform/resolvers/zod";
import { router, Link, useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, StyleSheet, TextInput as TextInputRn, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Text, TextInput, Button } from "react-native-paper";
import { z } from "zod";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { View } from "@/components/Themed";
import { Dropdown } from "react-native-element-dropdown";
import { IDropdownRef } from "react-native-element-dropdown/lib/typescript/components/Dropdown/model";
import DateTimePicker, { DatePickerOptions } from '@react-native-community/datetimepicker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import firestore from '@react-native-firebase/firestore';
import FlashMessage, { showMessage } from "react-native-flash-message";
import { partialGoalForm } from "./assingGoal";
import { useRoute } from '@react-navigation/native';

const goalSecondaryForm = z.object({
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
}).refine(schema => {
  const startDate = schema.startDate;
  const deadline = schema.deadline;
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();
  const startDay = startDate.getDate();

  const deadlineYear = deadline.getFullYear();
  const deadlineMonth = deadline.getMonth();
  const deadlineDay = deadline.getDate();

  return startYear < deadlineYear || 
    (startYear === deadlineYear && startMonth < deadlineMonth) || 
    (startYear === deadlineYear && startMonth === deadlineMonth && startDay <= deadlineDay);
}, {message: "La fecha límite debe ser mayor a la fecha de inicio", path: ["deadline"]},);

const goalForm = goalSecondaryForm.and(partialGoalForm)

type GoalFormType = z.infer<typeof goalForm>
type CallbackFunction = () => void;

type Modality = {
  label: string;
  value: string;
};

export default function InfoGoals() {
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDeadlineDatePicker, setShowDeadlineDatePicker] = useState(false);
  const [modalityData, setModalityData] = useState<Modality[]>([]);
  const navigation = useNavigation();
  const route = useRoute();
  const firstGoalData = route.params?.formData;
  const patientId = route.params?.sessionDocId;
  const today = new Date();
  const [loading, setLoading] = useState<boolean>(false);
  console.log("Goo", firstGoalData)
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      modality: '',
      frequency: 0,
      startDate: today,
      deadline: today,
    },
    resolver: zodResolver(goalSecondaryForm),
  });

  const refs = {
    modalityRef: React.useRef<IDropdownRef>(null),
    frequencyRef: React.useRef<TextInputRn>(null),
    startDateRef: React.useRef<DatePickerOptions>(null),
    deadlineRef: React.useRef<DatePickerOptions>(null),
  } as const;

  
  const showSuccessMessage = (callback: CallbackFunction) => {
    showMessage({
      type: "success",
      message: "Success",
      description: "La meta fue agregada exitosamente",
      backgroundColor: Colors.green, 
      color: Colors.white, 
      icon: props => <Image source={{uri: 'https://www.iconpacks.net/icons/5/free-icon-green-check-mark-approval-16196.png'}} {...props} />,
      style: {
        borderRadius: 10, 
      },
    });
    setTimeout(callback, 2000);
  }

  const onSubmit = (data: GoalFormType) => {
    setLoading(true);
    console.log("Enviados correctamente ", data)   
    const newGoalId = firestore().collection('Goal').doc().id
    const newGoalData = {
      Deadline: data.deadline,
      Description: data.description,
      Frequency: data.frequency,
      Modality: data.modality,
      StartDate: data.startDate,
      Title: data.title,
      Type: data.type,
    }
    const goalDocRef = firestore().collection('Goal').doc(newGoalId);
    goalDocRef.set(newGoalData)
    .then(() => {
      console.log('Goal added!');
      if (patientId !== undefined) {
        firestore()
        .collection('Patient')
        .doc(patientId)
        .update({
          Goals: firestore.FieldValue.arrayUnion(goalDocRef)
        })
        .then(() => {
          console.log("Patient sent: ", patientId);
          setLoading(false);
          navigation.navigate('GoalList', { sessionDocId: patientId });
          showSuccessMessage(() => {
          });
          console.log('Patient Goal added!');
        })
        .catch((error) => {
          setLoading(false);
          console.error('Error adding goal to patient: ', error);
        });
      } else {
        setLoading(false);
        showSuccessMessage(() => {
          router.navigate('/(tabs)/goals');
        });
      }
    })
    .catch((error) => {
      setLoading(false);
      console.error('Error adding goal: ', error);
    });
      
  };

  useEffect(() => {
    const unsubscribe = firestore().collection('Modality').onSnapshot(
      (querySnapshot) => {
        try {
          const modalityData = querySnapshot.docs.map(doc => ({
            label: doc.data().Type,
            value: doc.data().Type
          }));
          setModalityData(modalityData);
        } catch (error) {
          console.error("Error fetching categories:", error);
        }
      },
      (error) => {
        console.error("Error listening to categories collection:", error);
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
        render={({ field: { onChange, onBlur, value } }) => (
          <Dropdown
            ref={refs.modalityRef}
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
            ref={refs.frequencyRef}
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
              refs.startDateRef.current?.display;
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
                minimumDate={today}
                negativeButton={{ label: 'Cancelar' }}
                positiveButton={{ label: 'Aceptar' }}
              />
            )}
          </View>
        )}
        name="startDate"
        defaultValue={today}
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
                onChange={(_, selectedDate) => {
                  setShowDeadlineDatePicker(false);
                  onChange(selectedDate);
                }}
                minimumDate={today}
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
          Retroceder
        </Link>

        <Button
          style={{ ...styles.button, backgroundColor: Colors.lightblue }}
          mode="contained"
          disabled={loading}
          onPress={handleSubmit((secondGoalData) => {
            onSubmit({ ...firstGoalData, ...secondGoalData });
          })}
        >
          {loading && <ActivityIndicator
            animating={loading}
            hidesWhenStopped={true}
            />}
          <Text style={{ fontSize: 16, color: Colors.white, fontWeight: 'bold' }}>{loading ? "Cargando" : "Crear"}</Text>
        </Button>        
      </View>
      <FlashMessage position="top" />
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
    backgroundColor: Colors.white,
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
    borderColor: Colors.gray,
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
