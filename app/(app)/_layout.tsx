import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(root)',
};

export default function AppLayout() {
    return (
    <Stack>
        <Stack.Screen 
            name="(admin)"
            options={{ headerShown: false }}
        />
        <Stack.Screen 
            name="(root)"
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name="sign-in"
            options={{
                presentation: 'modal',
                headerShown: false,
            }}
        />
    </Stack>
    );
}
