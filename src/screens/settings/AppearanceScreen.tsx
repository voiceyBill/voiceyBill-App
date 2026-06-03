import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme/colors';

export default function AppearanceScreen() {
  const { theme, setTheme, activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const [selectedTheme, setSelectedTheme] = React.useState<'light' | 'dark' | 'system'>(theme);

  const styles = createStyles(themeColors);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={styles.navbar}>
          <Text style={styles.navbarTitle}>Settings</Text>
          <Text style={styles.navbarSubtitle}>Manage your account settings and set e-mail preferences.</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Theme</Text>
            <Text style={styles.sectionDescription}>
              Select the theme for the dashboard.
            </Text>

            {/* Theme Previews */}
            <View style={styles.themesContainer}>
              {/* First Row: Light and Dark */}
              <View style={styles.themeRow}>
                {/* Light Theme */}
                <TouchableOpacity
                  style={[
                    styles.themeCard,
                    selectedTheme === 'light' && styles.themeCardActive,
                  ]}
                  onPress={() => setSelectedTheme('light')}
                  activeOpacity={0.7}
                >
                  <View style={styles.themePreview}>
                    <View style={styles.lightPreview}>
                      <View style={styles.lightPreviewHeader}>
                        <View style={styles.lightBar1} />
                        <View style={styles.lightBar2} />
                      </View>
                      <View style={styles.lightPreviewItem}>
                        <View style={styles.lightCircle} />
                        <View style={styles.lightBar2} />
                      </View>
                      <View style={styles.lightPreviewItem}>
                        <View style={styles.lightCircle} />
                        <View style={styles.lightBar2} />
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.themeLabel, selectedTheme === 'light' && styles.themeLabelActive]}>
                    Light
                  </Text>
                </TouchableOpacity>

                {/* Dark Theme */}
                <TouchableOpacity
                  style={[
                    styles.themeCard,
                    selectedTheme === 'dark' && styles.themeCardActive,
                  ]}
                  onPress={() => setSelectedTheme('dark')}
                  activeOpacity={0.7}
                >
                  <View style={styles.themePreview}>
                    <View style={styles.darkPreview}>
                      <View style={styles.darkPreviewHeader}>
                        <View style={styles.darkBar1} />
                        <View style={styles.darkBar2} />
                      </View>
                      <View style={styles.darkPreviewItem}>
                        <View style={styles.darkCircle} />
                        <View style={styles.darkBar2} />
                      </View>
                      <View style={styles.darkPreviewItem}>
                        <View style={styles.darkCircle} />
                        <View style={styles.darkBar2} />
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.themeLabel, selectedTheme === 'dark' && styles.themeLabelActive]}>
                    Dark
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Second Row: System (Centered) */}
              <View style={styles.themeRowCentered}>
                {/* System Theme */}
                <TouchableOpacity
                  style={[
                    styles.themeCard,
                    selectedTheme === 'system' && styles.themeCardActive,
                  ]}
                  onPress={() => setSelectedTheme('system')}
                  activeOpacity={0.7}
                >
                  <View style={styles.themePreview}>
                    <View style={styles.systemPreview}>
                      {/* Split preview - half light, half dark */}
                      <View style={styles.systemPreviewLeft}>
                        <View style={styles.lightPreviewHeader}>
                          <View style={styles.lightBar1} />
                        </View>
                        <View style={styles.lightPreviewItem}>
                          <View style={styles.lightCircle} />
                        </View>
                      </View>
                      <View style={styles.systemPreviewRight}>
                        <View style={styles.darkPreviewHeader}>
                          <View style={styles.darkBar1} />
                        </View>
                        <View style={styles.darkPreviewItem}>
                          <View style={styles.darkCircle} />
                        </View>
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.themeLabel, selectedTheme === 'system' && styles.themeLabelActive]}>
                    System
                  </Text>
                </TouchableOpacity>
              </View>
            </View>


            <TouchableOpacity
              style={[
                styles.updateButton,
                {
                  backgroundColor: selectedTheme === theme ? themeColors.mutedForeground : themeColors.primary,
                },
              ]}
              onPress={() => setTheme(selectedTheme)}
              disabled={selectedTheme === theme}
              activeOpacity={selectedTheme === theme ? 1 : 0.8}
            >
              <Text
                style={[
                  styles.updateButtonText,
                  { color: themeColors.primaryForeground, opacity: selectedTheme === theme ? 0.6 : 1 },
                ]}
              >
                Update preferences
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: typeof colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    navbar: {
      backgroundColor: theme.navbar,
      padding: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
    },
    navbarTitle: {
      fontSize: fontSize['2xl'],
      fontWeight: fontWeight.bold,
      color: theme.navbarForeground,
    },
    navbarSubtitle: {
      fontSize: fontSize.sm,
      color: theme.navbarForeground,
      opacity: 0.9,
      marginTop: spacing.xs,
    },
    content: {
      padding: spacing.lg,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    sectionLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: theme.foreground,
      marginBottom: spacing.xs,
    },
    sectionDescription: {
      fontSize: fontSize.sm,
      color: theme.mutedForeground,
      marginBottom: spacing.lg,
    },
    themesContainer: {
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    themeRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    themeRowCentered: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    themeCard: {
      flex: 1,
      maxWidth: 170,
      borderWidth: 2,
      borderColor: theme.border,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      backgroundColor: theme.card,
    },
    themeCardActive: {
      borderColor: theme.primary,
    },
    themePreview: {
      padding: spacing.xs,
    },
    // Light Theme Preview
    lightPreview: {
      backgroundColor: '#ecedef',
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      gap: spacing.sm,
    },
    lightPreviewHeader: {
      backgroundColor: '#ffffff',
      borderRadius: borderRadius.sm,
      padding: spacing.sm,
      gap: spacing.xs,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    lightPreviewItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      borderRadius: borderRadius.sm,
      padding: spacing.sm,
      gap: spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    lightBar1: {
      height: 6,
      width: 40,
      borderRadius: 3,
      backgroundColor: '#ecedef',
    },
    lightBar2: {
      height: 6,
      width: 50,
      borderRadius: 3,
      backgroundColor: '#ecedef',
    },
    lightCircle: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#ecedef',
    },
    // Dark Theme Preview — matches actual dark theme (#171717 bg, #2a2a2a card)
    darkPreview: {
      backgroundColor: '#171717',
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    darkPreviewHeader: {
      backgroundColor: '#2a2a2a',
      borderRadius: borderRadius.sm,
      padding: spacing.sm,
      gap: spacing.xs,
    },
    darkPreviewItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#2a2a2a',
      borderRadius: borderRadius.sm,
      padding: spacing.sm,
      gap: spacing.sm,
    },
    darkBar1: {
      height: 6,
      width: 40,
      borderRadius: 3,
      backgroundColor: '#888888',
    },
    darkBar2: {
      height: 6,
      width: 50,
      borderRadius: 3,
      backgroundColor: '#888888',
    },
    darkCircle: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#888888',
    },
    // System Theme Preview (Split view)
    systemPreview: {
      flexDirection: 'row',
      borderRadius: borderRadius.md,
      overflow: 'hidden',
      height: 100,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    systemPreviewLeft: {
      flex: 1,
      backgroundColor: '#ecedef',
      padding: spacing.xs,
      gap: spacing.xs,
      justifyContent: 'center',
    },
    systemPreviewRight: {
      flex: 1,
      backgroundColor: '#171717',
      padding: spacing.xs,
      gap: spacing.xs,
      justifyContent: 'center',
    },
    themeLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: theme.foreground,
      textAlign: 'center',
      paddingVertical: spacing.sm,
    },
    themeLabelActive: {
      color: theme.primary,
      fontWeight: fontWeight.semibold,
    },
    updateButton: {
      padding: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginTop: spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    updateButtonText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
    },
  });
