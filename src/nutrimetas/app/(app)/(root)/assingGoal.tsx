import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from 'expo-router';
import React from 'react';
import { Control, Controller, useForm } from 'react-hook-form';
import { Platform, StyleSheet, ScrollView } from 'react-native';
import { Text, Button } from "react-native-paper";
import { z } from "zod";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRoute } from '@react-navigation/native';
import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { View } from "@/components/Themed";
import { Dropdown } from "react-native-element-dropdown";
import { IDropdownRef } from "react-native-element-dropdown/lib/typescript/components/Dropdown/model";
import { CommonType, useDropDownDataFirestoreQuery } from "@/components/FetchData";

export const partialGoalForm = z.object({
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
});

type GoalFormType = z.infer<typeof partialGoalForm>

const renderDropdown = (
  name: keyof GoalFormType,
  data: CommonType[],
  control: Control<GoalFormType>,
  refs: { [key: string]: React.MutableRefObject<IDropdownRef | null> },
  placeholder: string
) => (
  <Controller
    control={control}
    render={({ field: { onChange, onBlur, value } }) => (
      <Dropdown
        ref={refs[`${name}Ref`]}
        style={styles.dropdown}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        iconStyle={styles.iconStyle}
        data={data}
        search
        maxHeight={220}
        labelField="name"
        valueField="id"
        placeholder={placeholder}
        searchPlaceholder="Buscar..."
        value={value}
        onChange={(item) => onChange(item?.id || '')}
        onBlur={onBlur}
      />
    )}
    name={name}
  />
);

export default function AssignGoal() {
  const router = useRouter();
  const route = useRoute();
  const patientId = route.params?.sessionDocId;
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      type: '',
      action: '',
      rubric: '',
      amount: '',
    },
    resolver: zodResolver(partialGoalForm),
  });

  const refs = {
    typeRef: React.useRef<IDropdownRef>(null),
    actionRef: React.useRef<IDropdownRef>(null),
    rubricRef: React.useRef<IDropdownRef>(null),
    amountRef: React.useRef<IDropdownRef>(null),
    } as const;
    
    const onSubmit = (data: GoalFormType) => {
      console.log("Patient sent: ", patientId);
      const serializedFormData = encodeURIComponent(JSON.stringify(data));
      router.push({
        pathname: '/configGoal',
        params: {
          formData: serializedFormData,
          patientId: patientId
        }
      });
    };

    const { data: actionData = [], error: actionError, isLoading: actionLoading } = useDropDownDataFirestoreQuery('Action');
    const { data: typeData = [], error: typeError, isLoading: typeLoading } = useDropDownDataFirestoreQuery('Type');
    const { data: rubricData = [], error: rubricError, isLoading: rubricLoading } = useDropDownDataFirestoreQuery('Rubric');
    const { data: amountData = [], error: amountError, isLoading: amountLoading } = useDropDownDataFirestoreQuery('Amount');

  return (
    <ScrollView>    
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Asignar Meta</Text>
        <Text style={styles.subtitle}>NUTRI<Text style={{ color: Colors.lightblue }}>METAS</Text></Text>
        <View style={styles.separator} lightColor={Colors.lightGray} darkColor={Colors.white} />

        <View style={[styles.textInfo, { paddingTop: 0 }]}>
          <Text>Tipo</Text>
        </View>
        {renderDropdown('type', typeData, control, refs, "Seleccione un tipo")}
        {errors.type ? (
          <Text style={styles.error}>{errors.type.message}</Text>
        ) : null}

        <View style={[styles.textInfo, { paddingTop: 5 }]}>
          <Text>Acción</Text>
        </View>
        {renderDropdown('action', actionData, control, refs, "Seleccione una acción")}
        {errors.action ? (
          <Text style={styles.error}>{errors.action.message}</Text>
        ) : null}

        <View style={[styles.textInfo, { paddingTop: 5 }]}>
          <Text>Rubro</Text>
        </View>
        {renderDropdown('rubric', rubricData, control, refs, "Seleccione un rubro")}
        {errors.rubric ? (
          <Text style={styles.error}>{errors.rubric.message}</Text>
        ) : null}

        <View style={[styles.textInfo, { paddingTop: 5 }]}>
          <Text>Cantidad</Text>
        </View>
        {renderDropdown('amount', amountData, control, refs, "Seleccione una cantidad")}
        {errors.amount ? (
          <Text style={styles.error}>{errors.amount.message}</Text>
        ) : null}        

        <View style={styles.buttonContainer}>
        <Button
            style={{ ...styles.button, ...styles.returnButton }}
            mode="contained"
            onPress={() =>router.back()}
          >
            <Text style={{fontSize: 16, fontWeight: 'bold'}}>Cancelar</Text>
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
  }
});