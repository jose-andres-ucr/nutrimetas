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

// Login session and its dispatching context 
import { LoginSessionProvider } from '@/shared/LoginSession';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '/index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // Inject login session state and handling 
  return (
    <LoginSessionProvider>
      <RootLayoutNav />
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
          <Stack.Screen name="GoalDetail" options={{ headerShown: false }} />
          <Stack.Screen name="showComment" options={{ headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </ThemeProvider>
  );
}