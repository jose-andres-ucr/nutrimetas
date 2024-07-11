// Dependencies
// Core React hooks & misc. stuff
import React, { useContext, useEffect, useState } from "react";

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

// Login form 
import LoginForm from "@/components/LoginForm";

// Icon pop-up
import IconPopup from "@/components/IconPopup";

// Session Context
import { SessionContext } from "@/shared/Session/LoginSessionProvider";

// Sign in, sign out mutations
import { signIn, signOut } from "@/shared/User/Mutations/SessionMutations";

// User login credential datatype
import { UserLoginCredentials } from "@/shared/Session/LoginSessionTypes";

type SignInAttemptBase = {state: string};
type NilSignInAttempt = {state: "nil"} & SignInAttemptBase;
type PendingSignInAttempt = {state: "pending"} & SignInAttemptBase;
type InvalidSignInAttempt = {state: "invalid", error: Error} & SignInAttemptBase;
type SignInAttempt = NilSignInAttempt | PendingSignInAttempt | InvalidSignInAttempt;

// Login form rendering and hooks
export default function LoginPage() {
    // Keep track of the current user's session data
    const session = useContext(SessionContext);

    // and the entered credentials
    const [passedCreds, setPassedCreds] 
        = useState<UserLoginCredentials | null>(null);

    // Handle changes to the submitted credentials
    const signInMutation = signIn();
    const signOutMutation = signOut();
    
    // Keep track of the sign in attempt state so far
    const [signInAttempt, setSignInAttempt] 
        = useState<SignInAttempt>({state: "nil"});

    // Handle sign in attempts via change in passed credentials
    useEffect(() => {
        // If a session is already active...
        if (session) {
            // And it is pending...
            if (session.state === "pending") {
                // Keep the current attempt as pending
                setSignInAttempt( {state: "pending"} );
            }

            // And it is invalid...
            else if (session.state === "invalid") {
                // And the user is pushing new credentials...
                if (passedCreds) {
                    // Mark the attempt as invalid
                    setSignInAttempt({
                        state: "invalid", 
                        error : session.error
                    });
                }

                // And the user is not pushing new credentials...
                else {
                    // Try to sign out
                    signOutMutation.mutate(session, {
                            onError: (error) => setSignInAttempt(
                                {state: "invalid", error: error}
                            ),
                            onSuccess: () => setSignInAttempt({state: "nil"})
                        }
                    );
                }
            }

            // And it is valid...
            else {
                // And the user is pushing new credentials...
                if (passedCreds) {
                    // Try to sign in
                    signInMutation.mutate(
                            passedCreds, {
                            onError: (error) => setSignInAttempt(
                                {state: "invalid", error: error}
                            ),
                            onSuccess: () => setSignInAttempt({state: "pending"})
                        }
                    );
                }

                // And the user is not pushing new credentials...
                else {
                    // Try to sign out
                    signOutMutation.mutate(session, {
                            onError: (error) => setSignInAttempt(
                                {state: "invalid", error: error}
                            ),
                            onSuccess: () => setSignInAttempt({state: "nil"})
                        }
                    );
                }
            }
        }

        // If no session is already active...
        else {
            // And the user is pushing new credentials...
            if (passedCreds) {
                // Try to sign in
                signInMutation.mutate(
                    passedCreds, {
                        onError: (error) => setSignInAttempt(
                            {state: "invalid", error: error}
                        )
                    }
                );
            } 

            // And the user is not pushing new credentials...
            else {
                // Mark the attempt as nil
                setSignInAttempt( {state: "nil"} );
            }
        }
    }, [passedCreds, session]);

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
                    onSubmit={(creds) => {setPassedCreds(creds);}}
                />
            </View>

            { /* Icon Popup */}
            <IconPopup
                isActive={
                    signInAttempt.state === "invalid" || 
                    signInAttempt.state === "pending"
                }
                isPressable={
                    signInAttempt.state === "invalid" || 
                    signInAttempt.state === "pending"
                }
                onCloseRequest={() => {setPassedCreds(null);}}
                onActionRequest={() => {setPassedCreds(null);}}
                icon={AppBanner as ImageSourcePropType}
                description={
                    {
                        content: signInAttempt.state === "pending" ?
                            "Cargando..." :
                            signInAttempt.state === "invalid" ?
                            `No se logró iniciar sesión: ${signInAttempt.error.message}`: 
                            "...",
                        style: (signInAttempt.state === "pending") ?
                            LoginStyles.PopupLoadingText :
                            LoginStyles.PopupErrorText,
                    }
                }
                actionText={
                    (signInAttempt.state === "pending") ?
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