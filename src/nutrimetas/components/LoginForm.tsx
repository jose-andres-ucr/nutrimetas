"use strict"

// Dependencies
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
                            placeholder="(Ingrese su correo aquí)"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
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
                            placeholder="(Ingrese su contraseña aquí)"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            secureTextEntry={true}
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