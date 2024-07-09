import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

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
          tabBarIcon: ({ color }) => <TabBarIcon name="address-book" color={color} />,
          headerShown: false,
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
