import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCard, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme/colors';

export default function BillingScreen() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const styles = createStyles(themeColors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <View style={styles.navbar}>
          <Text style={styles.navbarTitle}>Settings</Text>
          <Text style={styles.navbarSubtitle}>Manage your account settings and set e-mail preferences.</Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.placeholder}>
              <View style={[styles.iconWrap, { backgroundColor: themeColors.muted }]}>
                <CreditCard size={28} color={themeColors.foreground} strokeWidth={1.5} />
              </View>
              <Text style={[styles.placeholderTitle, { color: themeColors.foreground }]}>
                No active subscription
              </Text>
              <Text style={[styles.placeholderText, { color: themeColors.mutedForeground }]}>
                VoiceyBill is free and open source. Subscription features will be available in a future release.
              </Text>

              <View style={[styles.featureList, { borderColor: themeColors.border }]}>
                {[
                  'Unlimited transaction history',
                  'AI voice & receipt scanning',
                  'Monthly email reports',
                  'Multi-currency support',
                ].map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <Sparkles size={14} color={themeColors.mutedForeground} strokeWidth={1.5} />
                    <Text style={[styles.featureText, { color: themeColors.mutedForeground }]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
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
    content: { padding: spacing.lg },
    card: {
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      padding: spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    placeholder: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, textAlign: 'center' },
    placeholderText: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 22, paddingHorizontal: spacing.md },
    featureList: {
      width: '100%',
      marginTop: spacing.sm,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      gap: spacing.md,
    },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    featureText: { fontSize: fontSize.sm },
  });
