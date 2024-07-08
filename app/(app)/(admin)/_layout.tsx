// Core React hooks & misc. stuff
import {useEffect, useContext} from "react";

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

// Firestore Authentication
import auth from '@react-native-firebase/auth';

// Sign-in session context
import { SessionContext, SessionDispatchContext } from "@/shared/LoginSession";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();


function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <FlashMessage position="top" />      
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="addProfessional" options={{ headerShown: false }} />
        </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  // Keep track on whether or not a redirect is required based on
  // the previously known credentials
  const session = useContext(SessionContext);
  const sessionDispatch = useContext(SessionDispatchContext);

  // Subscribe to Firebase Auth's authentication state as to notice
  // and account-for inconsistent sessions
  useEffect(() => {
      const authUnsuscriber = auth()
        .onAuthStateChanged(
            (User) => {
                if (User === null || User.uid !== session?.uid) {
                  sessionDispatch({
                    type: "reset",
                    newSession: session,
                  });
                }
            }
        );

      return authUnsuscriber;
  }, []);

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

  // If the session is invalidated, redirect to the sign-in page
  if (session === undefined || session.role !== "admin") {
    return <Redirect href="/sign-in" />;
  }

  // Otherwise, defer to the root layout.
  return (
    <RootLayoutNav />
  );
}