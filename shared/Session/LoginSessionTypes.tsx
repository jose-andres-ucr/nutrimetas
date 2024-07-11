// Dependencies
// User data types
import { UserData, UserMetadata } from "@/shared/User/UserDataTypes";

// User login credentials
export type UserLoginCredentials = {email: string, password : string};

// User authentication credentials
type UserAuthCredentialsBase = {
    email: string,
    type: "user-provided" | "server-provided",
}

// Used credentials for unauthenticated user
type UserProvidedAuthCredentials = UserAuthCredentialsBase & {
    type: "user-provided",
    password: string,
}

// Used credentials for authenticated user
type ServerProvidedAuthCredentials = UserAuthCredentialsBase & {
    type: "server-provided",
    uid: string,
}

export type UserAuthCredentials = UserProvidedAuthCredentials | 
    ServerProvidedAuthCredentials;

// User session on the app
type SessionBase = {
    state: string,
}

type ValidSession = { // (Good data and auth)
    state: "valid",
    userData: UserData, // User's data
    userMetadata: UserMetadata, // User's metadata
    userCreds: UserAuthCredentials, // User's account auth credentials
} & SessionBase;

type InvalidSession = { // (Bad data or auth)
    state: "invalid",
    error: Error,
} & SessionBase;

type PendingSession = { // (Loading either data or auth)
    state: "pending",
} & SessionBase;

type PendingVerificationSession = { // (User is pending verification)
    state: "pending-verification",
    userMetadata: UserMetadata,
    userCreds: UserAuthCredentials, // User's account auth credentials
} & SessionBase;

export type LoginSession = ValidSession | InvalidSession | 
    PendingSession | PendingVerificationSession;

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
