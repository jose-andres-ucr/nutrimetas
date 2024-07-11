// Dependencies
// Core React hooks & misc. stuff
import React, { useEffect } from 'react';

// Expo nested navigation
import { Stack } from 'expo-router';

// Notifications
import { registerForPushNotificationsAsync } from 
	'@/shared/Notifications/notification';

export default function AppLayout() {
	// Register push notifications
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
			<Stack.Screen
				name="(account)"
				options={{ headerShown: false }}
			/>
		</Stack>
	);
}