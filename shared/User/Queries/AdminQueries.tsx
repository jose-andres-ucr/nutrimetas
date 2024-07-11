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
import { AdminData } from "@/shared/User/UserDataTypes";

// User query types
import { QueryError, SnapshotDocQuery } from "@/shared/User/Queries/QueryTypes";

// Shorthand wrapper for unexpected errors
const asUnexpectedError = (reason : any) => {
    throw new QueryError(
        "Ocurrió un error inesperado: " + reason, "unknown"
    );
}

// Fetch the data of a given administrator
export const fetchAdminData = (email: string) => {
    const queryKey = [email, "user/query/data/admin"] as const;

    // Search for document in admin collection...
    const fetchData = () => firestore()
        .collection(Collections.Admin)
        .where("email", "==", email)
        .limit(1)
        .get()
        .then(
            (query) => {
                // And build the datasheet
                if (query.docs.length === 1) {
                    const doc = query.docs[0];
                    const data : AdminData = {
                        role: "admin",
                        docId : doc.id,
                        docContents : doc.data(),
                    }

                    return Promise.resolve(data);
                }

                return Promise.reject(
                    new QueryError(
                        "No se encontró al administrador asignado", 
                        "missing-user"
                    )
                );
            },
            (reason) => asUnexpectedError(reason)
        );

    return useQuery<AdminData, QueryError>({
        queryKey,
        queryFn: fetchData,
    });
}

// Pull the up-to-date data of a given administrator
export const useAdminData = (email: string) => {
    const queryKey = [email, "user/query/data/admin"] as const;
    const queryClient = useQueryClient();

    // Build the datasheet based on the search results
    const handleResults = (query : SnapshotDocQuery) => {
        if (query.docs.length === 1) {
            const doc = query.docs[0];
            const data : AdminData = {
                role: "admin",
                docId : doc.id,
                docContents : doc.data(),
            }

            return Promise.resolve(data);
        }

        return Promise.reject(
            new QueryError(
                "No se encontró al administrador asignado", "missing-user"
            )
        );
    }

    // Search for the admin's document
    const filter = () => firestore()
        .collection(Collections.Admin)
        .where("email", "==", email)
        .limit(1);

    // Collect the admin's datasheet
    const fetchData = () => filter()
        .get()
        .then(
            (res) => handleResults(res),
            (reason) => asUnexpectedError(reason)
        );

    const { data, error, isLoading } = useQuery<AdminData, QueryError>({
      queryKey,
      queryFn: fetchData,
    });

    const [snapshotError, setSnapshotError] = useState<QueryError | null>(null);

    // Listen to changes on the document...
    useEffect(() => {
        const unsubscribe = filter()
        .onSnapshot(
            (adminData) => {
                // To rebuild the datasheet
                console.log("Pulling admin data (snapshot)");
                handleResults(adminData).then(
                    (adminData) => {
                        setSnapshotError(null);
                        queryClient.setQueryData(queryKey, adminData);
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
