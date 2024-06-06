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
import { router } from "expo-router";

// Login form 
import LoginForm from "@/components/LoginForm";

// Icon pop-up
import IconPopup from "@/components/IconPopup";

// Firestore DB
import firestore from '@react-native-firebase/firestore';

// Firestore Authentication
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Session Context, User Data
import {
    LoginSession, SessionDispatchContext,
    UserData
} from "@/shared/LoginSession";

// Possible login states 
type LoginAttempt = {
    state: "pending" | "invalid" | "signed-in" | "signed-out",
    errorMessage?: string,
    session?: LoginSession, 
};

// Sign-in errors 
type SignInError = {message : string, isExpected: boolean};

// Login form rendering and hooks
export default function LoginPage(
) {
    // Keep track of current login state
    const [loginAttempt, setLoginAttempt] =
        useState({ state: "pending" } as LoginAttempt);

    // Access the shared context of the user's session
    const sessionDispatch = useContext(SessionDispatchContext);

    // Subscribe to Firebase authentication state
    useEffect(() => {
        const authSuscriber = auth().onAuthStateChanged(onAuthStateChanged);
        return authSuscriber;
    }, []);

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

    // ... Retrieval of user data
    const handleRetrievalAttempt = function (email: string) : UserData {
        // Both DB errors arising from the access promise and unexpected
        //  ones arising from asignment are dealt with the same
        const handleDbError = (dbError : Error) => { throw(dbError) };

        // Find the data as a patient...
        firestore()
            .collection("Patient")
            .where("email", "==", email)
            .limit(1)
            .get()
            .then(
                (QuerySnapshot) => {
                    if (QuerySnapshot.size > 0) {
                        console.log("User data retrieval SUCCESFUL");

                        return ({
                            docId : QuerySnapshot.docs[0].id, 
                            role: "patient",
                            docContents: QuerySnapshot.docs[0].data(),
                        }) as UserData;
                    }
                },
                handleDbError
            )
            .catch(handleDbError);

        // Or a professional
        firestore()
            .collection("Professionals")
            .where("email", "==", email)
            .limit(1)
            .get()
            .then(
                (QuerySnapshot) => {
                    if (QuerySnapshot.size > 0) {
                        console.log("User data retrieval SUCCESFUL");

                        return ({
                            docId : QuerySnapshot.docs[0].id, 
                            role: "professional",
                            docContents: QuerySnapshot.docs[0].data(),
                        }) as UserData;
                    }
                },
                handleDbError
            )
            .catch(handleDbError);

        // If no data could be found for the user, mark it down as an 
        // error
        throw(Error("No se encontraron los datos del usuario."));
    }
    
    // ... Sign-in attempts by the user
    const handleLoginAttempt = function (
        data: { email: string, password: string }
    ) {
        // Mark the login state as pending and begin working on it
        console.log("Attempting to sign in...");
        setLoginAttempt({ state: "pending" });

        // Authenticate via Firebase Auth
        auth()
            .signInWithEmailAndPassword(data.email, data.password)
            .then(
                (Credentials : FirebaseAuthTypes.UserCredential) => {
                    console.log('Authentication SUCCESFUL');          
                    
                    const userId : string = Credentials.user.uid;
                    console.log('UID', userId);

                    return userId;
                }, 
                (authError) => {
                    console.log('Authentication FAILED');

                    if (authError.code === 'auth/invalid-email') {
                        console.error('Email address is invalid!');

                        triggerFailedSignIn({
                            message: "Dirección de correo incorrecta.",
                            isExpected: true,
                        });
                    }
                    else if (authError.code === 'auth/invalid-password') {
                        console.error('Password is invalid!');

                        triggerFailedSignIn({
                            message: "Contraseña incorrecta.",
                            isExpected: true,
                        });
                    }
                    else {
                        console.error("Unexpected error while authenticating "
                        + "sign-in via Firebase", authError);

                        triggerFailedSignIn({
                            message: `No se logró autenticar al usuario: ${authError}.`,
                            isExpected: false,
                        });
                    }

                    throw(authError);
                }
            )
        // Pull user's data sheet
            .then(
                (userId : string) => {
                    const userData : UserData 
                        = handleRetrievalAttempt(data.email);
                    return {userId, userData};
                }
            )
        // Build user session
            .then(
                ({userData, userId}) =>
                    triggerSuccesfulSignIn(userData, userId),
                (dbError) => triggerFailedSignIn({
                    message: dbError.message,
                    isExpected: false,
                })
            )
        // Ignore any other unhandled rejection
            .catch(() => {});
    }

    // ... Pre-existing authentication
    const onAuthStateChanged = function (
        User : FirebaseAuthTypes.User | null
    ) {
        // If user is null, sign-out
        if (User === null) {
            setLoginAttempt({state: "signed-out"});
        }

        // If the user isn't nulll, sign-in after attempting to retrieve their
        // data sheet
        else {
            const userDataRetrieved = new Promise<UserData>(
                (resolve, reject) => {
                    if (User.email === null) {
                        reject(Error("Usuario no tiene correo asociado."));
                    } else {
                        resolve(handleRetrievalAttempt(User.email));
                    }
                }
            );

            userDataRetrieved.then(
                (UserData) => triggerSuccesfulSignIn(UserData, User.uid),
                (dbError) => triggerFailedSignIn({
                    message: dbError.message,
                    isExpected: false,
                })
            ).catch((dbError) => triggerFailedSignIn({
                message: dbError.message,
                isExpected: false,
            }));
        }
    };

    // ... Succesful authentication
    useEffect(() => {
        // If user is logged in then...
        if (loginAttempt.state === "signed-in") {
            // ... Extract their session data
            const session = loginAttempt.session!;

            console.log(
                `Handling succesful login as ${session.uid}.`,
                `With role as ${session.role}.`,
            );

            // ... update the login session in memory
            sessionDispatch({
                type: "set",
                newSession: session,
            });

            // ... and redirect it to the proper screen of interest
            switch (session.role) {
                case "patient": {
                    // TODO: Change to proper patient route
                    router.push({
                        pathname: '/GoalList', 
                        params: {
                            sessionDocId: session.docId
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