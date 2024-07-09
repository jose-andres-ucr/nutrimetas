// Core React hooks & misc. stuff
import { useEffect, useState, useContext } from "react";

// React Native UI
import FlashMessage from "react-native-flash-message";

// Expo UI
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// Fonts
import FontAwesome from '@expo/vector-icons/FontAwesome';

// Expo navigation
import { Redirect, Stack } from "expo-router";

// Color palettes
import { useColorScheme } from '@/components/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';

// Sign-in session context
import { SessionContext } from "@/shared/Session/LoginSessionProvider";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <FlashMessage position="top" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(patientTabs)" options={{ headerShown: false }} />
        <Stack.Screen name="addPatient" options={{ headerShown: false }} />
        <Stack.Screen name="assingGoal" options={{ headerShown: false }} />
        <Stack.Screen name="configGoal" options={{ headerShown: false }} />
        <Stack.Screen name="PatientList" options={{ headerShown: false }} />
        <Stack.Screen name="GoalList" options={{ headerShown: false }} />
        <Stack.Screen name="CheckboxPatients" options={{ headerShown: false }} />
        <Stack.Screen name="GoalDetail" options={{ headerShown: false }} />
        <Stack.Screen name="showComment" options={{ headerShown: false }} />
        <Stack.Screen name="DailyGoal" options={{ headerShown: false }} />
        <Stack.Screen name="transferPatient" options={{ headerShown: false }} />
        <Stack.Screen name="ProfessionalList" options={{ headerShown: false }} />
        <Stack.Screen name="EditGoal" options={{ headerShown: false }} />
        <Stack.Screen name="GoalDelete" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  // Prevent the splash screen from auto-hiding before asset loading is complete.
  SplashScreen.preventAutoHideAsync();

  // Keep track on whether or not a redirect is required based on
  // the previously known credentials
  const session = useContext(SessionContext);

  // Load required fonts
  const [loaded, error] = useFonts({
    SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Use Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Wait for assets and other misc. services to load
  if (!loaded) {
    return null;
  }

  // If the session isn't valid, or the role isn't that of a professional or
  // patient, redirect to the sign-in page
  // TODO: Maybe split grouped routes for patient and professionals
  if (!session || session.state !== "valid" || (
    session.userData.role !== "patient" && 
    session.userData.role !== "professional"
  )) {
    return <Redirect href="/(app)/(public)/sign-in" />;
  }

  // Otherwise, defer to the root layout.
  return (
    <RootLayoutNav />
  );
}