import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { Text } from '@/components/Themed';
import Nutrimetas from '@/components/NutrimetasHeader';
import useSignOutButton from '@/components/SignOutButton';

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
        name="expedientes"
        options={{
          title: "Expedientes",
          headerTitle: Nutrimetas,
          headerRight: signOutButton,
          headerRightContainerStyle: {marginRight: 15},
          headerShown: true,
          tabBarIcon: ({ color }) => <TabBarIcon name="address-book" color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Mis Plantillas',
          tabBarIcon: ({ color }) => <TabBarIcon name="flag" color={color} />,
        }}
      />
      <Tabs.Screen
        name="transferencias"
        options={{
          title: 'Mover Pacientes',
          tabBarIcon: ({ color }) => <TabBarIcon name="address-card-o" color={color} />,
          headerShown: false,
        }}
      />
    </Tabs>
    
  );
}
