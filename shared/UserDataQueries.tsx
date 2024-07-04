// Dependencies
// Core React hooks & misc. stuff
import { useEffect } from "react";

// React Query hooks
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Firestore DB
import firestore, { FirebaseFirestoreTypes } 
    from '@react-native-firebase/firestore';

// Data collections
import Collections from "@/constants/Collections";

// User data types
import {AdminData, PatientData, ProfessionalData, UserData, UserRole} from "@/shared/LoginSession";

// Type alias for retrieved firestore docs after a query
type SnapshotDocQuery = FirebaseFirestoreTypes
    .QuerySnapshot<FirebaseFirestoreTypes.DocumentData>;

// Type aliases for errors during query
export type QueryErrorReason = "missing-user" | "unknown";

export class QueryError extends Error {
    public readonly reason: QueryErrorReason;

    constructor(message : string, reason: QueryErrorReason) {
        super(message);
        this.reason = reason;
        this.name = "ValidationError";
    }
};

// Type aliases for user data hooks
export type UserDataHook = (email: string) => {
    data: UserData | undefined; error: Error | null; isLoading: boolean; 
}

// Shorthand wrapper for unexpected errors
const handleUnexpectedError = (reason : any) => {
    throw new QueryError(
        "Ocurrió un error inesperado: " + reason, "unknown"
    );
}

// Fetch the data of any given administrator
export const useAdministratorData = (email: string) => {
    const queryKey = [email] as const;
    const queryClient = useQueryClient();

    const handleResults = (query : SnapshotDocQuery) => {
        if (query.docs.length === 1) {
            const doc = query.docs[0];
            const data : AdminData = {
                role: "admin",
                docId : doc.id,
                docContents : doc.data(),
            }
            return data;
        }

        throw new QueryError(
            "No se encontró al administrador asignado", "missing-user"
        );
    }

    const filter = () => firestore()
        .collection(Collections.Admin)
        .where("email", "==", email)
        .limit(1);

    const fetchData = () => filter()
        .get()
        .then(
            (res) => handleResults(res),
            (reason) => handleUnexpectedError(reason)
        );

    const { data, error, isLoading } = useQuery<AdminData>({
      queryKey,
      queryFn: () => fetchData(),
    });

    useEffect(() => {
        const unsubscribe = filter()
        .onSnapshot(
            (res) => {
                const updatedData = handleResults(res)
                queryClient.setQueryData(queryKey, updatedData);
            },
            (reason) => handleUnexpectedError(reason)
        );

        return () => { unsubscribe() };
    }, []);
  
    return { data, error, isLoading };
}

// Fetch the data of any given professional
export const useProfessionalData = (email: string) => {
    const queryKey = [email] as const;
    const queryClient = useQueryClient();

    const handleResults = (query : SnapshotDocQuery) => {
        if (query.docs.length === 1) {
            const doc = query.docs[0];
            const data : ProfessionalData = {
                role: "professional",
                docId : doc.id,
                docContents : doc.data(),
            }
            return data;
        }

        throw new QueryError(
            "No se encontró al profesional asignado", "missing-user"
        );
    }

    const filter = () => firestore()
        .collection(Collections.Professionals)
        .where("email", "==", email)
        .limit(1);

    const fetchData = () => filter()
        .get()
        .then(
            (res) => handleResults(res),
            (reason) => handleUnexpectedError(reason)
        );

    const { data, error, isLoading } = useQuery<ProfessionalData>({
      queryKey,
      queryFn: () => fetchData()
    });

    useEffect(() => {
      const unsubscribe = filter()
        .onSnapshot(
            (res) => {
                const updatedData = handleResults(res)
                queryClient.setQueryData(queryKey, updatedData);
            },
            (reason) => handleUnexpectedError(reason)
        );

        return () => { unsubscribe() };
    }, []);

    return { data, error, isLoading };
}

// Fetch the data of any given patient
export const usePatientData = (email: string) => {
    const queryKey = [email] as const;
    const queryClient = useQueryClient();

    const handleNestedResults = (patientCollection : SnapshotDocQuery, 
        profDocId : string) => {
        if (patientCollection.docs.length === 1) {
            const doc = patientCollection.docs[0];
            const data : PatientData = {
                role: "patient",
                assignedProfDocId: profDocId,
                docId : doc.id,
                docContents : doc.data(),
            }
            return data;
        }

        throw new QueryError(
            "No se encontró al paciente asignado", "missing-user"
        );
    }

    const handleResults = (profCollection : SnapshotDocQuery) => {
        const matchedPatients = profCollection.docs.map(
            (profDoc) => {
                const profDocId = profDoc.id;
                return profDoc.ref
                    .collection(Collections.Patient)
                    .where("email", "==", email)
                    .limit(1)
                    .get()
                    .then(
                        (assignedPatients) => handleNestedResults(
                            assignedPatients, profDocId),
                        (reason) => handleUnexpectedError(reason)
                    );
        });

        return Promise.any(matchedPatients);
    }

    const fetchData = () => firestore()
        .collection(Collections.Professionals)
        .get()
        .then(
            (profCollection) => handleResults(profCollection),
            (reason) => handleUnexpectedError(reason)
        );

    const { data, error, isLoading } = useQuery<PatientData>({
        queryKey,
        queryFn: () => fetchData()
    });

    useEffect(() => {
        const unsubscribe = firestore()
        .collection(Collections.Professionals)
        .onSnapshot(
            (profCollection) => {
                const updatedData = handleResults(profCollection)
                queryClient.setQueryData(queryKey, updatedData);
            },
            (reason) => handleUnexpectedError(reason)
        );

        return () => { unsubscribe() };
    }, []);

    return { data, error, isLoading };
}

// Shorthand for data fetching methods
export const useUserDataHooks : {
    [key in UserRole]: UserDataHook
} = {
    "admin" : useAdministratorData, 
    "professional" : useProfessionalData, 
    "patient" : usePatientData
};

// Fetch the data of any given user
export const useUserData = (email: string) => {

    const hookResults = Object.values(useUserDataHooks).map(
        (hook : UserDataHook) =>  {
            return hook(email);
    });

    const chosenResults = hookResults.find(
        result => result.error === null 
        && result.isLoading === false
        && result.data !== undefined
    ) || hookResults[0];

    return chosenResults;
}