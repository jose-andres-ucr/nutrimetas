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

// Firestore DB
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Firestore Authentication
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Session Context, User Data
import {
    LoginSession, SessionContext, SessionDispatchContext,
    UserData,
    UserRole
} from "@/shared/LoginSession";

// User DB document collections
import Collections from "@/constants/Collections";

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
    const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

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

    // ... Loss or gain of cached Firebase Auth credentials
    useEffect(() => {
        const authUnsuscriber = auth()
            .onAuthStateChanged(
                (obtainedUser : FirebaseAuthTypes.User | null) => {
                    if (obtainedUser === null || 
                        obtainedUser.uid !== user?.uid) {
                        setUser(obtainedUser);
                    }
                }
            );
        return authUnsuscriber;
    }, []);

    // ... Retrieval of user data via Firebase Firestore
    const handleRetrievalAttempt = function (email: string) : Promise<UserData> {
        // Both DB errors arising from the access promise and unexpected
        // ones arising from asignment are dealt with the same
        const handleDbError = (dbError : Error) => { throw(dbError) };

        type CollectedDocs = FirebaseFirestoreTypes
            .QuerySnapshot<FirebaseFirestoreTypes.DocumentData>;

        // DB errors arising from missing user data are dealt with slightly
        // differently
        const handleDocQuery = (queryResult : CollectedDocs, collectionRole : UserRole) => {
            if (queryResult.docs.length === 1) {
                const doc = queryResult.docs[0];

                // Construct the user data according to which collection
                // the user's data sheet belongs to
                const collectedData : UserData = {
                    docId : doc.id,
                    docContents : doc.data(), 
                    role : collectionRole,
                }

                return collectedData ;
            }

            throw (Error("db/missing-user"));
        };

        // Find the data as a patient...
        const patientDataFound = firestore()
            .collection("Patient")
            .where("email", "==", email)
            .limit(1)
            .get()
            .then((res) => handleDocQuery(res, "patient"), handleDbError);
        
        // Or a professional
        const professionalDataFound = firestore()
            .collection("Professionals")
            .where("email", "==", email)
            .limit(1)
            .get()
            .then((res) => handleDocQuery(res, "professional"), handleDbError);

        // Pick the data that fits, or report that none was found is that was
        // the case
        return Promise.any([patientDataFound, professionalDataFound])
            .then(
                (userData : UserData) => {    
                    return userData;
                },
                (aggregateError : AggregateError) => {
                    // Check if any errors stem from being unable to find a user
                    const [patientError, professionalError] : Error[] 
                        = aggregateError.errors;

                    if (patientError.message === "db/missing-user" 
                        && professionalError.message == "db/missing-user") {
                        return Promise
                            .reject("No se encontraron los datos del usuario")
                    }

                    // Otherwise, propagate the error
                    return Promise.reject(aggregateError);
                }
            )
            .catch(handleDbError);
    }
    
    // ... User authentication via Firebase Auth
    const handleAuthAttempt = function (email: string, password : string) 
    : Promise<string>{
        return auth()
            .signInWithEmailAndPassword(email, password)
            .then(
                (Credentials : FirebaseAuthTypes.UserCredential) => {
                    return Promise.resolve(Credentials.user.uid);
                }, 
                (authError) => {;
                    return Promise.reject(authError);
                }
            );
    }

    // ... User account activation
    const handleAccountActivation = ( userDocId: string, userRole : UserRole) => {
        const collection : string | undefined = (userRole === "patient" ? 
            Collections.Patient : (userRole === "professional" ?
                Collections.Professionals : undefined)
        );

        if (collection === undefined) {
            return Promise.reject(
                Error("No existe colección asociada al rol de" + userRole)
            );
        }

        console.log("Borrando de ", userDocId, " con el rol ", userRole)

        return firestore()
            .collection(collection)
            .doc(userDocId)
            .update({
                password: firestore.FieldValue.delete(),
                activated: true
            })
            .then(
                () => Promise.resolve(),
                (error) => Promise.reject(error)
            );
    }

    // ... Sign-in attempts by the user
    const handleLoginAttempt = function (
        data: { email: string, password: string }
    ) {
        // Mark the login state as pending and begin working on it
        console.log("Attempting to sign in...");
        setLoginAttempt({ state: "pending" });

        // Authenticate the user
        const authenticated = handleAuthAttempt(data.email, data.password);

        // Pull their data sheet
        const dataRetrieved = handleRetrievalAttempt(data.email);

        // Build user session
         Promise.allSettled([authenticated, dataRetrieved])
            .then(
                (results) => {
                    const [authentication, dataPulled] = results;

                    // If the user has data associated with them
                    if (dataPulled.status == "fulfilled") {
                        console.log("User data collection SUCCESFUL");
                        const userData = dataPulled.value;
                        const accountActivated = userData.docContents.activated;

                        // And signed in to their associated account, 
                        // sign them in
                        if (authentication.status == "fulfilled") {
                            console.log("Account authentication SUCCESFUL");
                            const userId = authentication.value;

                            // Make sure to register their account if it isn't
                            // already registered
                            // TODO: Handle error gracefully
                            if (accountActivated === false) {
                                console.log("Activating account...")
                                handleAccountActivation(userData.docId, userData.role)
                                    .then(
                                        () => console.log(
                                            "User activation updated")
                                        ,
                                        () => console.warn(
                                            "Unable to update user activation"
                                        )
                                    )
                            }
                            
                            triggerSuccesfulSignIn(userData, userId);
                        }

                        // Otherwise, if there's no associated account, create
                        // one for them
                        else if (!accountActivated) {
                            console.log("Creating account...");

                            if (data.password === userData.docContents.password) {
                                console.log("Passwords match");
                                auth()
                                    .createUserWithEmailAndPassword(data.email, 
                                        data.password)
                                    .then(
                                        (userCreds) => {
                                        console.log("Auth credentials created succesfully");

                                        handleAccountActivation(userData.docId, 
                                            userData.role)
                                            .then(
                                                () => {
                                                    console.log("DB updated succesfully");

                                                    const userId = 
                                                        userCreds.user.uid;
                                                    triggerSuccesfulSignIn(userData,
                                                        userId);
                                                },
                                                (activationError) => {
                                                    triggerFailedSignIn({
                                                        message: activationError
                                                            .message,
                                                        isExpected: false,
                                                    });
                                                }
                                            )
                                        },
                                        (error) => {
                                            triggerFailedSignIn({
                                                message: error.message,
                                                isExpected: false,
                                            });
                                        }
                                    );
                            } else {
                                triggerFailedSignIn({
                                    message: "Credenciales incorrectas.",
                                    isExpected: true,
                                });
                            }
                        }

                        // Otherwise, if there is an associated account yet
                        // the sign in failed, reject the attempt
                        else {
                            const authError = authentication.reason;

                            // Check for invalid credentials
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

                            // Or other unexpected errors
                            else {
                                console.log("Unexpected error while authenticating "
                                + "sign-in via Firebase", authError);

                                triggerFailedSignIn({
                                    message: `No se logró autenticar al usuario: ${authError.code}.`,
                                    isExpected: false,
                                });
                            }
                        }
                    } else {
                        console.log("User data collection FAILED");
                        let dbError : string = dataPulled.reason;

                        if (dbError === "No se encontraron los datos del usuario") {
                            triggerFailedSignIn({
                                message: "Credenciales incorrectas",
                                isExpected: true,
                            });
                        } else {
                            triggerFailedSignIn({
                                message: dbError,
                                isExpected: false,
                            });
                        }
                    }
                }, 
            )
        // Ignore any other unhandled error
            .catch(() => {});
    }

    // ... Pre-existing firebase credentials
    useEffect(() => {
        // If user is null, sign-out
        if (user === null) {
            console.log("User has no previous firebase credentials");
            setLoginAttempt({state: "signed-out"});
        }

        // If the user isn't null, sign-in after attempting to retrieve their
        // data sheet
        else {
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
                        return handleRetrievalAttempt(Email);
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