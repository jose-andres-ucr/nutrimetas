// Dependencies
import "@react-native-firebase/firestore"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useColorScheme } from '@/components/useColorScheme';
import FlashMessage from "react-native-flash-message";
// Expo Navigation
import { Slot } from 'expo-router';

// Login session and its dispatching context 
import { LoginSessionProvider } from '@/shared/LoginSession';

export default function RootLayout() {
  // Inject login session state and handling 
  return (
    <LoginSessionProvider>
      <Slot />
    </LoginSessionProvider>
  );
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <FlashMessage position="top" />
      <QueryClientProvider client={queryClient}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="addPatient" options={{ headerShown: false }} />
          <Stack.Screen name="assingGoal" options={{ headerShown: false }} />
          <Stack.Screen name="configGoal" options={{ headerShown: false }} />
          <Stack.Screen name="PatientList" options={{ headerShown: false }} />
          <Stack.Screen name="GoalList" options={{ headerShown: false }} />
          <Stack.Screen name="CheckboxPatients" options={{ headerShown: false }} />
          <Stack.Screen name="GoalDetail" options={{ headerShown: false }} />
          <Stack.Screen name="showComment" options={{ headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
