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
import { QueryError, SnapshotDocData } from "@/shared/User/Queries/QueryTypes";

// Shorthand wrapper for unexpected errors
const asUnexpectedError = (reason : any) => {
    throw new QueryError(
        "Ocurrió un error inesperado: " + reason, "unknown"
    );
}

// Fetch the data of a given administrator
export const fetchAdminData = (email: string) => {
    const queryKey = [email, "user/query/data/admin"] as const;

    const fetchData = () => firestore()
        .collection(Collections.Admin)
        .where("email", "==", email)
        .limit(1)
        .get()
        .then(
            (query) => {
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

    const handleResults = (query : SnapshotDocData) => {
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

    const filter = () => firestore()
        .collection(Collections.Admin)
        .where("email", "==", email)
        .limit(1);

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

    useEffect(() => {
        const unsubscribe = filter()
        .onSnapshot(
            (adminData) => {
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

    if (snapshotError) {
        return {
            data : undefined, 
            error: snapshotError, 
            isLoading : false 
        };
    }
  
    return { data, error, isLoading };
}
