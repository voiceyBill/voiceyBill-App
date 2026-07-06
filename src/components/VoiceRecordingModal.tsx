import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Tag,
  Calendar,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  MicOff,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme/colors';
import { useVoiceRecording } from '../context/VoiceRecordingContext';
import { useTypedSelector } from '../store/hooks';
import { formatCurrency } from '../lib/formatCurrency';
import Spinner from './common/Spinner';

const VoiceRecordingModal: React.FC = () => {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const insets = useSafeAreaInsets();
  const { isVisible, isProcessing, result, error, applyResult, closePopup } =
    useVoiceRecording();
  const user = useTypedSelector((s) => s.auth.user);
  const baseCurrency = user?.baseCurrency || 'USD';
  const isIncome = result?.type === 'INCOME';

  const metaPills = result
    ? [
        result.category
          ? { icon: Tag, text: String(result.category) }
          : null,
        result.date
          ? {
              icon: Calendar,
              text: (() => {
                try {
                  return format(new Date(result.date), 'MMM d, yyyy');
                } catch {
                  return String(result.date);
                }
              })(),
            }
          : null,
        result.paymentMethod
          ? {
              icon: CreditCard,
              text: String(result.paymentMethod).replace(/_/g, ' ').toLowerCase(),
            }
          : null,
      ].filter(Boolean)
    : [];

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={closePopup}
      statusBarTranslucent
    >
      <StatusBar
        barStyle={activeTheme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={themeColors.background}
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        edges={['left', 'right', 'top']}
      >
        <View
          style={[
            styles.header,
            {
              borderBottomColor: themeColors.border,
              paddingTop: Math.max(insets.top, spacing.md),
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: themeColors.foreground }]}>
            Voice Transaction
          </Text>
          <TouchableOpacity
            onPress={closePopup}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <X size={24} color={themeColors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {isProcessing ? (
            <View style={styles.centered}>
              <Spinner size={48} color={themeColors.primary} />
              <Text style={[styles.centeredTitle, { color: themeColors.foreground }]}>
                Processing…
              </Text>
              <Text style={[styles.centeredSub, { color: themeColors.mutedForeground }]}>
                Analysing your voice recording
              </Text>
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <View
                style={[
                  styles.errorIconWrap,
                  { backgroundColor: `${themeColors.destructive}1A` },
                ]}
              >
                <MicOff size={30} color={themeColors.destructive} strokeWidth={2} />
              </View>
              <Text style={[styles.errorTitle, { color: themeColors.foreground }]}>
                Couldn't process
              </Text>
              <Text style={[styles.errorMessage, { color: themeColors.mutedForeground }]}>
                {error}
              </Text>
              <TouchableOpacity
                onPress={closePopup}
                style={[styles.errorBtn, { backgroundColor: themeColors.primary }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.errorBtnText, { color: themeColors.primaryForeground }]}>
                  Try again
                </Text>
              </TouchableOpacity>
            </View>
          ) : result ? (
            <View style={styles.resultWrap}>
              <View
                style={[
                  styles.resultCard,
                  {
                    backgroundColor: themeColors.card,
                    borderColor: isIncome ? themeColors.incomeBg : themeColors.expenseBg,
                  },
                ]}
              >
                <View style={styles.resultTitleRow}>
                  <View style={styles.resultTypeRow}>
                    {isIncome ? (
                      <ArrowUpRight size={16} color={themeColors.incomeText} strokeWidth={2.5} />
                    ) : (
                      <ArrowDownRight size={16} color={themeColors.expenseText} strokeWidth={2.5} />
                    )}
                    <Text
                      style={[
                        styles.resultType,
                        { color: isIncome ? themeColors.incomeText : themeColors.expenseText },
                      ]}
                    >
                      {isIncome ? 'Income' : 'Expense'}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.resultAmount,
                      { color: isIncome ? themeColors.incomeText : themeColors.expenseText },
                    ]}
                  >
                    {result.amount != null
                      ? formatCurrency(result.amount, {
                          currency: result.currency || baseCurrency,
                          showSign: true,
                          isExpense: !isIncome,
                        })
                      : '—'}
                  </Text>
                </View>

                <Text style={[styles.resultName, { color: themeColors.foreground }]} numberOfLines={2}>
                  {result.title || '—'}
                </Text>

                <View style={styles.metaRow}>
                  {metaPills.map((pill: any, i: number) => {
                    const Icon = pill.icon;
                    return (
                      <View key={i} style={[styles.metaPill, { backgroundColor: themeColors.muted }]}>
                        <Icon size={11} color={themeColors.mutedForeground} strokeWidth={2} />
                        <Text style={[styles.metaPillText, { color: themeColors.mutedForeground }]}>
                          {pill.text}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {result.description ? (
                  <Text style={[styles.resultDesc, { color: themeColors.mutedForeground }]} numberOfLines={2}>
                    {result.description}
                  </Text>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={applyResult}
                style={[styles.applyBtn, { backgroundColor: themeColors.primary }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.applyBtnText, { color: themeColors.primaryForeground }]}>
                  Apply to Form
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
  closeButton: { padding: spacing.xs },
  body: { flex: 1, paddingHorizontal: spacing.lg },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  centeredTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.md,
  },
  centeredSub: { fontSize: fontSize.sm, textAlign: 'center' },
  errorIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  errorTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
  errorMessage: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  errorBtn: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minWidth: 200,
    alignItems: 'center',
  },
  errorBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  resultWrap: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  resultCard: {
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  resultTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  resultType: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  resultAmount: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  resultName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    textTransform: 'capitalize',
  },
  resultDesc: { fontSize: fontSize.xs, lineHeight: 18 },
  applyBtn: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
});

export default VoiceRecordingModal;
