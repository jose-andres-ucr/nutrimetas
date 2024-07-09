// Dependencies
// Firebase Authentication
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// User data types
import {UserLoginCredentials } from "@/shared/Session/LoginSessionTypes";

// React Query hooks
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Mutation query types
import { MutationError } from '@/shared/User/Mutations/MutationTypes';

// Validate account sign-in credentials
const trySignIn = (creds: UserLoginCredentials) => {
    console.log("Sign in requested for", creds);

    return auth()
        .signInWithEmailAndPassword(creds.email, creds.password)
        .then(
            (Credentials : FirebaseAuthTypes.UserCredential) => {
                return {
                    uid:  Credentials.user.uid, 
                    email: Credentials.user.email
                }
            },
            (authError) => {
                if (authError.code === 'auth/invalid-credential') {
                    throw new MutationError(
                        "Credenciales incorrectas", "invalid-credentials"
                    );
                }
                
                throw new MutationError(
                    "Ocurrió un error inesperado: " + authError, "unknown"
                );
            }
        );
}

export const signIn = () => {
    const queryClient = useQueryClient();
    const queryKey = ["user/query/credentials"] as const;

    return useMutation({
        mutationFn: trySignIn,
        // Notice the second argument is the variables object that the `mutate` function receives
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
const trySignOut = () => {
    console.log("Sign out requested");

    return auth()
        .signOut()
        .then( 
            () => {
                console.log("Sign out succesfull");
            },
            (reason) => {
                return Promise.reject(reason)
            }
        );
}

export const signOut = () => {
    const queryClient = useQueryClient();
    const queryKey = ["user/query/credentials"] as const;

    return useMutation({
        mutationFn: trySignOut,
        // Notice the second argument is the variables object that the `mutate` function receives
        onSuccess: () => {
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