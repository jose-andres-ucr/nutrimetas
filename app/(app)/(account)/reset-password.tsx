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

// Icon pop-up
import IconPopup from "@/components/IconPopup";

// Notification
import { scheduleNotification } from "@/shared/Notifications/notification";

// Session Context
import { SessionContext } from "@/shared/Session/LoginSessionProvider";

// Sign in, sign out mutations
import { createAndSignIn, signOut } from "@/shared/User/Mutations/SessionMutations";

// User login credential datatype
import ResetPasswordForm from "@/components/ResetPasswordForm";


type SignInAttemptBase = {state: string};
type NilSignInAttempt = {state: "nil"} & SignInAttemptBase;
type PendingSignInAttempt = {state: "pending"} & SignInAttemptBase;
type InvalidSignInAttempt = {state: "invalid", error: Error} & SignInAttemptBase;
type SignInAttempt = NilSignInAttempt | PendingSignInAttempt | InvalidSignInAttempt;

// Login form rendering and hooks
export default function ResetPassAndLoginPage() {
    // Keep track of the current user's session data
    const session = useContext(SessionContext);

    // and the entered credentials
    const [newPassword, setNewPassword] 
        = useState<string | null>(null);

    // Handle changes to the submitted credentials
    const signInMutation = createAndSignIn();
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
                if (newPassword) {
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

            // And it is pending verification, while being issued by them...
            else if (session.state === "pending-verification" &&
                session.userCreds.type === "user-provided"
            ) {
                // And the user is pushing new credentials...
                if (newPassword) {
                    // Try to sign in
                    signInMutation.mutate({
                            email: session.userCreds.email, 
                            password: newPassword
                        }, {
                            onError: (error) => setSignInAttempt(
                                {state: "invalid", error: error}
                            ),
                            onSuccess: () => {
                                    scheduleNotification(
                                        "Contraseña cambiada con éxito!",
                                        "Intente ingresar sesión de nuevo",
                                        new Date()
                                    );
                                    setSignInAttempt({state: "pending"})
                            }
                        }
                    );
                }

                // And the user is not pushing new credentials...
                else {
                    // Mark the attempt as nil
                    setSignInAttempt({state: "nil"})
                }
            }

            // And it is valid, or pending yet issued by the server...
            else {
                // Keep the current attempt as pending
                setSignInAttempt( {state: "pending"} );
            }
        }

        // If no session is already active...
        else {
            // Mark the current attempt as pending
            setSignInAttempt( {state: "pending"} );
        }
    }, [newPassword, session]);

    // Render login form
    return (
        <View style={LoginStyles.OverallView}>
            { /* Form title */}
            <Text 
                style={LoginStyles.Title}> 
                Cambie su contraseña 
            </Text>

            { /* Reset password form */}
            <View style={LoginStyles.FormView}>
                <ResetPasswordForm
                    onSubmit={({password_a}) => {setNewPassword(password_a);}}
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
                onCloseRequest={() => {setNewPassword(null);}}
                onActionRequest={() => {setNewPassword(null);}}
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
        gap: 50,

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