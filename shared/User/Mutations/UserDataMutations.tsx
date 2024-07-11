// Dependencies
// React Query hooks
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Firestore DB
import firestore from '@react-native-firebase/firestore';

// Data collections
import Collections from "@/constants/Collections";

// User data types
import { UserMetadata } from "@/shared/User/UserDataTypes";

// User query types
import { MutationError } from "@/shared/User/Mutations/MutationTypes";

// Verify the account of a given user on the DB
const tryUpdateMetadata = (params : {email : string, data: UserMetadata}) => {
    const {email, data} = params;
    console.log("Metadata update requested for", email);

    const updatedFields = data.verified ? {
        role : data.role
    } : {
        verified: true,
        assignedPasswordHash: firestore.FieldValue.delete()
    };

    return firestore()
        .collection(Collections.Metadata)
        .doc(email)
        .update(updatedFields)
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

export const updateMetadata = () => {
    const queryClient = useQueryClient();
    const queryKey = ["user/query/metadata"] as const;

    return useMutation({
        mutationFn: tryUpdateMetadata,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKey,
                exact: true,
            });
        },
        onError: (error : Error) => {
            console.log("Controlled error while verifying user:", error);
            return Promise.reject(new MutationError(
                "Error inesperado verificando cuenta: " + error, "unknown"
            ));
        }
    });
}