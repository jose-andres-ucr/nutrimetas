// Dependencies
// React Hooks & References
import { useRef, ElementRef } from "react";

// Core React Native UI
import { StyleSheet, Pressable } from "react-native";

// Expo UI
import { Image } from "expo-image";

// Color palettes
import Colors from "@/constants/Colors";
import { View, Text, TextInput } from "@/components/Themed";

// Image assets
import MailIcon from '@/assets/images/mail.svg';
import LockIcon from '@/assets/images/lock.svg';

// Form structure and hooks
import { useForm, SubmitHandler, Controller } from "react-hook-form";

// Data validation and sanitization
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Basic login data (input for form)
// TODO: Add MFA boolean option for MFA usage
export type ResetPasswordFormDetails = {
    readonly email: string;
    readonly password: string;
};

// Login form schema (data validation)
const passwordFieldValidation = z.string()
    .min(1, {message: "No se permiten contraseñas vacías"})
    .regex(/^[\S]+$/, {message: "No se admiten espacios vacíos"});

const formSchema = z.object({
    password_a: passwordFieldValidation,
    password_b: passwordFieldValidation,
}).refine(
    (data) => (data.password_a === data.password_b), {
        message: "Las contraseñas no coinciden. Inténtelo de nuevo",
        path: ['confirm'],
    }
);

/// Login form results (output from form)
export type ResetPasswordFormResults = z.infer<typeof formSchema>;

// Login form rendering and hooks
export default function ResetPasswordForm(
    props: {onSubmit: SubmitHandler<ResetPasswordFormResults>}
) {
    // Register the login form's hook 
    const {
        // MVC controller and its stub
        control, handleSubmit,
        // Errors collected over all form fields
        formState: { errors },
    } = useForm<ResetPasswordFormResults>({
        // Inject default form values
        defaultValues: {
            password_a: '',
            password_b: '',
        },
        // Inject form data validation
        resolver: zodResolver(formSchema),
    });

    // Register the login form's field refs
    const {passwordARef, passwordBRef} = {
        passwordARef: useRef<ElementRef<typeof TextInput>>(null),
        passwordBRef: useRef<ElementRef<typeof TextInput>>(null),
    } as const; // 

    // Render login form
    return (
        // Overall form frame
        <View style={FormStyles.FormView}>

            {/* Password field A */}
            <View style={FormStyles.FieldView}>
                {/* Input */}
                <View style={FormStyles.FieldInputView}>
                    <Image 
                        source={LockIcon}
                        onError={(error) => {
                            console.error("Error loading image:", error);
                        }}

                        style={FormStyles.InputTextIcon}
                        contentFit="contain"
                    />
                    <Controller
                        control = { control }
                        rules = { {required: true,} }
                        render = { 
                            ({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                ref={passwordARef}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}

                                placeholder="Contraseña"
                                autoComplete="current-password"
                                autoCapitalize="none"
                                returnKeyType="next"
                                style={FormStyles.FieldInputText}

                                secureTextEntry={true}
                                blurOnSubmit={false}
                                onSubmitEditing={() => {
                                    passwordARef.current?.focus();
                                }}  
                            />
                        )}
                        name = "password_a"
                    />
                </View>

                {/* Errors */}
                {errors.password_a && 
                        <Text style={FormStyles.ErrorText}> 
                            {errors.password_a.message} 
                        </Text>}
            </View>

            {/* Password field B */}
            <View style={FormStyles.FieldView}>
                {/* Input */}
                <View style={FormStyles.FieldInputView}>
                    <Image 
                        source={LockIcon}
                        onError={(error) => {
                            console.error("Error loading image:", error);
                        }}

                        style={FormStyles.InputTextIcon}
                        contentFit="contain"
                    />
                    <Controller
                        control = { control }
                        rules = { {required: true,} }
                        render = { 
                            ({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                ref={passwordBRef}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}

                                placeholder="Confirmar contraseña"
                                autoComplete="current-password"
                                autoCapitalize="none"
                                returnKeyType="next"
                                style={FormStyles.FieldInputText}

                                secureTextEntry={true}
                                blurOnSubmit={false}
                                onSubmitEditing={() => {
                                    passwordBRef.current?.focus();
                                }}  
                            />
                        )}
                        name = "password_b"
                    />
                </View>

                {/* Errors */}
                {errors.password_b && 
                        <Text style={FormStyles.ErrorText}> 
                            {errors.password_b.message} 
                        </Text>}
            </View>

            {/* Form errors */}
            {errors.confirm && 
                <Text style={FormStyles.ErrorText}> 
                    {errors.confirm.message} 
                </Text>}

            {/* Submit button */}
            <Pressable 
                style = {FormStyles.SubmitButton}
                onPress = {handleSubmit(props.onSubmit)}  
            >
                <Text style={FormStyles.SubmitButtonText}> Cambiar contraseña </Text>
            </Pressable>

        </View>
    )
}

// Login form styles
const FormStyles = StyleSheet.create({
    FormView: {
        flex: 1,
        padding: 5,
        gap: 10,
        maxHeight: 300,
        width: "100%",

        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "center",
        // backgroundColor: "green"
    },
    FieldView: {
        flex: 1,
        width: "100%",

        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "center",

        /// backgroundColor: "green"
    },
    FieldInputView: {
        flex: 1,
        padding: 5,
        gap: 10,
        maxHeight: 30,

        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",

        borderBottomWidth: 1,
        borderBottomColor: Colors.gray,
        // backgroundColor: "green"
    },
    InputTextIcon: {
        width: 25,
        height: 25,
        color: Colors.gray,
    },
    FieldInputText: {
        fontWeight: "normal",
        fontFamily: "sans-serif-light",
        fontStyle: "normal",

        textAlign: "justify",        
    },
    ErrorText: {
        fontWeight: "bold",
        fontFamily: "sans-serif-light",
        fontStyle: "italic",
        color: Colors.red,

        textAlign: "left",
    },
    SubmitButton: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 4,
        elevation: 3,

        alignItems: 'center',
        justifyContent: 'center',
        
        backgroundColor: Colors.lightblue,
    },
    SubmitButtonText: {
        fontWeight: "bold",
        fontFamily: "sans-serif-light",
        fontStyle: "normal",
        color: Colors.white,

        textAlign: "justify",
        borderBottomColor: Colors.gray,
    },
});