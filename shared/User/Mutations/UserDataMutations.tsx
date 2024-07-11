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
import { UserMetadata } from "@/shared/User/UserDataTypes";

// User query types
import { MutationError } from "@/shared/User/Mutations/MutationTypes";

// Shorthand wrapper for unexpected errors
const asUnexpectedError = (reason : any) => {
    throw new MutationError(
        "Ocurrió un error inesperado: " + reason, "unknown"
    );
}

const tryUpdateMetadata = (email : string, data: UserMetadata) => {
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
                
            },
            (updatingError) => { 
                throw new MutationError(
                    "Ocurrió un error inesperado: " + updatingError, "unknown"
                );
            }
        );
}