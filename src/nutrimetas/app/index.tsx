// Dependencies
// Core React hooks & misc. stuff
import React, { useState, useEffect, useContext } from "react";

// Core React Native UI
import { StyleSheet, ImageSourcePropType } 
from "react-native";

// Expo UI
import { Image } from "expo-image";

// Image assets
import AppBanner from '@/assets/images/logo.png';

// Color palettes
import Colors from "@/constants/Colors";
import { View, Text } from "@/components/Themed";

// Expo navigation
import { router, useFocusEffect } from "expo-router";

// Login form 
import LoginForm from "@/components/LoginForm";

// Icon pop-up
import IconPopup from "@/components/IconPopup";

// Firestore DB
import firestore from '@react-native-firebase/firestore';

// Session Context
import {
    SessionContext, SessionDispatchContext,
    LoginSession
} from "@/shared/LoginSession";

/// Credential verification
const checkAuth = function (email: string, password: string, credentials: any) {
    console.log("Checking credentials...");
    console.log("Pulled", credentials);
    console.log("Passed", email, password);

    return (
        credentials.email === email &&
        credentials.password === password
    );
}

// Possible login states 
type LoginData = {
    state: "pending" | "invalid" | "signed-in" | "signed-out",
    errorMessage?: string,
    session?: LoginSession, 
};

// Login form rendering and hooks
export default function LoginPage(
) {
    // Keep track of current login state
    const [loginData, setLoginData] =
        useState({ state: "pending" } as LoginData);

    // Access the shared context of said data
    const session = useContext(SessionContext);
    const sessionDispatch = useContext(SessionDispatchContext);

    // Assume initial login state is to be signed out whenever the login
    // screen is opened
    useFocusEffect(
        React.useCallback(
            () => {
                console.log("Signing out on login page landing")

                // Clear up any session had in memory...
                sessionDispatch({
                    type: "reset",
                    newSession: undefined,
                });

                // And in this screen
                setLoginData({ state: "signed-out" });
            }, [])
    )

    // Login handling for...

    // Attempts
    const handleLoginAttempt = async function (
        data: { email: string, password: string }
    ) {
        console.log("Attempting to log in...");
        
        // Keep track of... 
        // ... the current state of login
        setLoginData({ state: "pending" });

        // ... the potential session to be acquired
        let potentialSession = null;

        // ...and unexpected DB errors
        let unexpectedError = null;

        // Find the proper person associated with said credentials
        // Be it a patient...
        await firestore()
            .collection("Patient")
            .where("email", "==", data.email)
            .limit(1)
            .get()
            .then(
                (QuerySnapshot) => {
                    if (QuerySnapshot.size > 0) {
                        potentialSession = {
                            docId : QuerySnapshot.docs[0].id, 
                            role: "patient",
                            ...QuerySnapshot.docs[0].data(),
                        };
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
        unexpectedError ?? await firestore()
            .collection("Professionals")
            .where("email", "==", data.email)
            .limit(1)
            .get()
            .then(
                (QuerySnapshot) => {
                    if (QuerySnapshot.size > 0) {
                        potentialSession = {
                            docId : QuerySnapshot.docs[0].id, 
                            role: "professional",
                            ...QuerySnapshot.docs[0].data(),
                        };
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
            unexpectedError === null &&
            potentialSession !== null &&
            checkAuth(data.email, data.password, potentialSession)
        ) {
            console.log("Login SUCCESFUL");
            setLoginData({ state: "signed-in", session: potentialSession });
        }

        // Otherwise, reject the login
        else {
            console.log("Login FAILED");

            let rejectionReason = (unexpectedError === null) ?
                "Credenciales incorrectas" :
                `Error inesperado: ${unexpectedError}. Inténtelo más tarde.`;

            setLoginData({ state: "invalid", errorMessage: rejectionReason });
        }
    }

    /// Succesful attempts
    useEffect(() => {
        // If user is logged in then...
        if (loginData.state === "signed-in") {
            const session = loginData.session;
            console.log(`Handling succesful login as ${session?.role ?? "UNKNOWN ROLE"}...`);

            // ... update the login session in memory
            sessionDispatch({
                type: "set",
                newSession: session,
            });

            // ... and redirect it to the proper screen of interest
            switch (session?.role) {
                case "patient": {
                    // TODO: Change to proper patient route
                    router.push({
                        pathname: '/GoalList', 
                        params: {
                            patientId: session.docId?? ""
                        },
                    });
                    break;
                }

                case "professional": {
                    // TODO: Change to proper professional route
                    router.push("/(tabs)/expedientes")
                    break;
                }

                // If role is unknown, report an error
                default: {
                    setLoginData({
                        state: "invalid",
                        errorMessage: "Error inesperado: Rol desconocido. Inténtelo más tarde."
                    });
                    break;
                }

            }
        }
    }, [loginData]);

    // Render login form
    return (
        <View style={LoginStyles.OverallView}>
            { /* Form title */}
            <Text 
                style={LoginStyles.Title}> 
                Iniciar Sesión 
            </Text>

            { /* App logo */}
            <View style={LoginStyles.LogoView}>
                <Image
                    source={AppBanner}
                    onError={(error) => {
                        console.error("Error loading image:", error);
                    }}

                    contentFit="contain"
                    contentPosition="top center"
                    style={LoginStyles.LogoImage}
                />
            </View>

            { /* Login form */}
            <View style={LoginStyles.FormView}>
                <LoginForm
                    onSubmit={handleLoginAttempt}
                />
            </View>

            { /* Icon Popup */}
            <IconPopup
                isActive={["invalid", "pending"].includes(loginData.state)}
                isPressable={loginData.state != "pending"}
                onCloseRequest={
                    () => { setLoginData({ state: "signed-out" }) }
                }
                onActionRequest={
                    () => { setLoginData({ state: "signed-out" }) }
                }

                icon={AppBanner as ImageSourcePropType}
                description={
                    {
                        content: (loginData.state === "pending") ?
                            "Cargando..." :
                            `No se logró iniciar sesión: ${loginData.errorMessage}`,
                        style: (loginData.state === "pending") ?
                            LoginStyles.PopupLoadingText :
                            LoginStyles.PopupErrorText,
                    }
                }
                actionText={
                    loginData.state === "pending" ?
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

        width: "100%",
        height: "100%",
    },
    FormView: {
        flex: 1,
        padding: 5,
        maxHeight: 225,
        minHeight: 225,
        width: "100%",

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
        color: Colors.red,

        textAlign: "left",
    },
});