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
import {AdminData, ProfessionalData} from "@/shared/LoginSession";

// Type alias for retrieved firestore docs after a query
type SnapshotDocData = FirebaseFirestoreTypes
    .QueryDocumentSnapshot<FirebaseFirestoreTypes.DocumentData>;

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
            (res) => handleResults(res),
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
            (res) => handleResults(res),
            (reason) => handleUnexpectedError(reason)
        );

        return () => { unsubscribe() };
    }, []);

    return { data, error, isLoading };
}