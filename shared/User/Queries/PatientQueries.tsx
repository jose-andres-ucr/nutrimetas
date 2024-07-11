// Dependencies
// Core React hooks & misc. stuff
import { useEffect, useState } from "react";

// React Query hooks
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Firestore DB
import firestore from '@react-native-firebase/firestore';

// Data collections
import Collections from "@/constants/Collections";

// User data types
import { PatientData } from "@/shared/User/UserDataTypes";

// User query types
import { QueryError, SnapshotDocQuery } from "@/shared/User/Queries/QueryTypes";

// Shorthand wrapper for unexpected errors
const asUnexpectedError = (reason : any) => {
    throw new QueryError(
        "Ocurrió un error inesperado: " + reason, "unknown"
    );
}

// Fetch the data of a given patient
export const fetchPatientData = (email : string) => {
    const queryKey = [email, "user/query/data/patient"] as const;

    // Build the datasheet based on the search results
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

            return Promise.resolve(data);
        }

        return Promise.reject(
            new QueryError(
                "No se encontró al paciente asignado", "missing-user"
        ));
    }

    // Collect the patient datasheet for a given professional's
    // patients, if there's a match
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
                        (reason) => asUnexpectedError(reason)
                    );
        });

        return Promise.any(matchedPatients);
    }

    // Collect the patient's datasheet
    const fetchData = () => firestore()
        .collection(Collections.Professionals)
        .get()
        .then(
            (profCollection) => handleResults(profCollection),
            (reason) => asUnexpectedError(reason)
        );

    return useQuery<PatientData, QueryError>({
        queryKey,
        queryFn: fetchData
    });
}

// Pull the up-to-date data of a given patient
export const usePatientData = (email: string) => {
    const queryKey = ["user/query/data/patient", email] as const;
    const queryClient = useQueryClient();

    // Build the datasheet based on the search results
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

            return Promise.resolve(data);
        }

        return Promise.reject(
            new QueryError(
                "No se encontró al paciente asignado", "missing-user"
        ));
    }

    // Collect the patient datasheet for a given professional's
    // patients, if there's a match
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
                        (reason) => asUnexpectedError(reason)
                    );
        });

        return Promise.any(matchedPatients);
    }

    // Collect the patient's datasheet
    const fetchData = () => firestore()
        .collection(Collections.Professionals)
        .get()
        .then(
            (profCollection) => handleResults(profCollection),
            (reason) => asUnexpectedError(reason)
        );

    const { data, error, isLoading } = useQuery<PatientData, QueryError>({
        queryKey,
        queryFn: fetchData
    });

    const [snapshotError, setSnapshotError] = useState<QueryError | null>(null);

    // Listen to changes on the document...
    useEffect(() => {
        const unsubscribe = firestore()
            .collection(Collections.Professionals)
            .onSnapshot(
                // To rebuild the datasheet
                (profCollection) => {
                    console.log("Pulling patient data (snapshot)");
                    handleResults(profCollection).then(
                        (patientData) => {
                            setSnapshotError(null);
                            queryClient.setQueryData(queryKey, patientData);
                        },
                        (reason) => {
                            setSnapshotError(
                                new QueryError(
                                    "Ocurrió un error inesperado: " + reason, 
                                    "unknown"
                            ));
                        }
                    );
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
