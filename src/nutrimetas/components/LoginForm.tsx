// Dependencies
// React Hooks & References
import { useRef } from "react";

// Core React Native UI
import { View, Text, TextInput, StyleSheet, Pressable, 
    ImageSourcePropType } from "react-native";

// Expo UI
import { useAssets } from 'expo-asset'; 
import { Image } from "expo-image";

// Form structure and hooks
import { useForm, SubmitHandler, Controller, Form } from "react-hook-form";

// Data validation and sanitization
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Basic login data (input for form)
// TODO: Add MFA boolean option for MFA usage
export type LoginFormDetails = {
    readonly email: string;
    readonly password: string;
};

// Login form schema (data validation)
const formSchema = z.object({
    email: z.string()
        .min(1, {message: "No se permiten correos vacíos"})
        .email({message: "Se requiere de un correo válido"}),
    password: z.string()
        .min(1, {message: "No se permiten contraseñas vacías"})
        .regex(/^[\S]+$/, {message: "No se admiten espacios vacíos"}),
});

/// Login form results (output from form)
export type LoginFormResults = z.infer<typeof formSchema>;

// Login form rendering and hooks
export default function LoginForm(
    props: {onSubmit: SubmitHandler<LoginFormResults>}
) {
    // Register the login form's hook 
    const {
        // MVC controller and its stub
        control, handleSubmit,
        // Errors collected over all form fields
        formState: { errors },
    } = useForm<LoginFormResults>({
        // Inject default form values
        defaultValues: {
            email: '',
            password: '',
        },
        // Inject form data validation
        resolver: zodResolver(formSchema),
    });

    // Register the login form's field refs
    const {emailRef, passwordRef} = {
        emailRef: useRef<TextInput>(null),
        passwordRef: useRef<TextInput>(null),
    } as const;

    // Register the icon loading hook
    const [icon, error] = useAssets([
        require('@/assets/images/mail.svg'), 
        require('@/assets/images/lock.svg')
    ]);

    // Render login form
    return (
        // Overall form frame
        <View style={FormStyles.FormView}>

            {/* Email field */}
            <View style={FormStyles.FieldView}>
                {/* Input */}
                <View style={FormStyles.FieldInputView}>
                    <Image 
                        source={icon? icon[0] as ImageSourcePropType : undefined}
                        onError={() => {console.error("Error loading image:", error);}}

                        style={FormStyles.InputTextIcon}
                        contentFit="contain"
                    />
                    <Controller
                        control = { control }
                        rules = { {required: true,} }
                        render = { 
                            ({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                ref={emailRef}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}

                                placeholder="Correo de usuario"
                                keyboardType="email-address"
                                autoComplete="email"
                                autoCapitalize="none"
                                returnKeyType="next"
                                style={FormStyles.FieldInputText}
                                
                                autoFocus={true}
                                blurOnSubmit={false}
                                onSubmitEditing={() => {
                                    emailRef.current?.focus();
                                }}        
                            />
                        )}
                        name = "email"
                    />
                </View>

                {/* Errors */}
                {errors.email && 
                        <Text style={FormStyles.ErrorText}> 
                            {errors.email.message} 
                        </Text>
                    }
            </View>

            {/* Password field */}
            <View style={FormStyles.FieldView}>
                {/* Input */}
                <View style={FormStyles.FieldInputView}>
                    <Image 
                        source={icon? icon[1] as ImageSourcePropType : undefined}
                        onError={() => {
                            console.error("Error loading image:", error);}}

                        style={FormStyles.InputTextIcon}
                        contentFit="contain"
                    />
                    <Controller
                        control = { control }
                        rules = { {required: true,} }
                        render = { 
                            ({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                ref={passwordRef}
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
                                    passwordRef.current?.focus();
                                }}  
                            />
                        )}
                        name = "password"
                    />
                </View>

                {/* Errors */}
                {errors.password && 
                        <Text style={FormStyles.ErrorText}> 
                            {errors.password.message} 
                        </Text>}
            </View>

            {/* Login button */}
            <Pressable 
                style = {FormStyles.LoginButton}
                onPress = {handleSubmit(props.onSubmit)}  
            >
                <Text style={FormStyles.LoginButtonText}> Ingresar </Text>
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
        borderBottomColor: '#A6A6A6',
        // backgroundColor: "green"
    },
    InputTextIcon: {
        width: 25,
        height: 25,
        color: '#A6A6A6',
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
        color: "red",

        textAlign: "left",
    },
    LoginButton: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 4,
        elevation: 3,

        alignItems: 'center',
        justifyContent: 'center',
        
        backgroundColor: '#00C0F3',
    },
    LoginButtonText: {
        fontWeight: "bold",
        fontFamily: "sans-serif-light",
        fontStyle: "normal",
        color: "white",

        textAlign: "justify",
        borderBottomColor: '#A6A6A6',
    },
});