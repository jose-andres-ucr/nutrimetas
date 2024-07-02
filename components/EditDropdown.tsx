import React from 'react';
import { Controller, Control } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import { Dropdown } from "react-native-element-dropdown";
import { IDropdownRef } from "react-native-element-dropdown/lib/typescript/components/Dropdown/model";
import { CommonType } from "@/components/FetchData"; // Ajusta la ruta según tu estructura de proyecto

type GoalFormType = {
  type: string;
  action: string;
  rubric: string;
  amount: string;
  portion: string;
  frequency: string;
  notificationTime: Date;
  
};

type EditDropdownProps = {
  name: keyof GoalFormType;
  data: CommonType[];
  control: Control<GoalFormType>;
  refs: { [key: string]: React.MutableRefObject<IDropdownRef | null> };
  placeholder: string;
  value?: string; 
};

const EditDropdown: React.FC<EditDropdownProps> = ({ name, data, control, refs, placeholder, value }) => {
  if (name === 'notificationTime') {
    return null;
  }
  return (
    <Controller
      control={control}
      render={({ field: { onChange, onBlur, value: fieldValue } }) => (
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
          value={fieldValue || value || ''} 
          onChange={(item) => onChange(item?.id || '')}
          onBlur={onBlur}
        />
      )}
      name={name}
      defaultValue={value || ''} 
    />
  );
};

const styles = StyleSheet.create({
  dropdown: {
    margin: 13,
    padding: 7,
    marginVertical: 10,
    width: "80%",
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

export default EditDropdown;
