import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { User, Palette, CreditCard, ChevronRight, LogOut } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useTypedSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../features/auth/authSlice';
import { apiClient } from '../../store/api-client';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme/colors';
import { Alert } from 'react-native';

type Section = {
  title: string;
  items: MenuItem[];
};

type MenuItem = {
  title: string;
  subtitle: string;
  screen: string;
  icon: React.ElementType;
};

const sections: Section[] = [
  {
    title: 'Personal',
    items: [
      { title: 'Account', subtitle: 'Update profile and avatar', screen: 'Account', icon: User },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { title: 'Appearance', subtitle: 'Theme and display settings', screen: 'Appearance', icon: Palette },
    ],
  },
  {
    title: 'Subscription',
    items: [
      { title: 'Billing', subtitle: 'Manage subscription and payments', screen: 'Billing', icon: CreditCard },
    ],
  },
];

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const dispatch = useAppDispatch();
  const user = useTypedSelector((s) => s.auth.user);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          dispatch(logout());
          dispatch(apiClient.util.resetApiState());
        },
      },
    ]);
  };

  const styles = createStyles(themeColors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        {/* Header */}
        <View style={styles.navbar}>
          <Text style={styles.navbarTitle}>Settings</Text>
          <Text style={styles.navbarSubtitle}>Manage your account settings and set e-mail preferences.</Text>
        </View>

        {/* User card — taps into Account settings */}
        {user && (
          <TouchableOpacity
            style={styles.userCard}
            onPress={() => navigation.navigate('Account' as never)}
            activeOpacity={0.7}
          >
            {user.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.userAvatarImage} />
            ) : (
              <View style={[styles.userAvatar, { backgroundColor: themeColors.muted }]}>
                <Text style={[styles.userInitial, { color: themeColors.foreground }]}>
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: themeColors.foreground }]}>{user.name}</Text>
              <Text style={[styles.userEmail, { color: themeColors.mutedForeground }]}>{user.email}</Text>
            </View>
            <ChevronRight size={16} color={themeColors.mutedForeground} />
          </TouchableOpacity>
        )}

        <View style={styles.content}>
          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.mutedForeground }]}>
                {section.title}
              </Text>
              <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                {section.items.map((item, index) => {
                  const IconComponent = item.icon;
                  const isLast = index === section.items.length - 1;
                  return (
                    <TouchableOpacity
                      key={item.screen}
                      style={[
                        styles.menuItem,
                        !isLast && { borderBottomWidth: 1, borderBottomColor: themeColors.border },
                      ]}
                      onPress={() => navigation.navigate(item.screen as never)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.menuIconWrap, { backgroundColor: themeColors.muted }]}>
                        <IconComponent size={18} color={themeColors.foreground} strokeWidth={1.75} />
                      </View>
                      <View style={styles.menuText}>
                        <Text style={[styles.menuTitle, { color: themeColors.foreground }]}>{item.title}</Text>
                        <Text style={[styles.menuSubtitle, { color: themeColors.mutedForeground }]}>{item.subtitle}</Text>
                      </View>
                      <ChevronRight size={18} color={themeColors.mutedForeground} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Logout */}
          <View style={styles.section}>
            <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
                <View style={[styles.menuIconWrap, { backgroundColor: themeColors.muted }]}>
                  <LogOut size={18} color={themeColors.destructive} strokeWidth={1.75} />
                </View>
                <View style={styles.menuText}>
                  <Text style={[styles.menuTitle, { color: themeColors.destructive }]}>Log out</Text>
                  <Text style={[styles.menuSubtitle, { color: themeColors.mutedForeground }]}>Sign out of your account</Text>
                </View>
                <ChevronRight size={18} color={themeColors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          {/* App version */}
          <Text style={[styles.version, { color: themeColors.mutedForeground }]}>VoiceyBill · v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: typeof colors.light) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    navbar: {
      backgroundColor: theme.navbar,
      padding: spacing.lg,
      paddingTop: spacing.xl + 20,
      paddingBottom: spacing.xl,
    },
    navbarTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: theme.navbarForeground },
    navbarSubtitle: { fontSize: fontSize.sm, color: theme.navbarForeground, opacity: 0.8, marginTop: spacing.xs },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    userAvatarImage: {
      width: 48,
      height: 48,
      borderRadius: 24,
      resizeMode: 'cover',
    },
    userAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    userInitial: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
    userInfo: { flex: 1 },
    userName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
    userEmail: { fontSize: fontSize.sm, marginTop: 2 },
    content: { padding: spacing.lg, gap: spacing.lg },
    section: { gap: spacing.sm },
    sectionTitle: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      paddingHorizontal: spacing.xs,
    },
    sectionCard: {
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
    },
    menuIconWrap: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuText: { flex: 1 },
    menuTitle: { fontSize: fontSize.md, fontWeight: fontWeight.medium },
    menuSubtitle: { fontSize: fontSize.xs, marginTop: 2 },
    version: { fontSize: fontSize.xs, textAlign: 'center', marginTop: spacing.md },
  });
