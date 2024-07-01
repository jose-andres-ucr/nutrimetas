import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Platform, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Button } from "react-native-paper";
import { z } from "zod";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import { View } from "@/components/Themed";
import EditDropdown from "@/components/EditDropdown";
import { IDropdownRef } from "react-native-element-dropdown/lib/typescript/components/Dropdown/model";
import { useDropDownDataFirestoreQuery } from "@/components/FetchData";
import { RouteProp, useRoute } from "@react-navigation/native";


type ConfigGoalScreenRouteProp = RouteProp<{
  params: {
    serializedGoal: string;
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
});

type GoalFormType = z.infer<typeof GoalForm>;

export default function EditGoal() {
  const router = useRouter();
  const route = useRoute<ConfigGoalScreenRouteProp>();
  const { serializedGoal, patientId } = route.params;
  const [GoalData, setParsedFormData] = useState<any>(null);

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

  const onSubmit = (data: GoalFormType) => {
    console.log("ma data", data);
  };

  const { data: actionData = [], error: actionError, isLoading: actionLoading } = useDropDownDataFirestoreQuery('Action');
  const { data: typeData = [], error: typeError, isLoading: typeLoading } = useDropDownDataFirestoreQuery('Type');
  const { data: rubricData = [], error: rubricError, isLoading: rubricLoading } = useDropDownDataFirestoreQuery('Rubric');
  const { data: amountData = [], error: amountError, isLoading: amountLoading } = useDropDownDataFirestoreQuery('Amount');
  const { data: portionData = [], error: portionError, isLoading: portionLoading } = useDropDownDataFirestoreQuery('Portion');
  const { data: frequencyData = [], error: frequencyError, isLoading: frequencyLoading } = useDropDownDataFirestoreQuery('Frequency');

  return (
    <ScrollView>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Editar Meta</Text>
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

        <View style={styles.buttonContainer}>
          <Button
            style={{ ...styles.button, ...styles.returnButton }}
            mode="contained"
            onPress={() => router.back()}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Cancelar</Text>
          </Button>

          <Button
            style={{ ...styles.button, backgroundColor: Colors.lightblue }}
            mode="contained"
            onPress={handleSubmit((form) => {
              onSubmit({ ...form });
            })}
          >
            <Text style={{ fontSize: 16, color: Colors.white, fontWeight: 'bold' }}>Continuar</Text>
          </Button>

        </View>

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
    marginTop: '5%',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 4,
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
    marginBottom: 24,
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
    margin: 13,
    padding: 7,
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
  textInfo: {
    justifyContent: 'flex-start',
    width: '70%',
    backgroundColor: Colors.transparent,
  },
  loadingText: {
    marginTop: 30,
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    marginTop: 70,
    alignItems: 'center',
  },
});
