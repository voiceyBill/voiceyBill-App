import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Car,
  Check,
  CircleDollarSign,
  Clapperboard,
  HeartPulse,
  Home,
  PiggyBank,
  Plane,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Tag,
  TrendingUp,
  Trash2,
  Utensils,
  Wallet,
  Zap,
  X,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useTypedSelector } from '../../store/hooks';
import { useNotification, useToast } from '../../context/NotificationContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFloatingTabBarSpace } from '../../navigation/tabBarLayout';
import { getApiErrorMessage } from '../../lib/getApiErrorMessage';
import { Button } from '../../components/common';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  spacing,
  fontFamily,
  shadows,
  cardRadius,
} from '../../theme/colors';
import { useGetCategoriesQuery } from '../../features/category/categoryAPI';
import { isValidCategoryName } from '../../lib/category';
import { formatCurrency } from '../../lib/formatCurrency';
import {
  useDeleteBudgetMutation,
  useGetBudgetSummaryQuery,
  useUpsertBudgetMutation,
} from '../../features/budget/budgetAPI';
import BudgetCategoryPie from '../../components/budget/BudgetCategoryPie';
import VoiceRecorder from '../../components/transaction/VoiceRecorder';
import { useIsFocused } from '@react-navigation/native';
import type {
  BudgetSummary,
} from '../../features/budget/budgetType';

type BudgetMode = 'voice' | 'manual';

type MonthOption = {
  label: string;
  value: string;
  month: number;
  year: number;
};

type SummaryItem = {
  label: string;
  value: string;
  progress: number;
  tone: 'safe' | 'warning' | 'critical';
};

type CategoryIconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const categoryIcons: Record<string, React.ComponentType<CategoryIconProps>> = {
  groceries: ShoppingCart,
  dining: Utensils,
  transportation: Car,
  utilities: Zap,
  entertainment: Clapperboard,
  shopping: ShoppingBag,
  healthcare: HeartPulse,
  travel: Plane,
  housing: Home,
  income: CircleDollarSign,
  investments: TrendingUp,
  other: Tag,
};

const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
};

const getBudgetMonthOptions = (): MonthOption[] => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return Array.from({ length: 12 }).map((_, index) => {
    const now = new Date();
    const targetMonth = now.getMonth() - index;
    const month = ((targetMonth % 12) + 12) % 12 + 1;
    const year = now.getFullYear() + Math.floor((now.getMonth() - index) / 12);
    const date = new Date(year, month - 1, 1);
    const label = formatter.format(date);

    return {
      label: index === 0 ? `${label} (Current Month)` : label,
      value: `${year}-${String(month).padStart(2, '0')}`,
      month,
      year,
    };
  });
};

const getBudgetTone = (percentage: number) => {
  if (percentage > 90) return 'critical' as const;
  if (percentage >= 70) return 'warning' as const;
  return 'safe' as const;
};

const getToneColor = (tone: SummaryItem['tone'], themeColors: typeof colors.light) => {
  if (tone === 'critical') return themeColors.destructive;
  if (tone === 'warning') return '#d97706';
  return themeColors.primary;
};

