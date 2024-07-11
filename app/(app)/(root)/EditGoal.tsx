import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { Text, Button } from "react-native-paper";
import { z } from "zod";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { View } from "@/components/Themed";
import EditDropdown from "@/components/EditDropdown";
import { IDropdownRef } from "react-native-element-dropdown/lib/typescript/components/Dropdown/model";
import { useDropDownDataFirestoreQuery } from "@/components/FetchData";
import { RouteProp, useRoute } from "@react-navigation/native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import DateTimePicker from '@react-native-community/datetimepicker';
import { showMessage } from "react-native-flash-message";
import Collections from "@/constants/Collections";
import firestore from '@react-native-firebase/firestore';

const today = new Date();

type ConfigGoalScreenRouteProp = RouteProp<{
  params: {
    serializedGoal: string;
    GoalId: string;
    patientId: string;
  };
}, 'params'>;

export const GoalForm = z.object({
  type: z
    .string()
    .min(1, { message: "Debe seleccionar un tipo" }),
  action: z
    .string()
    .min(1, { message: "Debe seleccionar una acción" }),
  rubric: z
    .string()
    .min(1, { message: "Debe seleccionar un rubro" }),
  amount: z
    .string()
    .min(1, { message: "Debe seleccionar una cantidad" }),
  portion: z
    .string()
    .min(1, { message: "Debe seleccionar una porción" }),
  frequency: z
    .string()
    .min(1, { message: "Debe seleccionar alguna frecuencia" }),
  notificationTime: z
    .date({ required_error: "Debe ingresar una hora de notificación válida" }),
  startDate: z
    .date({ required_error: "Debe ingresar una fecha de inicio" }),
  deadline: z
    .date({ required_error: "Debe ingresar una fecha límite" }),
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

type GoalFormType = z.infer<typeof GoalForm>;
type CallbackFunction = () => void;

export default function EditGoal() {
  const router = useRouter();
  const route = useRoute<ConfigGoalScreenRouteProp>();
  const { serializedGoal, GoalId, patientId } = route.params;
  const [GoalData, setParsedFormData] = useState<any>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDeadlineDatePicker, setShowDeadlineDatePicker] = useState(false);
  const [showNotificationTimePicker, setShowNotificationTimePicker] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  const { data: actionData = [], error: actionError, isLoading: actionLoading } = useDropDownDataFirestoreQuery('Action');
  const { data: typeData = [], error: typeError, isLoading: typeLoading } = useDropDownDataFirestoreQuery('Type');
  const { data: rubricData = [], error: rubricError, isLoading: rubricLoading } = useDropDownDataFirestoreQuery('Rubric');
  const { data: amountData = [], error: amountError, isLoading: amountLoading } = useDropDownDataFirestoreQuery('Amount');
  const { data: portionData = [], error: portionError, isLoading: portionLoading } = useDropDownDataFirestoreQuery('Portion');
  const { data: frequencyData = [], error: frequencyError, isLoading: frequencyLoading } = useDropDownDataFirestoreQuery('Frequency');

  useEffect(() => {
    if (serializedGoal) {
      setParsedFormData(JSON.parse(decodeURIComponent(serializedGoal)));
    }
  }, [serializedGoal]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      type: '',
      action: '',
      rubric: '',
      amount: '',
      portion: '',
      frequency: '',
      notificationTime: resetTimeToZero(today),
      startDate: today,
      deadline: today,
    },
    resolver: zodResolver(GoalForm),
  });

  useEffect(() => {

    if (GoalData) {
      setValue('type', GoalData?.Type || '');
      setValue('action', GoalData?.Action || '');
      setValue('rubric', GoalData?.Rubric || '');
      setValue('amount', GoalData?.Amount || '');
      setValue('portion', GoalData?.Portion || '');
      setValue('frequency', GoalData?.Frequency || '');
      setValue('notificationTime', GoalData?.NotificationTime ? new Date(GoalData.NotificationTime.seconds * 1000) : resetTimeToZero(today));
      setValue('startDate', GoalData?.StartDate ? new Date(GoalData.StartDate.seconds * 1000) : today);
      setValue('deadline', GoalData?.Deadline ? new Date(GoalData.Deadline.seconds * 1000) : today);
    }
  }, [GoalData, setValue]);

  const refs = {
    typeRef: React.useRef<IDropdownRef>(null),
    actionRef: React.useRef<IDropdownRef>(null),
    rubricRef: React.useRef<IDropdownRef>(null),
    amountRef: React.useRef<IDropdownRef>(null),
    portionRef: React.useRef<IDropdownRef>(null),
    frequencyRef: React.useRef<IDropdownRef>(null),
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

  const showErrorMessage = (callback: CallbackFunction) => {
    showMessage({
      type: "danger",
      message: "Error",
      description: "Hubo un error al agregar la meta a los pacientes",
      backgroundColor: Colors.red,
      color: Colors.white,
      icon: props => <Image source={{ uri: 'https://www.iconpacks.net/icons/5/free-icon-red-cross-mark-approval-16197.png' }} {...props} />,
      style: {
        borderRadius: 10,
      },
    });
    setTimeout(callback, 4000);
  }

  const onSubmit = (data: GoalFormType) => {
    setLoading(true);
    const updatedGoalData = {
      Deadline: data.deadline,
      Frequency: data.frequency,
      StartDate: data.startDate,
      NotificationTime: data.notificationTime,
      Type: data.type,
      Action: data.action,
      Rubric: data.rubric,
      Amount: data.amount,
      Portion: data.portion,
    };

    const goalDocRef = firestore().collection(Collections.Goal).doc(GoalId);

    goalDocRef.update(updatedGoalData)
      .then(() => {
        console.log('Goal updated!');
        setLoading(false);
        showSuccessMessage(() => { });
        router.replace({ pathname: '/(app)/(root)/(patientTabs)/goalsPatient', params: { patientId: patientId } });
      })
      .catch((error) => {
        setLoading(false);
        showErrorMessage(() => { });
        console.error('Error updating goal: ', error);
      });
  };

  function resetTimeToZero(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Editar Meta</Text>
      <ScrollView contentContainerStyle={styles.formContent}>
        <View style={[styles.textInfo, { paddingTop: 0 }]}>
          <Text>Tipo</Text>
        </View>
        <EditDropdown name='type' data={typeData} control={control} refs={refs} placeholder="Seleccione un tipo" value={GoalData?.Type || ""} />
        {errors.type ? (
          <Text style={styles.error}>{errors.type.message}</Text>
        ) : null}

        <View style={[styles.textInfo, { paddingTop: 5 }]}>
          <Text>Acción</Text>
        </View>
        <EditDropdown name='action' data={actionData} control={control} refs={refs} placeholder="Seleccione una acción" value={GoalData?.Action || ""} />
        {errors.action ? (
          <Text style={styles.error}>{errors.action.message}</Text>
        ) : null}

        <View style={[styles.textInfo, { paddingTop: 5 }]}>
          <Text>Rubro</Text>
        </View>
        <EditDropdown name='rubric' data={rubricData} control={control} refs={refs} placeholder="Seleccione un rubro" value={GoalData?.Rubric || ""} />
        {errors.rubric ? (
          <Text style={styles.error}>{errors.rubric.message}</Text>
        ) : null}

        <View style={[styles.textInfo, { paddingTop: 5 }]}>
          <Text>Cantidad</Text>
        </View>
        <EditDropdown name='amount' data={amountData} control={control} refs={refs} placeholder="Seleccione una cantidad" value={GoalData?.Amount || ""} />
        {errors.amount ? (
          <Text style={styles.error}>{errors.amount.message}</Text>
        ) : null}

        <View style={[styles.textInfo, { paddingTop: 5 }]}>
          <Text>Porción</Text>
        </View>
        <EditDropdown name='portion' data={portionData} control={control} refs={refs} placeholder="Seleccione una porción" value={GoalData?.Portion || ""} />
        {errors.portion ? (
          <Text style={styles.error}>{errors.portion?.message}</Text>
        ) : null}

        <View style={[styles.textInfo, { paddingTop: 5 }]}>
          <Text>Frecuencia</Text>
        </View>
        <EditDropdown name='frequency' data={frequencyData} control={control} refs={refs} placeholder="Seleccione una frecuencia" value={GoalData?.Frequency || ""} />
        {errors.frequency ? (
          <Text style={styles.error}>{errors.frequency?.message}</Text>
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
          defaultValue={GoalData?.NotificationTime ? new Date(GoalData.NotificationTime.seconds * 1000) : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 5, 56)}

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
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Cancelar</Text>
          </Button>

          <Button
            style={{ ...styles.button, backgroundColor: Colors.lightblue }}
            mode="contained"
            disabled={loading}
            onPress={handleSubmit((form) => {
              onSubmit({ ...form });
            })}
          >
            <Text style={{ fontSize: 16, color: Colors.white, fontWeight: 'bold' }}>{loading ? "Cargando" : "Actualizar"}</Text>
          </Button>
        </View>

        <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '5%',
  },
  formContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  textInfo: {
    justifyContent: 'flex-start',
    width: '80%',
    backgroundColor: Colors.transparent,
    marginVertical: 5,
  },
  buttonContainer: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    backgroundColor: Colors.transparent,
  },
  button: {
    height: 40,
    borderRadius: 5,
    width: 165,
    marginVertical: 12,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 50,
  },
  returnButton: {
    borderWidth: 1,
    borderColor: Colors.black,
    backgroundColor: Colors.transparent,
  },
  error: {
    color: Colors.red,
    marginTop: 4,
  },
  datePickerStyle: {
    width: '80%',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.gray,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
});

