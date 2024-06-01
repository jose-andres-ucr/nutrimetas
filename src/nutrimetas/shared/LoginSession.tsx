// Dependencies
// Core React hooks & misc. stuff
import { ReactNode, Dispatch, createContext, useReducer } from "react";

// Keep track of the session of the user at any given time...
export const SessionContext = 
    createContext<LoginSession>(undefined);

// And the instructions on how to change it
export const SessionDispatchContext = 
    createContext<Dispatch<LoginAction>>(() => {console.log("AAA")});

// Understand the session data and constraints...
export type UserRole = "professional" | "patient";
export type LoginSession = {[key: string]: any, role? : UserRole} | undefined;

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
        if (currentSession != undefined && currentSession != null)
        {
            throw Error(
                "Can't set session: Active session already in progress (Try resetting first)"
            );
        }

        if (action.newSession == undefined && currentSession != null)
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
