// Dependencies
// Core React hooks & misc. stuff
import React, { useEffect } from 'react';

// React Native UI
import { Platform } from 'react-native';

// Expo nested navigation
import { Stack } from 'expo-router';

// Expo Notifications
import * as Notifications from 'expo-notifications';

// Color palette
import Colors from "@/constants/Colors";

export default function AppLayout() {
	// Register push notifications
	async function registerForPushNotificationsAsync() {
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

	useEffect(() => {
		registerForPushNotificationsAsync();
	}, []);

	// Register group subroutes 
	return (
		<Stack initialRouteName='(public)'>
			<Stack.Screen
				name="(public)"
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="(admin)"
				options={{ headerShown: false }}
			/>
			<Stack.Screen 
				name="(root)"
				options={{ headerShown: false }}
			/>
		</Stack>
	);
}