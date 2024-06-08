// Dependencies
// Core React hooks & misc. stuff
import React, { useState, useEffect, useContext, useRef } from "react";

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
import { router } from "expo-router";

// Login form 
import LoginForm from "@/components/LoginForm";

// Icon pop-up
import IconPopup from "@/components/IconPopup";

// User authentication and data retrieval
import { authUser, fetchUserData, useAuthUser } from "@/components/FetchData";

// Session Context, User Data
import {
    LoginSession, SessionContext, SessionDispatchContext,
    UserData
} from "@/shared/LoginSession";

// Possible login states 
type LoginAttempt = {
    state: "pending" | "invalid" | "signed-in" | "signed-out",
    errorMessage?: string,
    session?: LoginSession, 
};

// Possible sign-in errors 
type SignInError = {message : string, isExpected: boolean};

// Login form rendering and hooks
export default function LoginPage(
) {
    // Keep track of current login state...
    const [loginAttempt, setLoginAttempt] =
        useState({ state: "pending" } as LoginAttempt);

    // ... The shared context of the user's session data
    const session = useContext(SessionContext);
    const sessionDispatch = useContext(SessionDispatchContext);

    // ... And the cached user credentials
    const user = useAuthUser();

    // Trigger...

    // Failed sign-in state
    const triggerFailedSignIn = function (error : SignInError) {
        console.log("Sign-in FAILED");

        setLoginAttempt({ 
            state: "invalid", 
            errorMessage: error.isExpected ? 
                error.message : 
                "Error inesperado: " + error.message 
                + " Inténtelo más tarde." 
        });
    }

    // Succesfull sign-in state
    const triggerSuccesfulSignIn = function (
        userData : UserData, userId : string
    ) {
        const userSession : LoginSession = {
            uid: userId!,
            role: userData.role,
            docId: userData.docId,
            ...userData.docContents,
        };

        setLoginAttempt({
            state: "signed-in", 
            session: userSession
        });
    }

    // Handle...

    // ... Sign-in attempts by the user
    const handleLoginAttempt = function (
        data: { email: string, password: string }
    ) {
        // Mark the login state as pending and begin working on it
        console.log("Attempting to sign in...");
        setLoginAttempt({ state: "pending" });

        // Authenticate the user
        const authenticated = authUser(data.email, data.password);

        // Pull their data sheet
        const dataRetrieved = fetchUserData(data.email);

        // Build user session
        Promise.allSettled([authenticated, dataRetrieved])
            .then(
                (res) => {
                    const [dataCollected, userAuthentication] = [res[1], res[0]];

                    // Handle user retrieval errors
                    if (dataCollected.status === "rejected") {
                        console.log('User data retrieval FAILED');
                        const dbError = dataCollected.reason;

                        // All DB errors are handled the same
                        triggerFailedSignIn({
                            message: dbError.message,
                            isExpected: false,
                        });
                    }
                    // Handle authentication errors 
                    else if (userAuthentication.status === "rejected") {
                        console.log('User authentication FAILED');
                        const authError = userAuthentication.reason;

                        // Whether the user provided invalid credentials
                        if (authError.code === 'auth/invalid-credential') {
                            console.log('Credentials are invalid!');

                            triggerFailedSignIn({
                                message: "Credenciales incorrectas.",
                                isExpected: true,
                            });
                        }
                        else if (authError.code === 'auth/invalid-email') {
                            console.log('Email address is invalid!');

                            triggerFailedSignIn({
                                message: "Dirección de correo incorrecta.",
                                isExpected: true,
                            });
                        }
                        else if (authError.code === 'auth/invalid-password') {
                            console.log('Password is invalid!');

                            triggerFailedSignIn({
                                message: "Contraseña incorrecta.",
                                isExpected: true,
                            });
                        }

                        // Or any other unexpected errors ocurred
                        else {
                            console.log("Unexpected error while authenticating "
                            + "sign-in via Firebase", authError);

                            triggerFailedSignIn({
                                message: `No se logró autenticar al usuario: ${authError.code}.`,
                                isExpected: false,
                            });
                        }
                    }
                    else {
                        console.log("User data retrieval and authentication SUCCESSFUL")
                        const [data, uid] = [dataCollected.value, userAuthentication.value];

                        console.log('UID', uid);
                        console.log('Data retrieved', data);

                        triggerSuccesfulSignIn(data, uid);
                    }
                }
            )
        // Ignore any other unhandled error
            .catch(() => {});
    }

    // ... Pre-existing cached user credentials
    useEffect(() => {
        // If user is null, sign-out
        if (user === null) {
            console.log("User has no previous firebase credentials");
            setLoginAttempt({state: "signed-out"});
        }

        // If the user isn't null, sign-in after attempting to retrieve their
        // data sheet
        else if (loginAttempt.state !== "signed-in") {
            console.log("Detected previous firebase credentials for", user.uid);

            // Check that the user has an email associated to their account
            const userEmailChecked = new Promise<string>(
                (resolve, reject) => {
                    if (user.email === null) {
                        reject(Error("Usuario no tiene correo asociado."));
                    } else {
                        resolve(user.email);
                    }
                }
            );

            // If they do and retrieval is succesful, sign-in
            userEmailChecked
                .then(
                    (Email) => {
                        console.log("User has associated email set as", Email);
                        return fetchUserData(Email);
                    }
                )
                .then(
                    (UserData) => {
                        triggerSuccesfulSignIn(UserData, user.uid)
                    },
                    (dbError) => triggerFailedSignIn({
                        message: dbError.message,
                        isExpected: false,
                    })
                )
            // Otherwise, make way for a sign-out
                .catch((dbError) => triggerFailedSignIn({
                    message: dbError.message,
                    isExpected: false,
                })
            );
        }
    }, [user]);

    // ... Succesful authentication
    useEffect(
        () => {
            // If a new user is logged in then...
            if (loginAttempt.state === "signed-in") {
                // ... Extract their session data
                const obtainedSession : LoginSession = loginAttempt.session!;

                console.log(
                    `Handling succesful login as ${obtainedSession.uid}`,
                    `with role as ${obtainedSession.role}.`
                );
                    
                // ... And trigger a session update only if the session
                // doesn't already match the one assigned
                if (obtainedSession.uid !== session?.uid) {
                    console.log("Updating session")
                    sessionDispatch({
                        type: "set",
                        newSession: obtainedSession,
                    });
                }
                

                // ... and redirect it to the proper screen of interest
                switch (obtainedSession.role) {
                    case "patient": {
                        // TODO: Change to proper patient route
                        router.push({
                            pathname: '/(app)/(root)/GoalList', 
                            params: {
                                patientId: obtainedSession.docId
                            }
                        });
                        break;
                    }

                    case "professional": {
                        // TODO: Change to proper professional route
                        router.push("/(app)/(root)/(tabs)/expedientes")
                        break;
                    }

                    // If role is unknown, report an error
                    default: {
                        console.error("Unknown page for role. Can't redirect. " 
                        + "Signing-out");

                        setLoginAttempt({
                            state: "invalid",
                            errorMessage: "Error inesperado: Rol desconocido. "
                            + "Inténtelo más tarde."
                        });

                        break;
                    }
                }
            }
    }, [loginAttempt]);

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
                isActive={["invalid", "pending"].includes(loginAttempt.state)}
                isPressable={loginAttempt.state != "pending"}
                onCloseRequest={
                    () => { setLoginAttempt({ state: "signed-out" }) }
                }
                onActionRequest={
                    () => { setLoginAttempt({ state: "signed-out" }) }
                }

                icon={AppBanner as ImageSourcePropType}
                description={
                    {
                        content: (loginAttempt.state === "pending") ?
                            "Cargando..." :
                            `No se logró iniciar sesión: ${loginAttempt.errorMessage}`,
                        style: (loginAttempt.state === "pending") ?
                            LoginStyles.PopupLoadingText :
                            LoginStyles.PopupErrorText,
                    }
                }
                actionText={
                    loginAttempt.state === "pending" ?
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