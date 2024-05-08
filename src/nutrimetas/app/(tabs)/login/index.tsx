"use strict"

// Dependencies
// Core React Native UI
import { View, Text, TextInput, Button } from "react-native";

// Login form 
import LoginForm from "@/components/LoginForm";

// Login form rendering and hooks
export default function LoginPage(
) {
    // Render login form
    return (
        // Overall form frame
        <View /* style={CommonStyles.columnView} */>
            <LoginForm 
                onSubmit={({email, password}) => 
                console.log("Form data submitted:", email, password)}
            />
        </View>
    )
}