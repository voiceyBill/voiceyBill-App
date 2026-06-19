import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CreditCard, Sparkles, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, borderRadius, fontFamily, shadows, cardRadius } from '../../theme/colors';

export default function BillingScreen() {
  const navigation = useNavigation();
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const insets = useSafeAreaInsets();
  const styles = createStyles(themeColors);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <View style={[styles.screenHeader, { paddingTop: Math.max(insets.top, spacing.sm) }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color={themeColors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.screenTitle, { color: themeColors.foreground }]}>Billing</Text>
            <Text style={[styles.screenSubtitle, { color: themeColors.mutedForeground }]}>Subscription & payments</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.placeholder}>
              <View style={[styles.iconWrap, { backgroundColor: themeColors.muted }]}>
                <CreditCard size={24} color={themeColors.foreground} strokeWidth={1.75} />
              </View>
              <Text style={[styles.placeholderTitle, { color: themeColors.foreground }]}>
                Free & open source
              </Text>
              <Text style={[styles.placeholderText, { color: themeColors.mutedForeground }]}>
                VoiceyBill is free. Premium subscription features may arrive in a future release.
              </Text>

              <View style={[styles.featureList, { borderColor: themeColors.border }]}>
                {[
                  'Unlimited transaction history',
                  'AI voice & receipt scanning',
                  'Monthly email reports',
                  'Multi-currency support',
                ].map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <Sparkles size={14} color={themeColors.primary} strokeWidth={1.75} />
                    <Text style={[styles.featureText, { color: themeColors.foreground }]}>
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
    content: { paddingHorizontal: spacing.lg },
    card: {
      borderRadius: cardRadius,
      borderWidth: StyleSheet.hairlineWidth,
      padding: spacing.lg,
      ...shadows.card,
    },
    placeholder: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    placeholderTitle: { fontFamily: fontFamily.semibold, fontSize: 16, textAlign: 'center' },
    placeholderText: { fontFamily: fontFamily.regular, fontSize: 13, textAlign: 'center', lineHeight: 19, paddingHorizontal: spacing.md },
    featureList: {
      width: '100%',
      marginTop: spacing.md,
      paddingTop: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: spacing.sm,
    },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 2 },
    featureText: { fontFamily: fontFamily.medium, fontSize: 13, flex: 1 },
  });
