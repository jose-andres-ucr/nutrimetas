import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import {Text, StyleSheet } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import useSignOutButton from '@/components/SignOutButton';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

function Nutrimetas() {
  return (
    <Text style={styles.subtitle}>
      NUTRI<Text style={{ color: Colors.lightblue }}>METAS</Text>
    </Text>
  );
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
        name="goalsPatient"
        options={{
          title: 'Metas',
          headerTitle: Nutrimetas,
          headerRight: signOutButton,
          headerRightContainerStyle: {marginRight: 15},
          headerShown: true, 
          tabBarIcon: ({ color }) => <TabBarIcon name="flag" color={color} />,
        }}
      />
      <Tabs.Screen
        name="comments"
        options={{
          title: "Comentarios",
          headerTitle: () => <Nutrimetas />, 
          tabBarIcon: ({ color }) => <TabBarIcon name="address-card-o" color={color} />,
        }}
      />
    </Tabs>
  );
}


const styles = StyleSheet.create({
  subtitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: Colors.green,
  },
});