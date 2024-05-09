"use strict"

// Dependencies
// Core React hooks & misc. stuff
import { useState, useEffect } from "react";

// Core React Native UI
import { View, Text, StyleSheet, ImageSourcePropType } from "react-native";

// Expo UI
import { useAssets } from 'expo-asset'; 
import { Image } from "expo-image";

// Login form 
import LoginForm from "@/components/LoginForm";

// Firestore DB
import firestore from '@react-native-firebase/firestore';

/// Credential verification
const checkAuth = function(email: string, password: string, 
    credentials : any)
{
    if (credentials.email == email &&
        credentials.password == password)
    {console.log("Credential valid");}
    else
    {console.log("Credential invalid");}

    return (
        credentials.email === email &&
        credentials.password === password
    );
}

// Possible login states 
type LoginStatus = "pending" | "invalid" | "signed-in" | "signed-out";

// Login form rendering and hooks
export default function LoginPage(
) {
    // Keep track of current login state
    const [loginState, setLoginState] = useState("pending" as LoginStatus);

    // Assume initial login state is to be signed out
    useEffect(() => {setLoginState("signed-out");}, []);

    // Login handling
    const handleLogin = async function(
        data : {email: string, password: string}
    )
    {
        // Keep track of... 

        // ... the current state of login
        setLoginState("pending");
        
        // ...and unexpected DB errors
        let unexpectedError = null;

        // Find the proper person associated with said credentials
        let person = null;

        // Be it a patient...
        await firestore()
            .collection("Patient")
            .where("email", "==", data.email)
            .limit(1)
            .get()
            .then(
                (QuerySnapshot) => {
                    if (QuerySnapshot.size > 0)
                    { person = QuerySnapshot.docs[0].data(); }
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
        person ?? await firestore()
            .collection("Professionals")
            .where("email", "==", data.email)
            .limit(1)
            .get()
            .then(
                (QuerySnapshot) => {
                    if (QuerySnapshot.size > 0)
                    { person = QuerySnapshot.docs[0].data(); }
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
            person != null && 
            checkAuth(data.email, data.password, person)
        )
        {
            console.log("Succesful login!");
            setLoginState("signed-in");
        }
    
        // Otherwise, reject the login
        else {
            console.log("Failed login :(");
            setLoginState("invalid");
        }
    }

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
                    onSubmit={handleLogin}
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