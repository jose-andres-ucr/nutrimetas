// Firestore DB
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Type alias for retrieved firestore docs after a query
export type SnapshotDocData = FirebaseFirestoreTypes
    .QuerySnapshot<FirebaseFirestoreTypes.DocumentData>;

// Type aliases for errors during query
export type QueryErrorReason = "missing-user" | "invalid-credentials" | 
    "unverified-account" | "unknown";

export class QueryError extends Error {
    public readonly reason: QueryErrorReason;

    constructor(message : string, reason: QueryErrorReason) {
        super(message);
        this.reason = reason;
        this.name = "UserQueryError";
    }
};