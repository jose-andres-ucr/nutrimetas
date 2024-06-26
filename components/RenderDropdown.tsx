import React from 'react';
import { Controller, Control } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import { Dropdown } from "react-native-element-dropdown";
import { IDropdownRef } from "react-native-element-dropdown/lib/typescript/components/Dropdown/model";
import { CommonType } from "@/components/FetchData"; // Asegúrate de ajustar esta ruta según tu estructura de proyecto

type GoalFormType = {
  type: string;
  action: string;
  rubric: string;
  amount: string;
};

type RenderDropdownProps = {
  name: keyof GoalFormType;
  data: CommonType[];
  control: Control<GoalFormType>;
  refs: { [key: string]: React.MutableRefObject<IDropdownRef | null> };
  placeholder: string;
};

const RenderDropdown: React.FC<RenderDropdownProps> = ({ name, data, control, refs, placeholder }) => (
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

const styles = StyleSheet.create({
  dropdown: {
    margin: 13,
    padding: 7,
    marginVertical: 10,
    width: "70%",
    height: 50,
    borderColor: '#ccc',
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: '#fff'
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

export default RenderDropdown;
