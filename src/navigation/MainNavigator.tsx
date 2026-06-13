import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Platform } from 'react-native';
import {
  createBottomTabNavigator,
  type BottomTabHeaderProps,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import { useVoiceRecording } from '../context/VoiceRecordingContext';
import { colors, spacing, fontFamily } from '../theme/colors';

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

const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Overview: { active: 'home', inactive: 'home-outline' },
  Transactions: { active: 'list', inactive: 'list-outline' },
  Reports: { active: 'pie-chart', inactive: 'pie-chart-outline' },
  Budget: { active: 'wallet', inactive: 'wallet-outline' },
};

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const insets = useSafeAreaInsets();
  const { openVoiceRecording } = useVoiceRecording();

  // Tabs shown in the bar (left side, then FAB, then right side)
  const leftTabs = ['Overview', 'Transactions'];
  const rightTabs = ['Reports', 'Budget'];

  const renderTab = (name: string) => {
    const routeIndex = state.routes.findIndex((r) => r.name === name);
    const isFocused = state.index === routeIndex;
    const icon = ICONS[name];

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: state.routes[routeIndex].key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(name as never);
      }
    };

    return (
      <TouchableOpacity
        key={name}
        style={styles.tabItem}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isFocused ? icon.active : icon.inactive}
          size={24}
          color={isFocused ? themeColors.primary : themeColors.mutedForeground}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.floatingWrapper, { paddingBottom: insets.bottom || spacing.md }]} pointerEvents="box-none">
      <View
        style={[
          styles.floatingBar,
          {
            backgroundColor: activeTheme === 'dark' ? themeColors.card : '#ffffff',
            borderColor: themeColors.border,
          },
        ]}
      >
        {leftTabs.map(renderTab)}

        {/* Center FAB */}
        <View style={styles.fabSlot}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => openVoiceRecording(true)}
            style={[styles.voiceFab, { backgroundColor: themeColors.primary }]}
          >
            <Ionicons name="mic" size={24} color={themeColors.primaryForeground} />
          </TouchableOpacity>
        </View>

        {rightTabs.map(renderTab)}
      </View>
    </View>
  );
}

function MainTopBar({ navigation, route }: BottomTabHeaderProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const insets = useSafeAreaInsets();
  const { notifications } = useNotification();
  const unreadCount = notifications.length;

  // Get title based on route name
  const getTitle = (routeName: string) => {
    switch (routeName) {
      case 'Overview': return 'My Budget';
      case 'Transactions': return 'Transactions';
      case 'Reports': return 'Reports';
      case 'Budget': return 'Budget';
      case 'Settings': return 'Settings';
      case 'Notifications': return 'Notifications';
      default: return routeName;
    }
  };

  return (
    <View style={[
      styles.topBar, 
      { 
        backgroundColor: themeColors.background,
        paddingTop: insets.top > 0 ? insets.top + spacing.sm : spacing.md, 
      }
    ]}>
      <View style={styles.headerLeftGroup}>
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={() => navigation.navigate('Transactions', { openVoiceMode: Date.now() })}
          style={styles.headerIconButton}
        >
          <Ionicons name="add-circle-outline" size={28} color={themeColors.foreground} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.headerTitle, { color: themeColors.foreground }]}>
        {getTitle(route.name)}
      </Text>

      <View style={styles.headerRightGroup}>
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={() => navigation.navigate('Notifications')}
          style={styles.headerIconButton}
        >
          <Ionicons name="notifications-outline" size={24} color={themeColors.foreground} />
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: themeColors.destructive, borderColor: themeColors.background }]}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={() => navigation.navigate('Settings')}
          style={styles.headerIconButton}
        >
          <Ionicons name="person-circle-outline" size={28} color={themeColors.foreground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        header: (props) => <MainTopBar {...props} />,
      }}
    >
      <Tab.Screen
        name="Overview"
        component={DashboardScreen}
      />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen
        name="Voice"
        component={VoiceRecordScreen}
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
          },
        })}
      />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Settings" component={SettingsNavigator} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  topBar: {
    minHeight: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    width: 80,
  },
  headerTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    textAlign: 'center',
    flex: 1,
  },
  headerIconButton: {
    padding: spacing.xs,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontFamily: fontFamily.bold,
  },
  // Floating tab bar
  floatingWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    width: '90%',
    maxWidth: 420,
    borderRadius: 32,
    paddingHorizontal: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  fabSlot: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceFab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -18 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
