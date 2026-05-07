import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Wallet, Mic, BarChart3, Settings } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';

// Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import TransactionsScreen from '../screens/transactions/TransactionsScreen';
import VoiceRecordScreen from '../screens/voice/VoiceRecordScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import SettingsNavigator from './SettingsNavigator';

export type MainTabParamList = {
  Overview: undefined;
  Transactions: { openVoiceMode?: number } | undefined;
  Voice: undefined;
  Reports: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.mutedForeground,
        tabBarStyle: {
          backgroundColor: themeColors.card,
          borderTopColor: themeColors.border,
        },
      }}
    >
      <Tab.Screen
        name="Overview"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Home size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Wallet size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Voice"
        component={VoiceRecordScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Mic size={size || 24} color={color} />
          ),
          tabBarLabel: 'Voice',
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Transactions', { openVoiceMode: Date.now() });
          },
        })}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Settings size={size || 24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
