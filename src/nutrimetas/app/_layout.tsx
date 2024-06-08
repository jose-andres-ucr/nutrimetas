// Dependencies
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