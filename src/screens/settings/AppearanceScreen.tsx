import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, fontSize, fontWeight, borderRadius, fontFamily, shadows, cardRadius } from '../../theme/colors';

export default function AppearanceScreen() {
  const navigation = useNavigation();
  const { theme, setTheme, activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const insets = useSafeAreaInsets();
  const [selectedTheme, setSelectedTheme] = React.useState<'light' | 'dark' | 'system'>(theme);

  const styles = createStyles(themeColors);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false}>
        <View style={[styles.screenHeader, { paddingTop: Math.max(insets.top, spacing.sm) }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color={themeColors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.screenTitle, { color: themeColors.foreground }]}>Appearance</Text>
            <Text style={[styles.screenSubtitle, { color: themeColors.mutedForeground }]}>Theme & display</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
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
    screenHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.card,
    },
    headerTextWrap: { flex: 1 },
    screenTitle: { fontFamily: fontFamily.bold, fontSize: 20, letterSpacing: -0.3 },
    screenSubtitle: { fontFamily: fontFamily.regular, fontSize: 13, marginTop: 2 },
    content: {
      paddingHorizontal: spacing.lg,
    },
    card: {
      borderRadius: cardRadius,
      borderWidth: StyleSheet.hairlineWidth,
      padding: spacing.lg,
      ...shadows.card,
    },
    sectionLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: 14,
      color: theme.foreground,
      marginBottom: spacing.xs,
    },
    sectionDescription: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
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
      paddingVertical: spacing.md,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      marginTop: spacing.sm,
      ...shadows.md,
    },
    updateButtonText: {
      fontFamily: fontFamily.semibold,
      fontSize: 15,
    },
  });
