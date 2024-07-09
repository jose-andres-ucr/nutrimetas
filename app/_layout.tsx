// Dependencies
import "@react-native-firebase/firestore"

// React Query and their providers
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Expo Navigation
import { Slot } from 'expo-router';

// Login session and its context 
import LoginSessionProvider from '@/shared/Session/LoginSessionProvider';

const queryClient = new QueryClient();

export default function RootLayout() {
  // Inject login session state and handling 
  return (
    <QueryClientProvider client={queryClient}>
      <LoginSessionProvider>
        <Slot />
      </LoginSessionProvider>
    </QueryClientProvider>
  );
}
