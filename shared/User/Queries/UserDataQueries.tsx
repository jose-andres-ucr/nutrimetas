// Dependencies
// Core React hooks & misc. stuff
import { useEffect, useState } from "react";

// React Query hooks
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Firebase auth
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Firestore DB
import firestore from '@react-native-firebase/firestore';

// User data types
import {UserData, UserMetadata, UserRole} from "@/shared/User/UserDataTypes";

// User query types
import { DocData as Doc, QueryError, SnapshotDoc, SnapshotDocQuery } from "@/shared/User/Queries/QueryTypes";

// User queries
import { fetchAdminData, useAdminData } 
    from "@/shared/User/Queries/AdminQueries";
import { fetchPatientData, usePatientData } 
    from "@/shared/User/Queries/PatientQueries";
import { fetchProfData, useProfData } 
    from "@/shared/User/Queries/ProfessionalQueries";

// User credential types
import { UserAuthCredentials, UserLoginCredentials } from "@/shared/Session/LoginSessionTypes";
import Collections from "@/constants/Collections";

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

// Shorthand for data pulling methods
export const userDataHooks : {
    [key in UserRole]: UserDataGetter
} = {
    "admin" : useAdminData, 
    "professional" : useProfData, 
    "patient" : usePatientData
};

// Pull the up-to-date data of a given user
export const useUserData = (email?: string) => {
    const hookResults = Object.values(userDataHooks).map(
        (queryHook : UserDataGetter) =>  {
            return queryHook(email ?? "");
    });

    if (!email) {
        return {
            data: undefined,
            error: null,
            isLoading: false,
        }
    }

    return hookResults.find(
        result => result.isLoading
    ) ?? hookResults.find(
        result => result.error === null
    ) ?? hookResults[0];
}

// Pull the up-to-date authentication credentials a given / the current user
export const useUserCredentials = (creds?: UserLoginCredentials) => {
    const queryKey = ["user/query/credentials"] as const;
    const queryClient = useQueryClient();

    const { data, error, isLoading } = 
    useQuery<UserAuthCredentials | null, QueryError>({
        queryKey,
        queryFn: () => {
            if (!creds) { return null; }

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
                                new QueryError(
                                "User metadata empty", 
                                "missing-data"
                            ));
                        }

                        const forceExternalVerification = !metadata.verified ||
                            metadata.verified !== false;

                        console.log(
                            forceExternalVerification ? 
                            "Metadata shows user is verified" : 
                            "Metadata doesn't show user is verified"
                        );

                        return Promise.resolve(forceExternalVerification);
                    }

                    return Promise.reject(
                        new QueryError(
                        "User metadata not found", 
                        "missing-user"
                    ));
                },
                (error) => {
                    return Promise.reject(
                        new QueryError(
                        "User metadata not accesible: " + error, 
                        "unknown"
                    ));
                }
            ).then(
                (forceExternalVerification) => {
                    if (forceExternalVerification) {
                        const externalUser = auth().currentUser;

                        if (!externalUser) {
                            return null
                        }

                        const email = externalUser.email;
                        const uid = externalUser.uid;

                        if (!email) {
                            return Promise.reject(
                                new QueryError(
                                "El usuario no tiene correo asociado", 
                                "missing-user-email"
                            ));
                        }

                        const externalCredentials : UserAuthCredentials = {
                            type: "server-provided",
                            email: email,
                            uid: uid,
                        }

                        return Promise.resolve(externalCredentials);
                    }

                    const internalCredentials : UserAuthCredentials = {
                        type: "user-provided",
                        email: creds.email,
                        password: creds.password
                    }

                    return Promise.resolve(internalCredentials);
                    
                },
                (error) => Promise.reject(error)
            )
        }
    });

    useEffect(() => {
        const unsubscribe = auth()
            .onAuthStateChanged(
                (user) => {
                    console.log("Updating Firebase Auth credentials");

                    if (!user) {
                        queryClient.setQueryData(queryKey, null);
                    } else if (!user.email) {
                        console.error(new QueryError(
                            "Restored firestore user has no associated email",
                            "missing-user-email"
                        ));
                    } else {
                        const updatedCreds : UserAuthCredentials = {
                            type: "server-provided",
                            uid:  user.uid, 
                            email: user.email
                        };
    
                        queryClient.setQueryData(queryKey, updatedCreds);
                    }
                }
            );

        return () => { unsubscribe(); };
    }, [creds]);

    return { data, error, isLoading };
}

// Pull the up-to-date metadata of a given / the current user
export const useUserMetadata = (email?: string) => {
    const queryKey = [email, "user/query/metadata"] as const;
    const queryClient = useQueryClient();

    // Build the datasheet based on the search results
    const handleResults = (doc : Doc) => {
        const docData = doc.data();
        if (docData) {
            const role = docData.role as UserRole;
            const verified = docData.verified as boolean;

            const knownMetadata : UserMetadata =  verified ? {
                verified: true,
                role: role
            } : {
                verified: false,
                role: role,
                password: docData.password as string
            }

            return Promise.resolve(knownMetadata);
        }

        return Promise.reject(
            new QueryError(
                "No hay metadatos accesibles", "missing-data"
            )
        );
    }

    // Search for the user's metadata document based on their email
    const { data, error, isLoading } = useQuery<UserMetadata, QueryError>({
      queryKey,
      queryFn: () => {
        return firestore()
            .collection(Collections.Metadata)
            .doc(email)
            .get()
            .then(
                (metadataDoc) => {
                    if (metadataDoc.exists) {
                        return handleResults(metadataDoc);
                    }

                    return Promise.reject(
                        new QueryError(
                        "No se encontró al documento de metadatos", 
                        "missing-user"
                    ));
                },
                (error) => handleResults(error)
            );
      },
    });

    const [snapshotError, setSnapshotError] = useState<QueryError | null>(null);

    // Listen to changes on the document...
    useEffect(() => {
        const unsubscribe = firestore()
        .collection(Collections.Metadata)
        .doc(email)
        .onSnapshot(
            (metadataDoc) => {
                console.log("Pulling metadata (snapshot)");

                // To rebuild the datasheet
                if (metadataDoc.exists) {
                    handleResults(metadataDoc).then(
                        (metadata) => {
                            setSnapshotError(null);
                            queryClient.setQueryData(queryKey, metadata);
                        },
                        (reason) => {
                            setSnapshotError(
                                new QueryError(
                                    "Ocurrió un error inesperado: " + reason, 
                                    "unknown"
                            ));
                        }
                    );
                }

                setSnapshotError(
                    new QueryError(
                        "No se encontró al documento de metadatos", 
                        "missing-user"
                ));
            },
            (reason) => {
                setSnapshotError(
                    new QueryError(
                        "Ocurrió un error inesperado: " + reason, "unknown"
                ));
            }
        );

        return () => { unsubscribe() };
    }, [email]);

    // Invalidate datasheet if error is encountered on updates
    if (snapshotError) {
        return {
            data : undefined, 
            error: snapshotError, 
            isLoading : false 
        };
    }

    return { data, error, isLoading };
}
