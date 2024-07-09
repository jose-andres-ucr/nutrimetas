import { Stack } from 'expo-router';

export default function AppLayout() {
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