// Dependencies
// User data types
import { UserData } from "@/shared/User/UserDataTypes";

// User credentials
export type UserLoginCredentials = {email: string, password : string};
export type UserAuthCredentials = {email: string, uid : string};

// Possible session states
type SessionBase = {
    state: string,
}

type ValidSession = { // (Good data and auth)
    state: "valid",
    verified: boolean, // Whether the account is verified
    userCreds: UserAuthCredentials, // Account's Auth UID
    userData: UserData, // User's data
} & SessionBase;

type InvalidSession = { // (Bad data or auth)
    state: "invalid",
    error: Error,
} & SessionBase;

type PendingSession = { // (Loading either data or auth)
    state: "pending",
} & SessionBase;

// User session on the app
export type LoginSession = ValidSession | InvalidSession | PendingSession;

// Actions that can be taken on a given session
type LoginActionBase = {
    type: string,
}
type CleanSession = { // Clean session
    type: "clean",
} & LoginActionBase;

type SetSession = { // Assign new session
    type: "set",
    newSession: LoginSession,
} & LoginActionBase;

type InvalidateSession = { // Mark session as invalid
    type: "invalidate",
    error: Error,
} & LoginActionBase;

export type LoginAction = CleanSession | SetSession | InvalidateSession;
