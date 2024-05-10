"use strict"

// Dependencies
// Core React hooks & misc. stuff
import { useState, useEffect, useContext, useRef } from "react";

// Core React Native UI
import { View, Text, StyleSheet, ImageSourcePropType } 
from "react-native";

// Expo UI
import { useAssets } from 'expo-asset'; 
import { Image } from "expo-image";

// Expo navigation
import { router } from "expo-router";

// Login form 
import LoginForm from "@/components/LoginForm";

// Icon pop-up
import IconPopup from "@/components/IconPopup";

// Firestore DB
import firestore from '@react-native-firebase/firestore';

// Session Context
import { SessionContext } from "@/app/_layout";

/// Credential verification
const checkAuth = function(email: string, password: string, 
    credentials : any)
{
    console.log("Checking credentials...");
    console.log("Pulled", credentials);
    console.log("Passed", email, password);

    return (
        credentials.email === email &&
        credentials.password === password
    );
}

// Possible login states 
type LoginStatus = {
    value : "pending" | "invalid" | "signed-in" | "signed-out",
    message?: string,
};

// Possible user states 
type UserRole = "professional" | "patient";

// Login form rendering and hooks
export default function LoginPage(
) {
    // Keep track of current login state...
    const [loginState, setLoginState] = 
        useState({value: "pending"} as LoginStatus);

    // and the data of whoever is logged on, if at all
    let authData = useRef({} as {[key: string]: any, role? : UserRole});

    // Access the shared context of said data
    const session = useContext(SessionContext);

    // Assume initial login state is to be signed out
    useEffect(() => {setLoginState({value: "signed-out"});}, []);

    // Login handling for...

    // Attempts
    const handleLoginAttempt = async function(
        data : {email: string, password: string}
    )
    {
        console.log("Attempting to log in..."); 
        // Keep track of... 

        // ... the current state of login
        setLoginState({value: "pending"});
        
        // ...and unexpected DB errors
        let unexpectedError = null;

        // Find the proper person associated with said credentials
        authData.current = {};

        // Be it a patient...
        await firestore()
            .collection("Patient")
            .where("email", "==", data.email)
            .limit(1)
            .get()
            .then(
                (QuerySnapshot) => {
                    if (QuerySnapshot.size > 0)
                    { 
                        authData.current = QuerySnapshot.docs[0].data(); 
                        authData.current.role = "patient";
                    }
                },
                (Error) => {
                    unexpectedError = Error;
                    console.error(
                        "Unexpected error while authenticating against \
                        patients",
                        Error
                    )
                }
            );

        // Or a professional
        authData.current ?? await firestore()
            .collection("Professionals")
            .where("email", "==", data.email)
            .limit(1)
            .get()
            .then(
                (QuerySnapshot) => {
                    if (QuerySnapshot.size > 0)
                    { 
                        authData.current = QuerySnapshot.docs[0].data(); 
                        authData.current.role = "professional";
                    }
                },
                (Error) => {
                    unexpectedError = Error;
                    console.error(
                        "Unexpected error while authenticating against \
                        professionals",
                        Error
                    )
                }
            );

        // If an associated person is found and its credentials are
        // sucesfully validated, accept the login and pass its credentials
        // along with the user control to the next screens
        if (
            unexpectedError == null && 
            authData.current != null && 
            checkAuth(data.email, data.password, authData.current)
        )
        {
            console.log("Login SUCCESFUL");
            setLoginState({value: "signed-in"});
        }
    
        // Otherwise, reject the login
        else {
            console.log("Login FAILED");

            let reason = (unexpectedError == null) ? 
                "Credenciales incorrectas" : 
                `Error inesperado: ${error?.name}. Inténtelo más tarde.`;

            setLoginState({value: "invalid", message: reason});
        }
    }

    /// Succesful attempts
    useEffect(() => {
        // If user is logged in, redirect it to the proper screen of interest
        if (loginState.value == "signed-in")
        { 
            console.log(`Handling succesful login as ${authData.current.role ?? "UNKNOWN ROLE"}...`);

            switch (authData.current.role)
            {
                case "patient": {
                    // TODO: Changed to proper patient route
                    router.push("/(tabs)/")
                    break;
                }

                case "professional": {
                    // TODO: Changed to proper professional route
                    router.push("/(tabs)/")
                    break;
                }

                // If role is unknown, report an error
                default: {
                    setLoginState({
                        value: "invalid", 
                        message: "Error inesperado: Rol desconocido. Inténtelo más tarde."});
                    break;
                }

            }
        }
    }, [loginState]);

    // Register the icon loading hook
    const [icon, error] = useAssets([
        require('@/assets/images/logo.png')
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
                    onSubmit={handleLoginAttempt}
                />
            </View>

            { /* Icon Popup */ }
            <IconPopup
                isActive={["invalid", "pending"].includes(loginState.value)}
                isPressable={loginState.value != "pending"}
                onCloseRequest={
                    () => {setLoginState({value:"signed-out"})}
                }
                onActionRequest={
                    () => {setLoginState({value:"signed-out"})}
                }

                icon={icon != undefined ? icon[0] as ImageSourcePropType : undefined}
                description={
                    {
                        content: (loginState.value == "pending") ? 
                            "Cargando..." : 
                            `No se logró iniciar sesión: ${loginState.message}`,
                        style : (loginState.value == "pending") ? 
                            LoginStyles.PopupLoadingText : 
                            LoginStyles.PopupErrorText,
                    }
                }
                actionText={
                    loginState.value == "pending" ? 
                    "Cargando..." : "Aceptar"
                }
            />
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
    PopupLoadingText: {
        fontWeight: "normal",
        fontFamily: "sans-serif-light",
        fontStyle: "normal",

        textAlign: "justify",
    },
    PopupErrorText: {
        fontWeight: "bold",
        fontFamily: "sans-serif-light",
        fontStyle: "italic",
        color: "red",

        textAlign: "left",
    },
});