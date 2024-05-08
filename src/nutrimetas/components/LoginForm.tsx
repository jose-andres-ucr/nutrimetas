"use strict"

// Dependencies
// React Hooks & References
import { useRef } from "react";

// Core React Native UI
import { View, Text, TextInput, Button } from "react-native";

// Form structure and hooks
import { useForm, SubmitHandler, Controller } from "react-hook-form";

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

    // Render login form
    return (
        // Overall form frame
        <View /* style={CommonStyles.columnView} */>

            {/* Email field */}
            <View /* style={CommonStyles.rowView} */>
                <Text> Correo de usuario: </Text>
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

                            /* style={styles.inputField} */
                            placeholder="(Ingrese su correo de aquí)"
                            keyboardType="email-address"
                            autoComplete="email"
                            autoCapitalize="none"
                            returnKeyType="next"
                            
                            autoFocus={true}
                            blurOnSubmit={false}
                            onSubmitEditing={() => {
                                emailRef.current?.focus();
                            }}        
                        />
                    )}
                    name = "email"
                />
                {errors.email && 
                    <Text> {errors.email.message} </Text>}
            </View>

            {/* Password field */}
            <View /* style={CommonStyles.rowView} */>
                <Text> Contraseña: </Text>
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
                            
                            /* style={styles.inputField} */
                            placeholder="(Ingrese su contraseña aquí)"
                            autoComplete="current-password"
                            autoCapitalize="none"
                            returnKeyType="next"

                            secureTextEntry={true}
                            blurOnSubmit={false}
                            onSubmitEditing={() => {
                                passwordRef.current?.focus();
                            }}  
                        />
                    )}
                    name = "password"
                />
                {errors.password && 
                    <Text> {errors.password.message} </Text>}
            </View>

            {/* Login button */}
            <Button 
                title = "Iniciar sesión" 
                onPress = {handleSubmit(props.onSubmit)} 
            />

        </View>
    )
}