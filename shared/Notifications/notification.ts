// app/notifications.ts
import * as Notifications from 'expo-notifications';

// React Native UI
import { Platform } from 'react-native';

// Color palette
import Colors from "@/constants/Colors";

// First, set the handler that will cause the notification
// to show the alert

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

// Second, call the method

export async function scheduleNotification(title: string, body: string, date: Date) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
        },
        trigger: {
            date,
        },
    });
}

// Register the app for push notifications
export async function registerForPushNotificationsAsync() {
    // Configure notifications for android
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: Colors.greenUCR,
        });
    }

    // Ask for notification display permissions when the app initializes
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