// Budget summaries carry the real category name (e.g. "Dining & Restaurants").
// Prettify any legacy slug names ("dining_&_restaurants") for display.
const formatBudgetCategory = (name: string) =>
  name.replace(/[_-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

// Map a category name to an icon by its first word ("Dining & Restaurants" ->
// dining). Custom categories fall back to a generic icon.
const getCategoryIcon = (name: string) => {
  const key = name.trim().toLowerCase().split(/[\s&]+/)[0];
  return categoryIcons[key] ?? PiggyBank;
};

// formatBudgetCurrency is created inside the component so it can use the
// current user's base currency from the auth store.

const parseBudgetAmount = (value: string) => {
  const amount = Number(String(value || '').replace(/,/g, ''));
  return Number.isFinite(amount) ? amount : 0;
};

const BudgetScreen = () => {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { user } = useTypedSelector((state) => state.auth);
  const userBaseCurrency = user?.baseCurrency || 'USD';

  // Single source of truth for categories (default + custom), managed only in
  // Account → Categories.
  const { data: categoriesResponse } = useGetCategoriesQuery();
  const categories = useMemo(
    () =>
      (categoriesResponse?.data ?? [])
        .filter((c) => isValidCategoryName(c.name))
        .map((c) => ({ value: c.name, label: c.name, color: c.color })),
    [categoriesResponse],
  );

  const formatBudgetCurrency = (
    value: number,
    options: Parameters<typeof formatCurrency>[1] = {},
  ) => formatCurrency(Math.round(value), { ...options, decimalPlaces: 0, currency: userBaseCurrency });
  const { showNotification } = useNotification();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useFloatingTabBarSpace();
  const isBudgetFocused = useIsFocused();
  const currentMonthYear = getCurrentMonthYear();
  const monthOptions = useMemo(() => getBudgetMonthOptions(), []);
  const [selectedMonthValue, setSelectedMonthValue] = useState(
    `${currentMonthYear.year}-${String(currentMonthYear.month).padStart(2, '0')}`,
  );
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);
  const [isBudgetEditorVisible, setIsBudgetEditorVisible] = useState(false);
  const [budgetMode, setBudgetMode] = useState<BudgetMode>('voice');
  const [totalBudget, setTotalBudget] = useState('');
  const [categoryLimits, setCategoryLimits] = useState<Record<string, string>>(
    {},
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [previousBudget, setPreviousBudget] = useState<BudgetSummary | null>(null);
  const notifiedSummaryTimestampRef = useRef<number | undefined>(undefined);

  const selectedMonth =
    monthOptions.find((option) => option.value === selectedMonthValue) ||
    monthOptions[0];
  const selectedMonthLabel = selectedMonth.label.replace(' (Current Month)', '');
  const { month, year } = selectedMonth;
  const isCurrentMonth =
    month === currentMonthYear.month && year === currentMonthYear.year;

  const {
    data,
    isLoading,
    isError,
    refetch,
    fulfilledTimeStamp,
  } = useGetBudgetSummaryQuery({ month, year });

  const budget = data?.data;

  const [upsertBudget] = useUpsertBudgetMutation();
  const [deleteBudget] = useDeleteBudgetMutation();
  const totalBudgetNumber = parseBudgetAmount(totalBudget);

  const categoryLimitPayload = useMemo(
    () =>
      Object.entries(categoryLimits)
        .map(([category, value]) => ({
          category,
          limit: parseBudgetAmount(value),
        }))
        .filter((item) => item.limit > 0),
    [categoryLimits],
  );

  const categoryLimitSum = useMemo(
    () => categoryLimitPayload.reduce((sum, item) => sum + item.limit, 0),
    [categoryLimitPayload],
  );

  const categoryLimitErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    if (totalBudgetNumber <= 0) return errors;

    Object.entries(categoryLimits).forEach(([category, value]) => {
      const categoryLimit = parseBudgetAmount(value);
      if (categoryLimit > totalBudgetNumber) {
        errors[category] = 'Category budget cannot exceed overall budget.';
      }
    });

    if (categoryLimitSum > totalBudgetNumber) {
      Object.entries(categoryLimits).forEach(([category, value]) => {
        if (!errors[category] && parseBudgetAmount(value) > 0) {
          errors[category] = 'Total category budgets cannot exceed overall budget.';
        }
      });
    }

    return errors;
  }, [categoryLimitSum, categoryLimits, totalBudgetNumber]);

  const hasCategoryLimitError = Object.keys(categoryLimitErrors).length > 0;

  // Reset previousBudget when month changes
  useEffect(() => {
    setPreviousBudget(null);
  }, [selectedMonthValue]);

  useEffect(() => {
    if (!isBudgetEditorVisible) return;

    setBudgetMode('voice');
    setTotalBudget(budget?.hasBudget ? budget.totalBudget.toString() : '');
    // Match by normalized name so existing limits pre-fill regardless of whether
    // the server returns the display name ("Dining & Restaurants") or a
    // normalized key ("dining_&_restaurants"). Without this, updating a budget
    // showed blank category fields and could wipe other categories on save.
    const normalizeName = (s: string) =>
      s.trim().toLowerCase().replace(/\s+/g, '_');
    setCategoryLimits(
      categories.reduce((acc, category) => {
        const existing = budget?.categories.find(
          (item) => normalizeName(item.name) === normalizeName(category.value),
        );
        acc[category.value] = existing?.limit
          ? existing.limit.toString()
          : '';
        return acc;
      }, {} as Record<string, string>),
    );
  }, [budget, isBudgetEditorVisible, categories]);

  useEffect(() => {
    if (!isBudgetFocused || !budget?.hasBudget || budget.alerts.length === 0) return;
    if (!fulfilledTimeStamp || notifiedSummaryTimestampRef.current === fulfilledTimeStamp) return;

    notifiedSummaryTimestampRef.current = fulfilledTimeStamp;
    budget.alerts.forEach((alertItem) => {
      showNotification({
        type: 'budget_alert',
        title: alertItem.type === 'overall' ? 'Budget Alert' : 'Category Budget Alert',
        message: alertItem.message,
      });
    });
  }, [budget, fulfilledTimeStamp, isBudgetFocused, showNotification]);

  // Detect budget changes and show notification
  useEffect(() => {
    if (!budget || !previousBudget) {
      setPreviousBudget(budget ?? null);
      return;
    }

    // Only compare if both budgets have data
    if (!budget.hasBudget || !previousBudget.hasBudget) {
      setPreviousBudget(budget);
      return;
    }

    // Check if total budget increased
    if (budget.totalBudget > previousBudget.totalBudget) {
      showNotification({
        type: 'budget_alert',
        title: 'Budget Increased',
        message: `Your overall budget increased from ${formatBudgetCurrency(previousBudget.totalBudget)} to ${formatBudgetCurrency(budget.totalBudget)}`,
      });
    }

    // Check if any category budget increased
    budget.categories.forEach((category) => {
      const prevCategory = previousBudget.categories.find(
        (c) => c.name === category.name,
      );
      if (prevCategory && category.limit > prevCategory.limit) {
        showNotification({
          type: 'budget_alert',
          title: 'Category Budget Increased',
          message: `${formatBudgetCategory(category.name)} budget increased from ${formatBudgetCurrency(prevCategory.limit)} to ${formatBudgetCurrency(category.limit)}`,
        });
      }
    });

    setPreviousBudget(budget);
  }, [budget, previousBudget, showNotification]);

  const summaryItems: SummaryItem[] = [
    {
      label: 'Total Budget',
      value: formatBudgetCurrency(budget?.totalBudget || 0),
      progress: budget?.hasBudget ? 100 : 0,
      tone: 'safe',
    },
    {
      label: 'Spent',
      value: formatBudgetCurrency(budget?.spent || 0, {
        showSign: true,
        isExpense: true,
      }),
      progress: budget?.usagePercentage || 0,
      tone: getBudgetTone(budget?.usagePercentage || 0),
    },
    {
      label: 'Remaining',
      value: formatBudgetCurrency(budget?.remaining || 0),
      progress: budget?.hasBudget ? Math.max(100 - (budget?.usagePercentage || 0), 0) : 0,
      tone: getBudgetTone(budget?.usagePercentage || 0),
    },
    {
      label: 'Usage',
      value: `${Math.round(budget?.usagePercentage || 0)}%`,
      progress: budget?.usagePercentage || 0,
      tone: getBudgetTone(budget?.usagePercentage || 0),
    },
  ];

  const handleCategoryLimitChange = (category: string, value: string) => {
    setCategoryLimits((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const handleVoiceComplete = (data: any) => {
    const amount = Number(data?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showNotification({
        type: 'error',
        title: 'Voice Budget',
        message: 'Could not detect a valid amount from voice.',
      });
      return;
    }

    // Switch to Manual so the user can see and review the fields we just filled
    // from voice (in Voice mode the form inputs aren't visible).
    setBudgetMode('manual');

    const categoryValue = String(data?.category || '').toLowerCase();
    const matchedCategory = categories.find(
      (category) =>
        category.value.toLowerCase() === categoryValue ||
        category.label.toLowerCase() === categoryValue,
    );
    const nextLimits = { ...categoryLimits };

    if (matchedCategory) {
      nextLimits[matchedCategory.value] = amount.toString();
      setCategoryLimits(nextLimits);
      if (!Number.isFinite(Number(totalBudget)) || Number(totalBudget) < amount) {
        setTotalBudget(amount.toString());
      }
      showNotification({
        type: 'success',
        title: 'Budget Filled',
        message: `${matchedCategory.label} limit filled from voice.`,
      });
      return;
    }

    setTotalBudget(amount.toString());
    showNotification({
      type: 'success',
      title: 'Budget Filled',
      message: 'Total monthly budget filled from voice.',
    });
  };

  const handleSaveBudget = async () => {
    if (!Number.isFinite(totalBudgetNumber) || totalBudgetNumber <= 0) {
      showNotification({
        type: 'error',
        title: 'Invalid Budget',
        message: `Total budget must be greater than ${formatBudgetCurrency(0)}.`,
      });
      return;
    }

    if (hasCategoryLimitError) {
      showNotification({
        type: 'error',
        title: 'Invalid Category Limit',
        message: 'Category budget cannot exceed overall budget.',
      });
      return;
    }

    if (categoryLimitPayload.length === 0) {
      showNotification({
        type: 'error',
        title: 'Category Limits',
        message: 'Add at least one category limit.',
      });
      return;
    }

    if (categoryLimitSum > totalBudgetNumber) {
      showNotification({
        type: 'error',
        title: 'Invalid Totals',
        message: 'Category limits cannot exceed the total budget.',
      });
      return;
    }

    if ((budget?.spent || 0) > totalBudgetNumber) {
      showNotification({
        type: 'error',
        title: 'Budget Too Low',
        message: 'Your spending has already exceeded this budget amount.',
      });
      return;
    }

    setIsSaving(true);

    try {
      await upsertBudget({
        month,
        year,
        totalBudget: totalBudgetNumber,
        categoryLimits: categoryLimitPayload,
      }).unwrap();

      // Custom toast-style notification (no native Alert popup)
      showNotification({
        type: 'success',
        title: 'Budget Saved',
        message: 'Your budget was saved successfully.',
      });

      // Close editor and refresh
      setIsBudgetEditorVisible(false);
      refetch();
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Save Failed',
        message: getApiErrorMessage(error, 'Unable to save budget. Please try again.'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBudget = async () => {
    const confirmed = await confirm({
      title: 'Delete budget',
      message: 'Are you sure you want to delete this monthly budget?',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await deleteBudget({ month, year }).unwrap();
      showToast({ type: 'success', title: 'Budget deleted', message: 'Your monthly budget was removed.' });
      refetch();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Delete failed',
        message: getApiErrorMessage(error, 'Unable to delete budget.'),
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}>
        <View style={styles.contentHeader}>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.headerTitle, { color: themeColors.foreground }]}>Budget</Text>
            <Text style={[styles.headerSubtitle, { color: themeColors.mutedForeground }]} numberOfLines={1}>
              Track your monthly spending limits
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsMonthPickerVisible(true)}
            style={[styles.monthButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={15} color={themeColors.foreground} style={{ marginRight: 6 }} />
            <Text
              style={[styles.monthButtonText, { color: themeColors.foreground }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {selectedMonthLabel}
            </Text>
            <Ionicons name="chevron-down" size={13} color={themeColors.mutedForeground} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={[styles.infoCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.loadingText, { color: themeColors.mutedForeground }]}>Loading budget...</Text>
          </View>
        )}

        {isError && (
          <View style={[styles.infoCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.errorText, { color: themeColors.destructive }]}>Unable to load budget. Please try again.</Text>
          </View>
        )}

        {!isLoading && !isError && budget && (
          <>
            <View style={styles.summaryGrid}>
              {summaryItems.map((item) => (
                <View
                  key={item.label}
                  style={[styles.summaryCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                >
                  <Text style={[styles.summaryLabel, { color: themeColors.mutedForeground }]}>{item.label}</Text>
                  <Text style={[styles.summaryValue, { color: themeColors.foreground }]} numberOfLines={1} adjustsFontSizeToFit>{item.value}</Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(item.progress, 100)}%`,
                          backgroundColor: getToneColor(item.tone, themeColors),
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>

            {budget.hasBudget && (
              <View style={[styles.categorySummarySection, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <View style={styles.categorySummaryHeader}>
                  <Text style={[styles.sectionLabel, { color: themeColors.foreground }]}>Category Budgets</Text>
                  <Text style={[styles.sectionDescription, { color: themeColors.mutedForeground }]}>Track category distribution, limits, and usage.</Text>
                </View>
                <BudgetCategoryPie
                  categories={budget.categories}
                  totalSpent={budget.spent}
                  formatCategory={formatBudgetCategory}
                  getCategoryIcon={getCategoryIcon}
                />
              </View>
            )}

            {!budget.hasBudget ? (
              <View style={[styles.infoCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <View style={styles.emptyStateIcon}>
                  <Wallet size={20} color={themeColors.mutedForeground} />
                </View>
                <Text style={[styles.infoTitle, { color: themeColors.foreground }]}>No budget set for this month</Text>
                <Text style={[styles.infoDescription, { color: themeColors.mutedForeground }]}>Create a monthly budget and category limits to stay on track.</Text>
                {isCurrentMonth && (
                  <Button
                    style={styles.actionButton}
                    fullWidth={false}
                    onPress={() => setIsBudgetEditorVisible(true)}
                    icon={<Plus size={16} color={themeColors.primaryForeground} />}
                    label="Set Budget"
                  />
                )}
              </View>
            ) : (
              <View style={[styles.actionsRow, { borderColor: themeColors.border }]}>
                {isCurrentMonth ? (
                  <Button
                    style={styles.rowAction}
                    fullWidth={false}
                    onPress={() => setIsBudgetEditorVisible(true)}
                    label="Update Budget"
                  />
                ) : null}
                {isCurrentMonth && (
                  <Button
                    style={styles.rowAction}
                    fullWidth={false}
                    variant="destructive"
                    onPress={handleDeleteBudget}
                    icon={<Trash2 size={16} color={themeColors.destructiveForeground} />}
                    label="Delete Budget"
                  />
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={isMonthPickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsMonthPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={() => setIsMonthPickerVisible(false)}
          />
          <View style={[styles.pickerModal, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.modalHeaderInner}>
              <Text style={[styles.modalTitle, { color: themeColors.foreground }]}>Select month</Text>
              <TouchableOpacity onPress={() => setIsMonthPickerVisible(false)}>
                <X size={20} color={themeColors.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.monthOptionList}
              contentContainerStyle={{ paddingBottom: spacing.sm }}
              showsVerticalScrollIndicator={false}
            >
              {monthOptions.map((option) => {
                const isSelected = String(option.value) === selectedMonthValue;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.monthOptionRow,
                      isSelected && { backgroundColor: themeColors.secondary },
                    ]}
                    onPress={() => {
                      setSelectedMonthValue(String(option.value));
                      setIsMonthPickerVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.monthOptionText, { color: themeColors.foreground }]}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                    {isSelected && (
                      <Check size={18} color={themeColors.primary} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isBudgetEditorVisible}
        animationType="slide"
        onRequestClose={() => setIsBudgetEditorVisible(false)}
      >
        <KeyboardAvoidingView
          style={[styles.modalScreen, { backgroundColor: themeColors.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalHeader, { backgroundColor: themeColors.card, borderColor: themeColors.border, paddingTop: Math.max(insets.top, spacing.lg) }]}>
            <View>
              <Text style={[styles.modalTitle, { color: themeColors.foreground }]}> {budget?.hasBudget ? 'Update Budget' : 'Set Budget'}</Text>
              <Text style={[styles.modalDescription, { color: themeColors.mutedForeground }]}>Choose voice or manual budget entry.</Text>
            </View>
            <TouchableOpacity onPress={() => setIsBudgetEditorVisible(false)}>
              <X size={20} color={themeColors.foreground} />
            </TouchableOpacity>
          </View>

          <View style={[styles.modeSwitch, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            {(['voice', 'manual'] as BudgetMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setBudgetMode(mode)}
                style={[
                  styles.modeButton,
                  {
                    backgroundColor:
                      budgetMode === mode ? themeColors.primary : themeColors.background,
                    borderColor: themeColors.border,
                  },
                ]}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    {
                      color:
                        budgetMode === mode
                          ? themeColors.primaryForeground
                          : themeColors.foreground,
                    },
                  ]}
                >
                  {mode === 'voice' ? 'Voice' : 'Manual'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {budgetMode === 'voice' ? (
              <View style={styles.voiceSection}>
                <Text style={[styles.sectionLabel, { color: themeColors.foreground }]}>Voice Budget</Text>
                <Text style={[styles.sectionDescription, { color: themeColors.mutedForeground }]}>Record your monthly budget or category limit and we will fill the form for you.</Text>
                <VoiceRecorder
                  loadingChange={isVoiceProcessing}
                  onLoadingChange={setIsVoiceProcessing}
                  onVoiceComplete={handleVoiceComplete}
                />
              </View>
            ) : (
              <View style={styles.formSection}>
                <Text style={[styles.sectionLabel, { color: themeColors.foreground }]}>Total Monthly Budget</Text>
                <TextInput
                  value={totalBudget}
                  onChangeText={(value) => setTotalBudget(value.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={themeColors.mutedForeground}
                  style={[styles.input, { color: themeColors.foreground, borderColor: themeColors.border, backgroundColor: themeColors.card }]}
                />

                <View style={styles.categorySection}>
                  <Text style={[styles.sectionLabel, { color: themeColors.foreground }]}>Category Limits</Text>
                  <Text style={[styles.sectionDescription, { color: themeColors.mutedForeground }]}>Add limits for the categories you want to track.</Text>
                  {categories.map((category) => {
                    const categoryError =
                      categoryLimitErrors[category.value] ?? '';

                    return (
                      <View
                        key={category.value}
                        style={[styles.categoryRow, { borderColor: categoryError ? themeColors.destructive : themeColors.border }]}
                      >
                        <Text style={[styles.categoryLabel, { color: themeColors.foreground }]}>{category.label}</Text>
                        <TextInput
                          value={categoryLimits[category.value] ?? ''}
                          onChangeText={(value) =>
                            handleCategoryLimitChange(
                              category.value,
                              value.replace(/[^0-9.]/g, ''),
                            )
                          }
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                          placeholderTextColor={themeColors.mutedForeground}
                          style={[styles.categoryInput, { color: themeColors.foreground, borderColor: categoryError ? themeColors.destructive : themeColors.border, backgroundColor: themeColors.card }]}
                        />
                        {categoryError ? (
                          <Text style={[styles.fieldErrorText, { color: themeColors.destructive }]}>
                            {categoryError}
                          </Text>
                        ) : null}
                      </View>
                    );
                  })}

                  <Text style={[styles.sectionDescription, { color: themeColors.mutedForeground, marginTop: spacing.sm }]}>
                    Need another category? Add it in Account → Categories.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={[styles.modalFooter, { backgroundColor: themeColors.card, borderTopColor: themeColors.border }]}>
            <Button
              onPress={handleSaveBudget}
              loading={isSaving || isVoiceProcessing}
              loadingLabel="Saving…"
              disabled={hasCategoryLimitError}
              icon={<Plus size={16} color={themeColors.primaryForeground} />}
              label="Save Budget"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  monthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 150,
    flexShrink: 0,
    overflow: 'hidden',
    ...shadows.card,
  },
  monthButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  headerTextWrap: { flex: 1, minWidth: 0 },
  headerTitle: { fontFamily: fontFamily.bold, fontSize: 22, letterSpacing: -0.4 },
  headerSubtitle: { fontFamily: fontFamily.regular, fontSize: 13, marginTop: 2 },
  infoCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: cardRadius,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  loadingText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
  },
  errorText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryCard: {
    width: '48%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: cardRadius,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  summaryLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(120,120,128,0.16)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  emptyStateIcon: {
    marginBottom: spacing.md,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(120,120,128,0.12)',
    alignSelf: 'flex-start',
  },
  infoTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  infoDescription: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  actionButton: {
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.lg,
    marginTop: spacing.xs,
  },
  rowAction: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerModal: {
    width: '100%',
    padding: spacing.lg,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderWidth: 1,
    maxHeight: '55%',
  },
  modalOverlayTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalHeaderInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 17,
  },
  monthOptionList: {
    flexGrow: 0,
  },
  monthOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  monthOptionText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 15,
    marginRight: spacing.sm,
  },
  modalScreen: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalDescription: {
    marginTop: spacing.xs,
    fontFamily: fontFamily.regular,
    fontSize: 13,
  },
  modeSwitch: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modeButton: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
  },
  modalContent: {
    padding: spacing.lg,
  },
  voiceSection: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: spacing.lg,
  },
  formSection: {
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontFamily: fontFamily.medium,
    fontSize: 15,
    marginTop: spacing.sm,
  },
  categorySection: {
    marginBottom: spacing.md,
  },
  categorySummarySection: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: cardRadius,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  categorySummaryHeader: {
    marginBottom: spacing.md,
  },
  categorySummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  categoryAccentBar: {
    alignSelf: 'stretch',
    width: 4,
  },
  categorySummaryLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
    minWidth: 0,
  },
  categoryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  categorySummaryText: {
    flex: 1,
    minWidth: 0,
  },
  categorySummaryTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
  },
  categorySummaryValue: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
  },
  categorySummaryMeta: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  categorySummaryStats: {
    alignItems: 'flex-end',
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
    paddingLeft: spacing.xs,
    flexShrink: 0,
  },
  categoryRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  categoryLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  categoryInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginTop: spacing.xs,
    fontFamily: fontFamily.medium,
    fontSize: 15,
  },
  customCategoryRow: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  customCategoryInput: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginTop: spacing.xs,
    fontSize: fontSize.base,
    marginBottom: spacing.xs,
  },
  customOptionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  customOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addCategoryBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  fieldErrorText: {
    marginTop: spacing.xs,
    fontFamily: fontFamily.medium,
    fontSize: 11,
  },
  modalFooter: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

export default BudgetScreen;
