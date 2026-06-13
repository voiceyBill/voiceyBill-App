import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
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
import { Picker } from '@react-native-picker/picker';
import {
  Car,
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
import { useNotification } from '../../context/NotificationContext';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  spacing,
} from '../../theme/colors';
import { CATEGORIES } from '../../constants/transaction';
import { formatCurrency } from '../../lib/formatCurrency';
import {
  useDeleteBudgetMutation,
  useGetBudgetSummaryQuery,
  useUpsertBudgetMutation,
} from '../../features/budget/budgetAPI';
import { useGetSupportedCurrenciesQuery } from '../../features/currency/currencyAPI';
import { useTypedSelector } from '../../store/hooks';
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

const formatBudgetCategory = (name: string) => {
  const category = CATEGORIES.find((item) => item.value === name);
  return category ? category.label : name;
};

const getCategoryIcon = (name: string) => categoryIcons[name] ?? PiggyBank;

const formatBudgetCurrency = (
  value: number,
  currency: string = 'USD',
  options: Parameters<typeof formatCurrency>[1] = {},
) => formatCurrency(Math.round(value), { ...options, currency, decimalPlaces: 0 });

const parseBudgetAmount = (value: string) => {
  const amount = Number(String(value || '').replace(/,/g, ''));
  return Number.isFinite(amount) ? amount : 0;
};

