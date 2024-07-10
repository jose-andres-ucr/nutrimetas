// Dependencies
// Core React hooks & misc. stuff
import { ReactNode, createContext, useContext, useEffect } from "react";

// User session data types
import { LoginSession } from "@/shared/Session/LoginSessionTypes";

// User data queries
import { useUserCredentials, useUserData } from "@/shared/User/Queries/UserDataQueries";

// Context of the current user's session
export const SessionContext = createContext<LoginSession | null>(null);

// And its auth credentials
type AuthCredentialsState = ReturnType<typeof useUserCredentials>;
const AuthCredentialsContext = createContext<AuthCredentialsState>(
    {data: null, isLoading : false, error: null}
);

// Compute session based on given credentials
const useSession = (userCreds: AuthCredentialsState) : 
    LoginSession | null => {
    // Pull the verified account's user data
    const userData = useUserData(userCreds.data?.email ?? "");

    // No credentials: no session
    if (userCreds.data === null) {
        return null;
    }

    // Pending data / credentials: pending session
    if (userData.isLoading || userCreds.isLoading) {
        return {state: "pending"};
    }

    // Bad credentials: invalid session
    if (userCreds.error) {
        return {
            state: "invalid", 
            error: userCreds.error 
        };
    }

    const pulledCredentials = userCreds.data!;

    // Bad data: invalid session
    if (userData.error) {
        return {
            state: "invalid", 
            error: userData.error
        };
    }

    // All good: valid session
    return {
        state: "valid",
        verified: true,
        userCreds: pulledCredentials,
        userData: userData.data!,
    };
}

// Solve user session onto children given credentials
const SolvedSessionProvider = ({ children } : {children : ReactNode}) => {
    // Solve the session based on the auth credentials
    const authCreds = useContext(AuthCredentialsContext);
    const session = useSession(authCreds);

    useEffect(
        () => {
            if (session) {
                switch (session.state) {
                    case "invalid":
                        console.log("Invalid session detected:", session.error);
                        break;
                    case "pending":
                        console.log("Pending session detected");
                        break;
                    case "valid":
                        console.log("Valid session detected");
                        break;
                }
            } else {
                console.log("No session detected");
            }
        }, [session?.state]
    );

    // Inject it as a dependency onto children
    return (
        <SessionContext.Provider value={session}>
            {children}
        </SessionContext.Provider>       
    );
}

// Solve user credentials onto children
const SolvedCredentialsProvider = ({ children } : {children : ReactNode}) => {
    // Pull the auth credentials
    const authCreds = useUserCredentials();

    useEffect(
        () => {
            if (authCreds.isLoading) {
                console.log("Pending credentials detected");
            } else if (authCreds.error) {
                console.log("Invalid credentials detected:", authCreds.error);
            } else if (authCreds.data) {
                console.log("Valid credentials detected for:", authCreds.data);
            } else {
                console.log("No credentials detected");
            }
        }, [authCreds]
    );

    // Inject it as a dependency onto children
    return (
        <AuthCredentialsContext.Provider value={authCreds}>
            {children}     
        </AuthCredentialsContext.Provider>
    );
}

// Solve user session onto children
export default function LoginSessionProvider({ children } : {children : ReactNode})
{
    // Inject it as a dependency to the session solver
    return (
        <SolvedCredentialsProvider>
            <SolvedSessionProvider>
                {children}
            </SolvedSessionProvider>       
        </SolvedCredentialsProvider>
    );
}
