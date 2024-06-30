// Dependencies
// Core React hooks & misc. stuff
import { ReactNode, Dispatch, createContext, useReducer } from "react";

// Keep track of the session of the user at any given time...
export const SessionContext = 
    createContext<LoginSession>(undefined);

// And the instructions on how to change it
export const SessionDispatchContext = 
    createContext<Dispatch<LoginAction>>(() => {console.log("AAA")});

// User roles on the app
export type UserRole = "professional" | "patient" | "admin";

// User data on the DB
export type UserData = {
    role: UserRole,
    docId: string,
    docContents: any,
}

// User session on the app
export type LoginSession = {
    // TODO: Opt for DB schema instead of wildcard key-value type annotations
    [key: string]: any, 
    uid: string, // Account's Auth UID
    docId : string, // Datasheet's DB ID
    role: UserRole, // Role on the app
} | undefined;

// ... the actions that can be taken on a given session...
export type LoginAction = {
    type : "set" | "reset",
    newSession: LoginSession,
}

// ... and how said actions update the session
function sessionReducer(
    currentSession: LoginSession | undefined, action : LoginAction
) {
    switch (action.type) {
        // Set or replace session if none are active already   
        case 'set': {
            if (action.newSession === undefined || action.newSession === null)
            {
                throw Error(
                    "Can't set session: New session is nil (Try resetting instead)"
                );
            }

            console.log("Setting new session data as", action.newSession);
            return action.newSession;
        }

        // Reset session
        case 'reset': {
            console.log("Resetting sesion with previous data as", currentSession);
            return undefined;
        }

        // Cannot act upon unknown action type
        default: {
            throw Error('Unknown action on session: ' + action.type);
        }
    }
}

// Inject session context and dispatcher as dependencies
export function LoginSessionProvider({ children } : {children : ReactNode})
{
    // Start with an empty session and known operations on it
    const [session, dispatchSession] = useReducer(sessionReducer, undefined);

    // Inject these dependencies onto children
    return (
        <SessionContext.Provider value={session}>
            <SessionDispatchContext.Provider value={dispatchSession}>
                {children}
            </SessionDispatchContext.Provider>
        </SessionContext.Provider>       
    )
}
