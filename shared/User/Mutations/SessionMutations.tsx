// Dependencies
// Firebase Authentication
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Firestore DB
import firestore from '@react-native-firebase/firestore';
import Collections from '@/constants/Collections';

// User data types
import {LoginSession, UserAuthCredentials, UserLoginCredentials } from "@/shared/Session/LoginSessionTypes";

// React Query hooks
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Mutation query types
import { MutationError } from '@/shared/User/Mutations/MutationTypes';

// Validate account sign-in credentials
const tryExternalSignIn = (creds : UserLoginCredentials) => {
    return auth()
        .signInWithEmailAndPassword(creds.email, creds.password)
        .then(
            (Credentials : FirebaseAuthTypes.UserCredential) => {
                if (!Credentials.user.email) {
                    return Promise.reject(
                        new MutationError(
                            "Usuario no se le asoció el correo", 
                            "missing-user-email"
                        )
                    );
                }

                const externalCredentials : UserAuthCredentials = {
                    type: "server-provided",
                    uid:  Credentials.user.uid, 
                    email: Credentials.user.email
                }

                return Promise.resolve(externalCredentials);
            },
            (authError) => {
                if (authError.code === 'auth/invalid-credential') {
                    return Promise.reject(
                        new MutationError(
                            "Credenciales incorrectas", "invalid-credentials"
                        )
                    );
                }

                return Promise.reject(
                    new MutationError(
                        "Ocurrió un error inesperado: " + authError, "unknown"
                    )
                );
            }
        )
}

const trySignIn = (creds: UserLoginCredentials) => {
    console.log("Sign in requested for", creds);

    return firestore()
            .collection(Collections.Metadata)
            .doc(creds.email)
            .get()
            .then(
                (metadataDoc) => {
                    if (metadataDoc.exists) {
                        const metadata = metadataDoc.data();

                        if (!metadata) {
                            return Promise.reject(
                                new MutationError(
                                "User metadata empty", 
                                "missing-data"
                            ));
                        }

                        const forceExternalVerification = 
                            metadata.verified !== false;

                        console.log(
                            forceExternalVerification ? 
                            "Metadata shows user is verified" : 
                            "Metadata doesn't show user is verified"
                        );

                        if (!forceExternalVerification) {
                            if (!metadata.password) {
                                return Promise.reject(
                                    new MutationError(
                                    "User first-time password missing", 
                                    "missing-data"
                                ));
                            }

                            if (creds.password !== metadata.password) {
                                return Promise.reject(
                                    new MutationError(
                                    "User first-time password mismatch", 
                                    "invalid-credentials"
                                ));
                            }
                        }

                        return Promise.resolve(forceExternalVerification);
                    }

                    return Promise.reject(
                        new MutationError(
                        "User metadata not found", 
                        "missing-user"
                    ));
                },
                (error) => {
                    return Promise.reject(
                        new MutationError(
                        "User metadata not accesible: " + error, 
                        "unknown"
                    ));
                }
            ).then(
                (forceExternalVerification) : Promise<UserAuthCredentials> => {
                    if (forceExternalVerification) {
                        return tryExternalSignIn(creds);
                    }

                    const internalCredentials : UserAuthCredentials = {
                        type: "user-provided",
                        email: creds.email,
                        password: creds.password,
                    }

                    return Promise.resolve(internalCredentials);
                    
                },
                (error) => Promise.reject(error)
            );
}

export const signIn = () => {
    const queryClient = useQueryClient();
    const queryKey = ["user/query/credentials"] as const;

    return useMutation({
        mutationFn: trySignIn,
        onSuccess: (data) => {
            console.log("Sign in succesfull");
            queryClient.setQueryData(queryKey, data)
        },
        onError: (error, variables) => {
            console.log("Controlled error while attempting sign-in:", error);
            console.log("Credentials:", variables);

            return Promise.reject(error);
        }
    });
}

// De-validate account sign-in credentials
const tryExternalSignOut = () => {
    console.log("External sign out requested");

    return auth()
        .signOut()
        .then( 
            () => {
                console.log("External sign out succesfull");
            },
            (reason) => {
                return Promise.reject(reason)
            }
        );
}

const trySignOut = (session : LoginSession | null) => {
    console.log("Sign out requested");

    if (!session) {
        return Promise.reject(
            new MutationError(
                "La sesión no está activa",
                "invalid-session"
            )
        );
    }

    if (session.state !== "valid" && session.state !== "pending-verification") {
        console.log(
            "Attempting to close an invalid or pending session",
        );

        return Promise.resolve()
    }

    const creds = session.userCreds;

    if (creds.type === "server-provided") {
        return tryExternalSignOut();
    }

    // If not externally signed out, no extra checks are needed
    return Promise.resolve();
}

export const signOut = () => {
    const queryClient = useQueryClient();
    const queryKey = ["user/query/credentials"] as const;

    return useMutation({
        mutationFn: trySignOut,
        onSuccess: () => {
            console.log("Sign out succesful");
            queryClient.setQueryData(queryKey, null)
        },
        onError: (error) => {
            console.log("Controlled error while attempting sign-out:", error);
            return Promise.reject(new MutationError(
                "Error inesperado cerrando sesión: " + error, "unknown"
            ));
        }
    });
}

// Verify the account of a given user on the DB
const tryVerifyUser = (email : string) => {
    console.log("Account verification requested for", email);

    return firestore()
        .collection(Collections.Metadata)
        .doc(email)
        .update({
            verified: true,
            password: firestore.FieldValue.delete()
        })
        .then(
            () => {
                console.log("User metadata verification succesful");
            },
            (updatingError) => { 
                throw new MutationError(
                    "Ocurrió un error inesperado: " + updatingError, "unknown"
                );
            }
        );
}

// Create and sign-in into account for given credentials
const tryCreateAndSignIn = (creds : UserLoginCredentials) => {
    console.log("Account creation and sign in requested");

    return auth()
        .createUserWithEmailAndPassword(creds.email, creds.password)
        .then(
            (Creds) => {
                console.log("Account credentials creation succesful:", creds);
                const email = Creds.user.email;

                if (!email) {
                    return Promise.reject(
                        new MutationError(
                        "No se le asoció el correo al nuevo usuario", 
                        "missing-user-email"
                    ));
                }

                return tryVerifyUser(email);
            },
            (reason) => {
                return Promise.reject(reason)
            }
        );
}

export const createAndSignIn = () => {
    const queryClient = useQueryClient();
    const queryKey = ["user/query/credentials"] as const;

    return useMutation({
        mutationFn: tryCreateAndSignIn,
        onSuccess: (data) => {
            console.log("Account creation and sign in succesful");
            queryClient.setQueryData(queryKey, data)
        },
        onError: (error, variables) => {
            console.log(
                "Controlled error while attempting account creation with sign-in:", 
                error
            );
            console.log("Credentials:", variables);

            return Promise.reject(error);
        }
    });
}