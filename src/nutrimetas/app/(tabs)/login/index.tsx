"use strict"

// Dependencies
// Core React Native UI
import { View, Text, StyleSheet, ImageSourcePropType } from "react-native";

// Expo UI
import { useAssets } from 'expo-asset'; 
import { Image } from "expo-image";

// Login form 
import LoginForm from "@/components/LoginForm";

// Login form rendering and hooks
export default function LoginPage(
) {
    // Register the icon loading hook
    const [icon, error] = useAssets([
        require('../../../assets/images/logo.png')
    ]);

    // Render login form
    return (
        <View style={LoginStyles.OverallView}>
            { /* Form title */ }
            <Text style={LoginStyles.Title}> Iniciar Sesión </Text>

            { /* App logo */ }
            <View style={LoginStyles.LogoView}>
                <Image 
                    source={icon? icon[0] as ImageSourcePropType : undefined}
                    onError={() => {console.error("Error loading image:", error);}}
                    
                    contentFit="contain"
                    contentPosition="top center"
                    style={LoginStyles.LogoImage}
                />
            </View>

            { /* Login form */ }
            <View style={LoginStyles.FormView}>
                <LoginForm 
                    onSubmit={({email, password}) => 
                    console.log("Form data submitted:", email, password)}
                />
            </View>
        </View>
    )
}

// Login page styles
const LoginStyles = StyleSheet.create({
    OverallView: {
        flex: 1,
        padding: 20,
        gap: 5,

        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "white"
    },
    Title: {
        fontWeight: "bold",
        // TODO: Load font (expo-fonts) or replace it with a system font
        fontFamily: "inter",
        fontStyle: "normal",
        textAlign: "center",

        fontSize: 30,
        marginVertical: 4,

        alignSelf: "center",
        justifyContent: "center",
        textAlignVertical: "center",
    },
    LogoView: {
        width: 120,
        height: 40,

        alignSelf: "center",
        alignItems: "center",
        justifyContent: "center",
        /// backgroundColor: "yellow",
    },
    LogoImage: {
        position: "absolute", 
        top: 0,

        width:"100%", 
        height: "100%", 
    },
    FormView: {
        flex: 1,
        padding: 5,
        maxHeight: 225,
        minHeight: 225,
        width:"100%",

        alignSelf: "center",
        alignItems: "center",
        justifyContent: "center",
        /// backgroundColor: "yellow",
    },
});