import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import {
  createBottomTabNavigator,
  type BottomTabHeaderProps,
  type BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';
import { LayoutDashboard, ArrowUpDown, Mic, BarChart3, Wallet, UserRound, Bell } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import { colors, spacing } from '../theme/colors';

// Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import TransactionsScreen from '../screens/transactions/TransactionsScreen';
import VoiceRecordScreen from '../screens/voice/VoiceRecordScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import BudgetScreen from '../screens/budget/BudgetScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import SettingsNavigator from './SettingsNavigator';

export type MainTabParamList = {
  Overview: undefined;
  Transactions: { openVoiceMode?: number } | undefined;
  Voice: undefined;
  Reports: undefined;
  Budget: undefined;
  Settings: undefined;
  Notifications: { returnTo?: keyof Omit<MainTabParamList, 'Notifications'> } | undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTopBar({ navigation, route }: BottomTabHeaderProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const isSettingsActive = route.name === 'Settings';
  const { notifications } = useNotification();
  const unreadCount = notifications.length;

  return (
    <View
      style={[
        styles.topBar,
        {
          backgroundColor: themeColors.card,
          borderBottomColor: themeColors.border,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Settings')}
        style={[
          styles.profileButton,
          {
            backgroundColor: themeColors.muted,
            borderColor: themeColors.border,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Open profile settings"
      >
        <UserRound
          size={24}
          color={
            isSettingsActive
              ? themeColors.primary
              : themeColors.foreground
          }
        />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Notifications', { returnTo: route.name as keyof Omit<MainTabParamList, 'Notifications'> })}
        style={[
          styles.notificationButton,
          {
            backgroundColor: themeColors.muted,
            borderColor: themeColors.border,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Open notifications"
      >
        <Bell size={23} color={themeColors.foreground} />
        {unreadCount > 0 && (
          <View
            style={[
              styles.badge,
              { backgroundColor: themeColors.destructive },
            ]}
          >
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function MainNavigator() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  return (
    <Tab.Navigator
      screenOptions={{
        header: (props) => <MainTopBar {...props} />,
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
            <LayoutDashboard size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <ArrowUpDown size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Voice"
        component={VoiceRecordScreen}
        options={{
          tabBarShowLabel: false,
          tabBarButton: (props: BottomTabBarButtonProps) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={props.onPress}
              style={styles.voiceTabContainer}
              accessibilityRole="button"
              accessibilityLabel="Record voice transaction"
            >
              <View style={[styles.voiceFab, { backgroundColor: themeColors.primary }]}>
                <Mic size={26} color={themeColors.primaryForeground} />
              </View>
            </TouchableOpacity>
          ),
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
        name="Budget"
        component={BudgetScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Wallet size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: styles.hiddenTab,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: styles.hiddenTab,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  topBar: {
    minHeight: 85,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    transform: [{ translateY: spacing.md }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    transform: [{ translateY: spacing.md }],
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  hiddenTab: {
    display: 'none',
  },
  voiceTabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -14 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
});
