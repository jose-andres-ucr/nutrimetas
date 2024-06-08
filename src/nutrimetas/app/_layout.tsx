// Dependencies
import "@react-native-firebase/firestore"

// React Query and their providers
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Expo Navigation
import { Slot } from 'expo-router';

// Login session and its dispatching context 
import { LoginSessionProvider } from '@/shared/LoginSession';

const queryClient = new QueryClient();

export default function RootLayout() {
  // Inject login session state and handling 
  return (
    <LoginSessionProvider>
      <QueryClientProvider client={queryClient}>
        <Slot />
      </QueryClientProvider>
    </LoginSessionProvider>
  );
}
