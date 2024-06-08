import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, StyleSheet, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { Text, Button } from "react-native-paper";
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
import { showMessage } from "react-native-flash-message";
import { partialGoalForm } from "./assingGoal";
import { useRoute, RouteProp } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useDropDownDataFirestoreQuery } from "@/components/FetchData";

const goalSecondaryForm = z.object({
  portion: z
    .string()
    .min(1, { message: "Debe seleccionar una porción" }),
  frequency: z
    .string()
    .min(1, { message: "Debe seleccionar alguna frecuencia" }),
  notificationTime: z
    .date()
    .optional(),
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
}, { message: "La fecha límite debe ser mayor a la fecha de inicio", path: ["deadline"] },);

const goalForm = goalSecondaryForm.and(partialGoalForm)

type GoalFormType = z.infer<typeof goalForm>
type CallbackFunction = () => void;

type ConfigGoalScreenRouteProp = RouteProp<{
  params: {
    formData: string;
    patientId: string;
  };
}, 'params'>;


export default function InfoGoals() {
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDeadlineDatePicker, setShowDeadlineDatePicker] = useState(false);
  const [showNotificationTimePicker, setShowNotificationTimePicker] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const route = useRoute<ConfigGoalScreenRouteProp>();
  const router = useRouter();
  const { formData, patientId } = route.params;
  const [firstGoalData, setParsedFormData] = useState<any>(null);
  const today = new Date();

  useEffect(() => {
    if (formData) {

      setParsedFormData(JSON.parse(decodeURIComponent(formData)));
    }
  }, [formData]);

  function resetTimeToZero(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      portion: '',
      frequency: '',
      notificationTime: resetTimeToZero(today),
      startDate: today,
      deadline: today,
    },
    resolver: zodResolver(goalSecondaryForm),
  });

  const refs = {
    portionRef: React.useRef<IDropdownRef>(null),
    frequencyRef: React.useRef<IDropdownRef>(null),
    notificationTimeRef: React.useRef<DatePickerOptions>(null),
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
      icon: props => <Image source={{ uri: 'https://www.iconpacks.net/icons/5/free-icon-green-check-mark-approval-16196.png' }} {...props} />,
      style: {
        borderRadius: 10,
      },
    });
    setTimeout(callback, 2000);
  }

  const onSubmit = (data: GoalFormType) => {
    setLoading(true);
    console.log("Enviados correctamente ", data)
    const template = patientId === undefined ? true : false;
    const newGoalId = firestore().collection('Goal').doc().id
    const newGoalData = {
      Deadline: data.deadline,
      Frequency: data.frequency,
      StartDate: data.startDate,
      NotificationTime: data.notificationTime,
      Type: data.type,
      Action: data.action,
      Rubric: data.rubric,
      Amount: data.amount,
      Portion: data.portion,
      Template: template,
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
              showSuccessMessage(() => {
              });
              console.log('Patient Goal added!');
              router.replace({ pathname: '/GoalList', params: { patientId: patientId } });
            })
            .catch((error) => {
              setLoading(false);
              console.error('Error adding goal to patient: ', error);
            });
        } else {
          setLoading(false);
          showSuccessMessage(() => {
            router.push({ pathname: '/goals' }); //'/(tabs)/goals'
          });
        }
      })
      .catch((error) => {
        setLoading(false);
        console.error('Error adding goal: ', error);
      });

  };

  const { data: portionData = [], error: portionError, isLoading: portionLoading } = useDropDownDataFirestoreQuery('Portion');

  const { data: frequencyData, error: frequencyError, isLoading: frequencyLoading } = useDropDownDataFirestoreQuery('Frequency');

  return (
    <ScrollView>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Asignar Meta</Text>
        <Text style={styles.subtitle}>NUTRI<Text style={{ color: Colors.lightblue }}>METAS</Text></Text>
        <View style={styles.separator} lightColor={Colors.lightGray} darkColor={Colors.white} />

        <View style={[styles.textInfo, { paddingTop: 5 }]}>
          <Text>Porción</Text>
        </View>
        <Controller
          control={control}
          render={({ field: { onChange, onBlur, name } }) => (
            portionData ? (
              <Dropdown
                ref={refs.portionRef}
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={portionData}
                search
                maxHeight={220}
                labelField="name"
                valueField="id"
                placeholder="Seleccione una porción"
                searchPlaceholder="Buscar..."
                value={name}
                onChange={(item) => onChange(item?.id || '')}
                onBlur={onBlur}
              />
            ) : (
              <ActivityIndicator />
            )
          )}
          name="portion"
        />
        {errors.portion ? (
          <Text style={styles.error}>{errors.portion.message}</Text>
        ) : null}

        <View style={[styles.textInfo, { paddingTop: 5 }]}>
          <Text>Frecuencia</Text>
        </View>
        <Controller
          control={control}
          render={({ field: { onChange, onBlur, name } }) => (
            frequencyData ? (
              <Dropdown
                ref={refs.frequencyRef}
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={frequencyData}
                search
                maxHeight={220}
                labelField="name"
                valueField="id"
                placeholder="Seleccione una frecuencia"
                searchPlaceholder="Buscar..."
                value={name}
                onChange={(item) => onChange(item?.id || '')}
                onBlur={onBlur}
              />
            ) : (
              <ActivityIndicator />
            )
          )}
          name="frequency"
        />
        {errors.frequency ? (
          <Text style={styles.error}>{errors.frequency.message}</Text>
        ) : null}

        <View style={[styles.textInfo, { paddingTop: 5, paddingBottom: 10 }]}>
          <Text>Hora de Notificación</Text>
        </View>
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <View>
              <TouchableOpacity style={styles.datePickerStyle} onPress={() => setShowNotificationTimePicker(true)}>
                <Text>{value.toLocaleTimeString()}</Text>
                <FontAwesome name="clock-o" size={24} color="gray" />
              </TouchableOpacity>
              {showNotificationTimePicker && (
                <DateTimePicker
                  value={new Date(value)}
                  mode="time"
                  display="default"
                  onChange={(_, selectedDate) => {
                    setShowNotificationTimePicker(false);
                    onChange(selectedDate);
                  }}
                  negativeButton={{ label: 'Cancelar' }}
                  positiveButton={{ label: 'Aceptar' }}
                />
              )}
            </View>
          )}
          name="notificationTime"
          defaultValue={resetTimeToZero(today)}
        />

        <View style={[styles.textInfo, { paddingTop: 15, paddingBottom: 10 }]}>
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
                  onChange={(_, selectedDate) => {
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

        <View style={[styles.textInfo, { paddingTop: 15, paddingBottom: 10 }]}>
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
          <Button
            style={{ ...styles.button, ...styles.returnButton }}
            mode="contained"
            disabled={loading}
            onPress={() => router.back()}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Retroceder</Text>
          </Button>

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
  returnButton: {
    borderWidth: 1,
    borderColor: Colors.black,
    backgroundColor: Colors.transparent,
  },
  buttonContainer: {
    marginTop: 40,
    backgroundColor: Colors.transparent,
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
  textInfo: {
    justifyContent: 'flex-start',
    width: '70%',
    backgroundColor: Colors.transparent,
  }
});
