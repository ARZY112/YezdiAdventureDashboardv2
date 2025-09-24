import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from './screens/DashboardScreen';
import SettingsScreen from './screens/SettingsScreen';
import ConnectivityScreen from './screens/ConnectivityScreen';
import { BleProvider } from './utils/BleManager';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BleProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                if (route.name === 'Dashboard') {
                  iconName = focused ? 'speedometer' : 'speedometer-outline';
                } else if (route.name === 'Connectivity') {
                  iconName = focused ? 'bluetooth' : 'bluetooth-outline';
                } else if (route.name === 'Settings') {
                  iconName = focused ? 'settings' : 'settings-outline';
                }
                return <Ionicons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#00FFFF',
              tabBarInactiveTintColor: 'gray',
              tabBarStyle: {
                backgroundColor: '#111',
                borderTopColor: '#333',
              },
              headerStyle: {
                backgroundColor: '#1a1a1a',
              },
              headerTintColor: '#fff',
            })}
          >
            <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
            <Tab.Screen name="Connectivity" component={ConnectivityScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
      </BleProvider>
    </GestureHandlerRootView>
  );
}