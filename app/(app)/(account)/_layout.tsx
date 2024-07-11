import Nutrimetas from "@/components/NutrimetasHeader";
import useSignOutButton from "@/components/SignOutButton";
import { SessionContext } from "@/shared/Session/LoginSessionProvider";
import { Redirect, Stack } from "expo-router";
import { useContext } from "react";

export default function AppLayout() {
    const SignOutButton = useSignOutButton();

    // If session is already active and valid, redirect to the landing page
    // for the assigned role
    const session = useContext(SessionContext);
    if (!session) {
        return <Redirect href="/(app)/(public)/sign-in" />;
    }

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
    } else if (session.state === "invalid") {
        return <Redirect href="/(app)/(public)/sign-in" />;
    }

    // Otherwise, display the public routes
    return (
        <Stack initialRouteName="reset-password">
            <Stack.Screen
                name="reset-password"
                options={{
                    presentation: 'modal',
                    headerShown: true,
                    headerTitle: Nutrimetas,
                    headerRight: SignOutButton,
                    headerTitleAlign: 'center',
                }}
            />
        </Stack>
    );
}