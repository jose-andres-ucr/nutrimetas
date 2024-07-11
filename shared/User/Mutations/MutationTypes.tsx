// User query types
import { QueryErrorReason } from "@/shared/User/Queries/QueryTypes";

// Type aliases for errors during query
export type MutationErrorReason = QueryErrorReason | 
    "invalid-session" | "invalid-credentials" | "unknown";

export class MutationError extends Error {
    public readonly reason: MutationErrorReason;

    constructor(message : string, reason: MutationErrorReason) {
        super(message);
        this.reason = reason;
        this.name = "UserMutationError";
    }
};