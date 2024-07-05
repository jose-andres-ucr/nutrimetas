// Dependencies
import "@react-native-firebase/firestore"

// React Query and their providers
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Expo Navigation
import { Slot } from 'expo-router';
import * as Notifications from 'expo-notifications';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Colors from "@/constants/Colors";

// Login session and its dispatching context 
import { LoginSessionProvider } from '@/shared/LoginSession';

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  async function registerForPushNotificationsAsync() {

    // Configuracion de notificacion para android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: Colors.greenUCR,
      });
    }

    // Pedir permisos para mostrar notificaciones apenas se inicializa la app
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
  }
  // Inject login session state and handling 
  return (
    <LoginSessionProvider>
      <QueryClientProvider client={queryClient}>
        <Slot />
      </QueryClientProvider>
    </LoginSessionProvider>
  );
}
