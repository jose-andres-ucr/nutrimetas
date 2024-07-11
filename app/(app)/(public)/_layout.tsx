import { SessionContext } from "@/shared/Session/LoginSessionProvider";
import { signOut } from "@/shared/User/Mutations/SessionMutations";
import { Redirect, router, Stack } from "expo-router";
import { useContext } from "react";

export default function AppLayout() {
    const signOutMutation = signOut();

    // If session is already active and valid, redirect to the landing page
    // for the assigned role
    const session = useContext(SessionContext);
    if (session) {
        if (session.state === "valid") {
            console.log("Redirecting to landing page for role", 
                session.userData.role);
            
            switch (session.userData.role) {
                case "admin":
                    return <Redirect href="/(app)/(admin)/(tabs)/professionals" />;
                case "professional":
                    return <Redirect href="/(app)/(root)/(tabs)/expedientes" />;
                case "patient":
                    return <Redirect href="/(app)/(root)/(patientTabs)/goalsPatient" />;
                default:
                    break;
            }
        } else if (session.state === "pending-verification") {
            if (session.userCreds.type === "server-provided") {
                signOutMutation.mutate(session);
                return <Redirect href="/(app)/(public)/sign-in" />;
            }

            return <Redirect href="/(app)/(account)/reset-password" />;
        }
    }

    // Otherwise, display the public routes
    return (
        <Stack initialRouteName="sign-in">
            <Stack.Screen
                name="sign-in"
                options={{
                    presentation: 'modal',
                    headerShown: false,
                }}
            />
        </Stack>
    );
}