// Dependencies
// User data types
import { UserData } from "@/shared/User/UserDataTypes";

// User credentials
export type UserLoginCredentials = {email: string, password : string};
export type UserAuthCredentials = {email: string | null, uid : string};

// Possible session states
type SessionBase = {
    state: string,
}

type ValidSession = {
    state: "valid",
    uid: string, // Account's Auth UID
    verified: boolean, // Whether the account is verified
    userData: UserData, // User's data
} & SessionBase;

type InvalidSession = {
    state: "invalid",
    error: Error,
} & SessionBase;

type PendingSession = {
    state: "pending",
} & SessionBase;

// User session on the app
export type LoginSession = ValidSession | InvalidSession | PendingSession;

// Actions that can be taken on a given session
type LoginActionBase = {
    type: string,
}
type CleanSession = {
    type: "clean",
} & LoginActionBase;

type SetSession = {
    type: "set",
    newSession: LoginSession,
} & LoginActionBase;

type InvalidateSession = {
    type: "invalidate",
    error: Error,
} & LoginActionBase;

export type LoginAction = CleanSession | SetSession | InvalidateSession;
