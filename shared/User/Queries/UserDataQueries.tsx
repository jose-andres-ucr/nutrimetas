// Dependencies
// Core React hooks & misc. stuff
import { useEffect } from "react";

// React Query hooks
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Firebase auth
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// User data types
import {UserData, UserRole} from "@/shared/User/UserDataTypes";

// User query types
import { QueryError } from "@/shared/User/Queries/QueryTypes";

// User queries
import { fetchAdminData, useAdminData } 
    from "@/shared/User/Queries/AdminQueries";
import { fetchPatientData, usePatientData } 
    from "@/shared/User/Queries/PatientQueries";
import { fetchProfData, useProfData } 
    from "@/shared/User/Queries/ProfessionalQueries";

// User credential types
import { UserAuthCredentials, UserLoginCredentials } from "@/shared/Session/LoginSessionTypes";

// Type aliases for user data getters
type UserDataGetter = (email: string) => {
    data: UserData | undefined; error: QueryError | null; isLoading: boolean; 
}

// Shorthand for data fetching methods
export const userDataFetchers : {
    [key in UserRole]: UserDataGetter
} = {
    "admin" : fetchAdminData, 
    "professional" : fetchProfData, 
    "patient" : fetchPatientData
};

// Fetch the data of a given user
export const fetchUserData = (email : string) => {
    const fetchResults = Object.values(userDataFetchers).map(
        (fetcher : UserDataGetter) =>  {
            return fetcher(email);
    });

    return fetchResults.find(
        result => result.data !== undefined
        && result.isLoading === false
        && result.error === undefined
    ) || fetchResults.find(
        result => result.isLoading === true
        && result.error === undefined
    ) || fetchResults.find(
        result => result.error !== undefined
    ) || fetchResults[0];
}

// Attempt to fetch data of a given user, but raise if account isn't verified yet
export const tryFetchVerified = (email: string) => {
    const {data, error, isLoading} = fetchUserData(email);

    if (isLoading || error) {
        return {data, error, isLoading};
    }

    if (data!.role === "patient" && 
        data!.docContents.activated !== true) {
        return {
            data : undefined, 
            error : new QueryError(
                "La cuenta del paciente no ha sido verificada", 
                "unverified-account"
            ), 
            isLoading : false
        };
    }

    return {
        data : data!, 
        error : null, 
        isLoading : false
    }
}

// Shorthand for data pulling methods
export const userDataHooks : {
    [key in UserRole]: UserDataGetter
} = {
    "admin" : useAdminData, 
    "professional" : useProfData, 
    "patient" : usePatientData
};

// Pull the up-to-date data of a given user
export const useUserData = (email: string) => {
    const hookResults = Object.values(userDataHooks).map(
        (queryHook : UserDataGetter) =>  {
            return queryHook(email);
    });

    return hookResults.find(
        result => result.isLoading
    ) ?? hookResults.find(
        result => result.error === null
    ) ?? hookResults[0];
}

// Attempt to pull the up-to-date data of a given user, but raise if account
// isn't verified yet
export const tryUseVerified = (email: string) => {
    const {data, error, isLoading} = useUserData(email);

    if (isLoading || error) {
        return {data, error, isLoading};
    }

    if (data!.role === "patient" && 
        data!.docContents.activated !== true) {
        return {
            data : undefined, 
            error : new QueryError(
                "La cuenta del paciente no ha sido verificada", 
                "unverified-account"
            ), 
            isLoading : false
        };
    }

    return {
        data : data!, 
        error : null, 
        isLoading : false
    }
}

// Pull the up-to-date authentication credentials a given / the current user
export const useUserCredentials = (creds?: UserLoginCredentials) => {
    const queryKey = ["user/query/credentials"] as const;
    const queryClient = useQueryClient();

    const { data, error, isLoading } = 
    useQuery<UserAuthCredentials | null, QueryError>({
        queryKey,
        queryFn: () => {
            if (!creds) {
                return null;
            }

            return auth()
                .signInWithEmailAndPassword(creds.email, creds.password)
                .then(
                    (Credentials : FirebaseAuthTypes.UserCredential) => {
                        console.log("Sign in triggered via credentials")
                        return {
                            uid:  Credentials.user.uid, 
                            email: Credentials.user.email
                        };
                    },
                    (authError) => {
                        if (authError.code === 'auth/invalid-credential') {
                            throw new QueryError(
                                "Credenciales incorrectas", "invalid-credentials"
                            );
                        }
                        
                        throw new QueryError(
                            "Ocurrió un error inesperado: " + authError, "unknown"
                        );
                    }
                );
            }
        }
    );

    useEffect(() => {
        const unsubscribe = auth()
            .onAuthStateChanged(
                (user) => {
                    console.log("Updating Firebase Auth credentials");

                    const updatedCreds = (user) ? {
                        uid:  user.uid, 
                        email: user.email
                    } : null;

                    queryClient.setQueryData(queryKey, updatedCreds);
                }
            );

        return () => { unsubscribe(); };
    }, []);

    return { data, error, isLoading };
}
