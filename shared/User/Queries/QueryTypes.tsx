// Firestore DB
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Type alias for retrieved firestore doc snapshots after a query
export type SnapshotDocQuery = FirebaseFirestoreTypes
    .QuerySnapshot<FirebaseFirestoreTypes.DocumentData>;

// Type alias for retrieved firestore doc snapshots (directly)
export type SnapshotDoc = FirebaseFirestoreTypes
    .DocumentSnapshot<FirebaseFirestoreTypes.DocumentData>;

// Type alias for retrieved docs
export type DocData = FirebaseFirestoreTypes.DocumentData;

// Type aliases for errors during query
export type QueryErrorReason = "missing-user" | "missing-user-email" | 
    "missing-data" | "invalid-credentials" | "unverified-account" | "unknown";

export class QueryError extends Error {
    public readonly reason: QueryErrorReason;

    constructor(message : string, reason: QueryErrorReason) {
        super(message);
        this.reason = reason;
        this.name = "UserQueryError";
    }
};