const BudgetScreen = () => {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { showNotification } = useNotification();
  const isBudgetFocused = useIsFocused();
  const { user } = useTypedSelector((state) => state.auth);
  const { data: currencyData } = useGetSupportedCurrenciesQuery();
  const baseCurrency = user?.baseCurrency || 'USD';
  const currencySymbol = currencyData?.currencies?.find(
    (c) => c.code === baseCurrency
  )?.symbol ?? '$';
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
    () =>
      CATEGORIES.reduce((acc, category) => {
        acc[category.value] = '';
        return acc;
      }, {} as Record<string, string>),
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
    setCategoryLimits(
      CATEGORIES.reduce((acc, category) => {
        const existing = budget?.categories.find(
          (item) => item.name === category.value,
        );
        acc[category.value] = existing?.limit
          ? existing.limit.toString()
          : '';
        return acc;
      }, {} as Record<string, string>),
    );
  }, [budget, isBudgetEditorVisible]);

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
        message: `Your overall budget increased from ${formatBudgetCurrency(previousBudget.totalBudget, baseCurrency)} to ${formatBudgetCurrency(budget.totalBudget, baseCurrency)}`,
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
          message: `${formatBudgetCategory(category.name)} budget increased from ${formatBudgetCurrency(prevCategory.limit, baseCurrency)} to ${formatBudgetCurrency(category.limit, baseCurrency)}`,
        });
      }
    });

    setPreviousBudget(budget);
  }, [budget, previousBudget, showNotification]);

  const summaryItems: SummaryItem[] = [
    {
      label: 'Total Budget',
      value: formatBudgetCurrency(budget?.totalBudget || 0, baseCurrency),
      progress: budget?.hasBudget ? 100 : 0,
      tone: 'safe',
    },
    {
      label: 'Spent',
      value: formatBudgetCurrency(budget?.spent || 0, baseCurrency, {
        showSign: true,
        isExpense: true,
      }),
      progress: budget?.usagePercentage || 0,
      tone: getBudgetTone(budget?.usagePercentage || 0),
    },
    {
      label: 'Remaining',
      value: formatBudgetCurrency(budget?.remaining || 0, baseCurrency),
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

    const categoryValue = String(data?.category || '').toLowerCase();
    const matchedCategory = CATEGORIES.find(
      (category) =>
        category.value === categoryValue ||
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
        message: `Total budget must be greater than ${currencySymbol}0.`,
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

      showNotification({
        type: 'success',
        title: 'Budget Saved',
        message: 'Your budget was saved successfully.',
      });
      setIsBudgetEditorVisible(false);
      refetch();
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Save Failed',
        message: error?.data?.message || 'Unable to save budget. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBudget = () => {
    Alert.alert(
      'Delete budget',
      'Are you sure you want to delete this monthly budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBudget({ month, year }).unwrap();
              Alert.alert('Budget deleted', 'Budget deleted successfully.');
              refetch();
            } catch (error: any) {
              Alert.alert(
                'Delete failed',
                error?.data?.message || 'Unable to delete budget.',
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: themeColors.foreground }]}>Budget</Text>
          <Text style={[styles.subtitle, { color: themeColors.mutedForeground }]}>Manage monthly limits and spending.</Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsMonthPickerVisible(true)}
          style={[styles.monthButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.monthButtonText, { color: themeColors.foreground }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {selectedMonthLabel}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
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
                  <Text style={[styles.summaryValue, { color: themeColors.foreground }]}>{item.value}</Text>
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

            {budget.hasBudget && budget.categories.length > 0 && (
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
                  baseCurrency={baseCurrency}
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
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: themeColors.primary }]}
                    onPress={() => setIsBudgetEditorVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Plus size={16} color={themeColors.primaryForeground} />
                    <Text style={[styles.actionButtonText, { color: themeColors.primaryForeground }]}>Set Budget</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={[styles.actionsRow, { borderColor: themeColors.border }]}>
                {isCurrentMonth ? (
                  <TouchableOpacity
                    style={[styles.primaryAction, { backgroundColor: themeColors.primary }]}
                    onPress={() => setIsBudgetEditorVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.primaryActionText, { color: themeColors.primaryForeground }]}>Update Budget</Text>
                  </TouchableOpacity>
                ) : null}
                {isCurrentMonth && (
                  <TouchableOpacity
                    style={[styles.destructiveAction, { backgroundColor: themeColors.destructive }]}
                    onPress={handleDeleteBudget}
                    activeOpacity={0.85}
                  >
                    <Trash2 size={16} color={themeColors.destructiveForeground} />
                    <Text style={[styles.destructiveActionText, { color: themeColors.destructiveForeground }]}>Delete Budget</Text>
                  </TouchableOpacity>
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
            <Picker
              selectedValue={selectedMonthValue}
              onValueChange={(value) => {
                setSelectedMonthValue(String(value));
                setIsMonthPickerVisible(false);
              }}
            >
              {monthOptions.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
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
          <View style={[styles.modalHeader, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
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
                  placeholder={`${currencySymbol}0.00`}
                  placeholderTextColor={themeColors.mutedForeground}
                  style={[styles.input, { color: themeColors.foreground, borderColor: themeColors.border, backgroundColor: themeColors.card }]}
                />

                <View style={styles.categorySection}>
                  <Text style={[styles.sectionLabel, { color: themeColors.foreground }]}>Category Limits</Text>
                  <Text style={[styles.sectionDescription, { color: themeColors.mutedForeground }]}>Add limits for the categories you want to track.</Text>
                  {CATEGORIES.map((category) => {
                    const categoryError = categoryLimitErrors[category.value] ?? '';

                    return (
                      <View
                        key={category.value}
                        style={[styles.categoryRow, { borderColor: categoryError ? themeColors.destructive : themeColors.border }]}
                      >
                        <Text style={[styles.categoryLabel, { color: themeColors.foreground }]}>{category.label}</Text>
                        <TextInput
                          value={categoryLimits[category.value]}
                          onChangeText={(value) =>
                            handleCategoryLimitChange(
                              category.value,
                              value.replace(/[^0-9.]/g, ''),
                            )
                          }
                          keyboardType="decimal-pad"
                          placeholder={`${currencySymbol}0.00`}
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
                </View>
              </View>
            )}
          </ScrollView>

          <View style={[styles.modalFooter, { backgroundColor: themeColors.card, borderTopColor: themeColors.border }]}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: themeColors.primary,
                  opacity: hasCategoryLimitError ? 0.6 : 1,
                },
              ]}
              onPress={handleSaveBudget}
              disabled={isSaving || isVoiceProcessing || hasCategoryLimitError}
              activeOpacity={0.85}
            >
              <Plus size={16} color={themeColors.primaryForeground} />
              <Text style={[styles.saveButtonText, { color: themeColors.primaryForeground }]}>Save Budget</Text>
            </TouchableOpacity>
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
  header: {
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
  },
  monthButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    maxWidth: 140,
    minWidth: 110,
    alignSelf: 'flex-start',
    marginLeft: spacing.xs,
    overflow: 'hidden',
  },
  monthButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  loadingText: {
    fontSize: fontSize.base,
  },
  errorText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  summaryCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  emptyStateIcon: {
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  infoTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  infoDescription: {
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginLeft: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: spacing.lg,
  },
  primaryAction: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  primaryActionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  destructiveAction: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  destructiveActionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginLeft: spacing.xs,
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
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  modalScreen: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  modalDescription: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
  },
  modeSwitch: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  modeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  modeButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  modalContent: {
    padding: spacing.lg,
  },
  voiceSection: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: fontSize.xs,
    marginBottom: spacing.lg,
  },
  formSection: {
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    fontSize: fontSize.base,
    marginTop: spacing.sm,
  },
  categorySection: {
    marginBottom: spacing.md,
  },
  categorySummarySection: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  categorySummaryHeader: {
    marginBottom: spacing.sm,
  },
  categorySummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
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
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  categorySummaryValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  categorySummaryMeta: {
    fontSize: fontSize.xs,
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
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  categoryInput: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginTop: spacing.xs,
    fontSize: fontSize.base,
  },
  fieldErrorText: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  modalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  saveButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginLeft: spacing.xs,
  },
});

export default BudgetScreen;
