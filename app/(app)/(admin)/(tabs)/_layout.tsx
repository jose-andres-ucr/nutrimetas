import React from 'react';
import { Tabs } from 'expo-router';

import Nutrimetas from '@/components/NutrimetasHeader';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import useSignOutButton from '@/components/SignOutButton';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}


export default function TabLayout() {
  const colorScheme = useColorScheme();
  const signOutButton = useSignOutButton();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: useClientOnlyValue(false, true),
        headerTitleAlign: 'center',
      }}>
      <Tabs.Screen
        name="professionals"
        options={{
          title: "Profesionales",
          headerTitle: Nutrimetas,
          headerRight: signOutButton,
          headerRightContainerStyle: {marginRight: 15},
          headerShown: true,
          tabBarIcon: ({ color }) => <TabBarIcon name="address-book-o" color={color} />,
        }}
      />
    </Tabs>
  );
}
