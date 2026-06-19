import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch as RNSwitch,
  Platform,
  Modal,
  KeyboardAvoidingView,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/NotificationContext";
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  fontFamily,
  shadows,
} from "../../theme/colors";
import {
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useGetSingleTransactionQuery,
  useAiScanReceiptMutation,
} from "../../features/transaction/transactionAPI";
import {
  useCreateCategoryMutation,
  useGetCategoriesQuery,
} from "../../features/category/categoryAPI";
import { useTypedSelector } from "../../store/hooks";
import { useGetSupportedCurrenciesQuery } from "../../features/currency/currencyAPI";
import {
  CATEGORIES,
  PAYMENT_METHODS,
  TRANSACTION_TYPE,
  TRANSACTION_FREQUENCY,
  FREQUENCY_OPTIONS,
} from "../../constants/transaction";
import { Picker } from "@react-native-picker/picker";
import { CurrencyPicker } from "../common";
import { ALL_CURRENCIES } from "../../constants/currencies";
import DateTimePicker from "@react-native-community/datetimepicker";

import { format as formatDate } from "date-fns";
import * as ImagePicker from "expo-image-picker";
import {
  Mic,
  ScanText,
  FileText,
  X,
  Calendar,
  Upload,
} from "lucide-react-native";
import VoiceRecorder from "./VoiceRecorder";

interface TransactionFormSheetProps {
  isVisible: boolean;
  onClose: () => void;
  transactionId?: string;
  isEdit?: boolean;
  initialMode?: "VOICE" | "SCAN" | "MANUAL";
  initialType?: "INCOME" | "EXPENSE";
}

export default function TransactionFormSheet({
  isVisible,
  onClose,
  transactionId,
  isEdit = false,
  initialMode = "VOICE",
  initialType = "EXPENSE",
}: TransactionFormSheetProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const user = useTypedSelector((state) => state.auth.user);
  const userBaseCurrency = user?.baseCurrency || "USD";

  // Form state
  const [title, setTitle] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState("USD");
  const [type, setType] = React.useState<"INCOME" | "EXPENSE">(
    TRANSACTION_TYPE.EXPENSE,
  );
  const [category, setCategory] = React.useState("");
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [newCategoryColor, setNewCategoryColor] = React.useState("#6B7280");
  const [saveCategoryPermanently, setSaveCategoryPermanently] =
    React.useState(true);
  const [isCreatingPersistentCategory, setIsCreatingPersistentCategory] =
    React.useState(false);

  const NEW_CATEGORY_KEY = "__new_category__";
  const [date, setDate] = React.useState(new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState("");
  const [isRecurring, setIsRecurring] = React.useState(false);
  const [frequency, setFrequency] = React.useState(
    TRANSACTION_FREQUENCY.MONTHLY,
  );
  const [description, setDescription] = React.useState("");

  // Dirty state: true when form differs from original transaction (edit mode)
  const [isDirty, setIsDirty] = React.useState(false);

  const { data: currenciesData } = useGetSupportedCurrenciesQuery();

  const currencyOptions = React.useMemo(() => {
    if (currenciesData?.currencies && currenciesData.currencies.length > 0) {
      return currenciesData.currencies;
    }
    return ALL_CURRENCIES;
  }, [currenciesData]);

  const selectedCurrencySymbol = React.useMemo(() => {
    const found = (currenciesData?.currencies || ALL_CURRENCIES).find(
      (c) => c.code.toUpperCase() === currency.toUpperCase(),
    );
    return found ? found.symbol : currency;
  }, [currenciesData, currency]);
  // AI Scan Receipt state
  const [receiptName, setReceiptName] =
    React.useState<string>("No file chosen");
  const [isScanning, setIsScanning] = React.useState(false);
  // Voice state
  const [mode, setMode] = React.useState<"VOICE" | "SCAN" | "MANUAL">(
    initialMode,
  );
  const [isVoiceProcessing, setIsVoiceProcessing] = React.useState(false);

  // Update mode when initialMode changes and set default currency
  React.useEffect(() => {
    if (isVisible) {
      setMode(initialMode);
      if (!isEdit) {
        setCurrency(userBaseCurrency);
        setType(initialType);
      }
    }
  }, [isVisible, initialMode, isEdit, userBaseCurrency, initialType]);

  // API hooks
  const { data: transactionData } = useGetSingleTransactionQuery(
    transactionId || "",
    {
      skip: !transactionId,
    },
  );
  const [createTransaction, { isLoading: isCreating }] =
    useCreateTransactionMutation();
  const [updateTransaction, { isLoading: isUpdating }] =
    useUpdateTransactionMutation();
  const [aiScanReceipt] = useAiScanReceiptMutation();

  const { data: categoriesResponse, isFetching: isFetchingCategories } =
    useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();

  const categoryOptions = React.useMemo(() => {
    const apiCategories =
      categoriesResponse?.data?.map((category) => ({
        value: category.name,
        label: category.name,
        isDefault: category.isDefault,
      })) ?? [];

    if (!apiCategories.length) {
      return CATEGORIES.map((cat) => ({
        value: cat.value,
        label: cat.label,
        isDefault: true,
      }));
    }

    return apiCategories.sort((a, b) => {
      if (a.isDefault === b.isDefault) return a.label.localeCompare(b.label);
      return a.isDefault ? -1 : 1;
    });
  }, [categoriesResponse]);

  const selectedCategoryOption = categoryOptions.find(
    (item) => item.value === category,
  );

  // Load existing transaction data for edit
  React.useEffect(() => {
    if (isEdit && transactionData?.transaction) {
      const tx = transactionData.transaction;
      // store original transaction for change-detection
      originalTransactionRef.current = tx;
      setTitle(tx.title);
      setAmount(
        tx.originalAmount != null
          ? tx.originalAmount.toString()
          : tx.amount.toString(),
      );
      setCurrency(tx.originalCurrency || userBaseCurrency);
      setType(tx.type);
      setCategory(tx.category);
      setDate(new Date(tx.date));
      setPaymentMethod(tx.paymentMethod);
      setIsRecurring(tx.isRecurring);
      setFrequency(
        (tx as any).recurringInterval || TRANSACTION_FREQUENCY.MONTHLY,
      );
      setDescription(tx.description || "");
      // ensure dirty flag resets after loading original transaction
      setTimeout(() => setIsDirty(false), 0);
    }
  }, [isEdit, transactionData, userBaseCurrency]);

  const originalTransactionRef = React.useRef<any>(null);

  const isSameTransaction = (existing: any, payload: any) => {
    if (!existing) return false;
    const existingAmount =
      existing.originalAmount != null ? Number(existing.originalAmount) : Number(existing.amount);
    const existingCurrency = existing.originalCurrency || existing.currency || undefined;
    const existingCategory = existing.category?.toLowerCase() || "";
    const existingDate = new Date(existing.date).toISOString();

    const payloadAmount = Number(payload.amount);
    const payloadCurrency = payload.currency || undefined;
    const payloadCategory = (payload.category || "").toLowerCase();
    const payloadDate = new Date(payload.date).toISOString();

    return (
      (existing.title || "") === (payload.title || "") &&
      existingAmount === payloadAmount &&
      (existingCurrency || undefined) === (payloadCurrency || undefined) &&
      existing.type === payload.type &&
      existingCategory === payloadCategory &&
      existingDate === payloadDate &&
      (existing.paymentMethod || "") === (payload.paymentMethod || "") &&
      Boolean(existing.isRecurring) === Boolean(payload.isRecurring) &&
      (existing.recurringInterval || null) === (payload.recurringInterval || null) &&
      (existing.description || "") === (payload.description || "")
    );
  };

  // Reset form
  const resetForm = () => {
    setTitle("");
    setAmount("");
    setCurrency(userBaseCurrency);
    setType(TRANSACTION_TYPE.EXPENSE);
    setCategory("");
    setDate(new Date());
    setPaymentMethod("");
    setIsRecurring(false);
    setFrequency(TRANSACTION_FREQUENCY.MONTHLY);
    setDescription("");
    setReceiptName("No file chosen");
    setIsScanning(false);
  };

  // Determine if current form values differ from the original transaction
  React.useEffect(() => {
    if (!isEdit || !originalTransactionRef.current) {
      // For create mode or when original not loaded, consider form as dirty
      setIsDirty(!isEdit);
      return;
    }

    const payloadForCompare = {
      title,
      amount: parseFloat(amount || "0"),
      currency: currency.trim() ? currency : undefined,
      type,
      category: category.trim().toLowerCase(),
      date: date.toISOString(),
      paymentMethod,
      isRecurring,
      recurringInterval: isRecurring ? frequency : null,
      description,
    };

    const existing = originalTransactionRef.current;
    const same = isSameTransaction(existing, payloadForCompare);
    setIsDirty(!same);
  }, [
    title,
    amount,
    currency,
    type,
    category,
    date,
    paymentMethod,
    isRecurring,
    frequency,
    description,
    isEdit,
    transactionData,
  ]);

  // Handle submit
  const handleSubmit = async () => {
    if (!title || !amount || !category || !paymentMethod) {
      showToast({ type: "warning", title: "Missing fields", message: "Please fill in all required fields." });
      return;
    }

    const resolvedCategory =
      category === NEW_CATEGORY_KEY ? newCategoryName.trim() : category.trim();

    if (!resolvedCategory) {
      alert("Please choose or enter a category");
      return;
    }

    if (category === NEW_CATEGORY_KEY && saveCategoryPermanently) {
      try {
        setIsCreatingPersistentCategory(true);
        await createCategory({
          name: resolvedCategory,
          color: newCategoryColor,
        }).unwrap();
      } catch (error: any) {
        alert(error?.data?.message || "Failed to save category permanently");
        return;
      } finally {
        setIsCreatingPersistentCategory(false);
      }
    }

    const payload = {
      title,
      amount: parseFloat(amount),
      currency: currency.trim() ? currency : undefined,
      type,
      category: resolvedCategory,
      date: date.toISOString(),
      paymentMethod,
      isRecurring,
      recurringInterval: isRecurring ? frequency : null,
      description,
    };
    try {
      if (isEdit && transactionId) {
        // prevent sending update when there are no changes
        const existing = originalTransactionRef.current;
        if (isSameTransaction(existing, payload)) {
          alert("No changes detected");
          onClose();
          return;
        }

        await updateTransaction({ id: transactionId, transaction: payload }).unwrap();
      } else {
        await createTransaction(payload).unwrap();
      }
      resetForm();
      onClose();
    } catch (error) {
      console.error("Failed to save transaction:", error);
      showToast({ type: "error", title: "Save failed", message: "Failed to save transaction." });
    }
  };

  const styles = createStyles(themeColors);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor: themeColors.background }}
        edges={["bottom"]}
      >
        <StatusBar
          barStyle={activeTheme === "dark" ? "light-content" : "dark-content"}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.lg) }]}>
            <View>
              <Text style={styles.headerTitle}>
                {isEdit ? "Edit Transaction" : "Add Transaction"}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isEdit
                  ? "Update your transaction details"
                  : "Choose how you want to add your transaction"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={themeColors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Tab Selector: AI Scan | Voice | Manual */}
          {!isEdit && (
            <View style={styles.tabsContainer}>
              <View style={styles.tabsBackground}>
                {(
                  [
                    { key: "SCAN", label: "AI Scan", Icon: ScanText },
                    { key: "VOICE", label: "Voice", Icon: Mic },
                    { key: "MANUAL", label: "Manual", Icon: FileText },
                  ] as const
                ).map((tab) => {
                  const IconComponent = tab.Icon;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      style={[styles.tab, mode === tab.key && styles.tabActive]}
                      onPress={() => setMode(tab.key)}
                      activeOpacity={0.7}
                    >
                      <IconComponent
                        size={16}
                        color={
                          mode === tab.key
                            ? themeColors.foreground
                            : themeColors.mutedForeground
                        }
                      />
                      <Text
                        style={[
                          styles.tabText,
                          mode === tab.key && styles.tabTextActive,
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Voice Recording */}
            {mode === "VOICE" && (
              <VoiceRecorder
                loadingChange={isVoiceProcessing}
                onLoadingChange={setIsVoiceProcessing}
                onVoiceComplete={(data) => {
                  console.log("onVoiceComplete triggered with data:", data);
                  // Map response data to form fields
                  if (data.title) {
                    console.log("Setting title to:", data.title);
                    setTitle(data.title);
                  }
                  if (data.amount != null) {
                    console.log("Setting amount to:", String(data.amount));
                    setAmount(String(data.amount));
                  }
                  if (data.currency) {
                    console.log("Setting currency to:", data.currency);
                    setCurrency(data.currency);
                  }
                  if (data.category) {
                    let cat = data.category.toLowerCase().trim();
                    if (cat === "dining & restaurants") cat = "dining";
                    if (cat === "housing & rent") cat = "housing";
                    console.log("Setting category to:", cat);
                    setCategory(cat);
                  }
                  if (data.paymentMethod) {
                    const pm = data.paymentMethod.toUpperCase();
                    console.log("Setting paymentMethod to:", pm);
                    setPaymentMethod(pm);
                  }
                  if (data.type) {
                    console.log("Setting type to:", data.type);
                    setType(data.type);
                  }
                  if (data.date) {
                    const d = new Date(data.date);
                    if (!isNaN(d.getTime())) {
                      console.log("Setting date to:", d);
                      setDate(d);
                    }
                  }
                  if (data.description) {
                    console.log("Setting description to:", data.description);
                    setDescription(data.description);
                  }
                }}
              />
            )}

            {/* AI Scan Receipt */}
            {mode === "SCAN" && (
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>AI Scan Receipt</Text>
                <View style={styles.uploadRow}>
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        setIsScanning(true);
                        const res = await ImagePicker.launchImageLibraryAsync({
                          mediaTypes: ImagePicker.MediaTypeOptions.Images,
                          quality: 0.8,
                        });
                        if (res.canceled || !res.assets?.length) {
                          setIsScanning(false);
                          return;
                        }
                        const asset = res.assets[0];
                        const uri = asset.uri;
                        const name = asset.fileName || "receipt.jpg";
                        const typeMime = asset.mimeType || "image/jpeg";
                        setReceiptName(name);
                        const form = new FormData();
                        // @ts-ignore
                        form.append("receipt", { uri, name, type: typeMime });
                        const result = await aiScanReceipt(
                          form as any,
                        ).unwrap();
                        const scanned = result?.data;
                        console.log("SCANNED.CATEGORY:", scanned.category);
                        if (scanned) {
                          if (scanned.title) setTitle(scanned.title);
                          setType(TRANSACTION_TYPE.EXPENSE);
                          if (scanned.paymentMethod) {
                            setPaymentMethod(
                              scanned.paymentMethod.toUpperCase(),
                            );
                          }
                          if (scanned.amount != null)
                            setAmount(String(scanned.amount));
                          if (scanned.currency) {
                            setCurrency(scanned.currency);
                          }
                          if (scanned.category) {
                            let cat = scanned.category.toLowerCase().trim();
                            if (cat === "dining & restaurants") cat = "dining";
                            if (cat === "housing & rent") cat = "housing";
                            setCategory(cat);
                          }
                          if (scanned.description)
                            setDescription(scanned.description);
                          if (scanned.date) {
                            const d = new Date(scanned.date);
                            if (!isNaN(d.getTime())) setDate(d);
                          }
                        }
                      } catch {
                        showToast({ type: "error", title: "Scan failed", message: "Failed to scan receipt." });
                      } finally {
                        setIsScanning(false);
                      }
                    }}
                    style={[
                      styles.scanIconBtn,
                      {
                        borderColor: themeColors.border,
                        backgroundColor: themeColors.background,
                      },
                    ]}
                    disabled={isScanning}
                  >
                    <ScanText size={20} color={themeColors.foreground} />
                  </TouchableOpacity>
                  <View
                    style={[
                      styles.fileBox,
                      {
                        borderColor: themeColors.border,
                        backgroundColor: themeColors.card,
                      },
                    ]}
                  >
                    <Text
                      style={{ color: themeColors.mutedForeground }}
                      numberOfLines={1}
                    >
                      {receiptName}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        setIsScanning(true);
                        const res = await ImagePicker.launchImageLibraryAsync({
                          mediaTypes: ImagePicker.MediaTypeOptions.Images,
                          quality: 0.8,
                        });
                        if (res.canceled || !res.assets?.length) {
                          setIsScanning(false);
                          return;
                        }
                        const asset = res.assets[0];
                        const uri = asset.uri;
                        const name = asset.fileName || "receipt.jpg";
                        const typeMime = asset.mimeType || "image/jpeg";
                        setReceiptName(name);

                        const form = new FormData();
                        // @ts-ignore - React Native FormData file
                        form.append("receipt", { uri, name, type: typeMime });
                        const result = await aiScanReceipt(
                          form as any,
                        ).unwrap();
                        const scanned = result?.data;
                        if (scanned) {
                          if (scanned.title) setTitle(scanned.title);
                          setType(TRANSACTION_TYPE.EXPENSE);
                          if (scanned.paymentMethod) {
                            setPaymentMethod(
                              scanned.paymentMethod.toUpperCase(),
                            );
                          }
                          if (scanned.amount != null)
                            setAmount(String(scanned.amount));
                          if (scanned.currency) {
                            setCurrency(scanned.currency);
                          }
                          if (scanned.category) {
                            let cat = scanned.category.toLowerCase().trim();
                            if (cat === "dining & restaurants") cat = "dining";
                            if (cat === "housing & rent") cat = "housing";
                            setCategory(cat);
                          }
                          if (scanned.description)
                            setDescription(scanned.description);
                          if (scanned.date) {
                            const d = new Date(scanned.date);
                            if (!isNaN(d.getTime())) setDate(d);
                          }
                        }
                      } catch (e) {
                        showToast({ type: "error", title: "Scan failed", message: "Failed to scan receipt." });
                      } finally {
                        setIsScanning(false);
                      }
                    }}
                    style={[
                      styles.chooseBtn,
                      { backgroundColor: themeColors.primary },
                    ]}
                    disabled={isScanning}
                  >
                    <Upload size={16} color="#ffffff" />
                    <Text style={{ color: "#ffffff", marginLeft: spacing.xs }}>
                      {isScanning ? "Scanning…" : "Choose File"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text
                  style={[
                    styles.helpText,
                    { color: themeColors.mutedForeground },
                  ]}
                >
                  JPG, PNG up to 5MB
                </Text>
              </View>
            )}

            {/* Transaction Type */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Transaction Type</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === TRANSACTION_TYPE.INCOME && styles.typeButtonActive,
                  ]}
                  onPress={() => setType(TRANSACTION_TYPE.INCOME)}
                  activeOpacity={0.7}
                  disabled={isScanning || isVoiceProcessing}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      type === TRANSACTION_TYPE.INCOME &&
                      styles.radioCircleActive,
                    ]}
                  >
                    {type === TRANSACTION_TYPE.INCOME && (
                      <View style={styles.radioCircleInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === TRANSACTION_TYPE.INCOME &&
                      styles.typeButtonTextActive,
                    ]}
                  >
                    Income
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === TRANSACTION_TYPE.EXPENSE &&
                    styles.typeButtonActive,
                  ]}
                  onPress={() => setType(TRANSACTION_TYPE.EXPENSE)}
                  activeOpacity={0.7}
                  disabled={isScanning || isVoiceProcessing}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      type === TRANSACTION_TYPE.EXPENSE &&
                      styles.radioCircleActive,
                    ]}
                  >
                    {type === TRANSACTION_TYPE.EXPENSE && (
                      <View style={styles.radioCircleInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === TRANSACTION_TYPE.EXPENSE &&
                      styles.typeButtonTextActive,
                    ]}
                  >
                    Expense
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Title */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Transaction title"
                placeholderTextColor={themeColors.mutedForeground}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Amount and Currency Row */}
            <View
              style={{
                flexDirection: "row",
                gap: spacing.md,
                marginBottom: spacing.md,
              }}
            >
              <View style={{ flex: 1.8 }}>
                <Text style={styles.label}>Amount *</Text>
                <View style={styles.amountContainer}>
                  <Text style={styles.currencySymbol}>
                    {selectedCurrencySymbol}
                  </Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor={themeColors.mutedForeground}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={{ flex: 1.2 }}>
                <CurrencyPicker
                  label="Currency"
                  value={currency}
                  onChange={setCurrency}
                  options={currencyOptions}
                />
              </View>
            </View>

            {/* Category */}
            {/* <View style={styles.fieldContainer}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={category}
                  onValueChange={setCategory}
                  style={styles.picker}
                  dropdownIconColor={themeColors.foreground}
                >
                  <Picker.Item label="Select a category" value="" />
                  {CATEGORIES.map((cat) => (
                    <Picker.Item
                      key={cat.value}
                      label={cat.label}
                      value={cat.value}
                    />
                  ))}
                </Picker>
              </View>
            </View> */}

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={category}
                  onValueChange={(value) => {
                    setCategory(value);
                    if (value !== NEW_CATEGORY_KEY) {
                      setNewCategoryName("");
                    }
                  }}
                  style={styles.picker}
                  dropdownIconColor={themeColors.foreground}
                >
                  <Picker.Item label="Select a category" value="" />
                  {categoryOptions.map((cat) => (
                    <Picker.Item
                      key={cat.value}
                      label={cat.label}
                      value={cat.value}
                    />
                  ))}
                  <Picker.Item
                    label="+ Add new category..."
                    value={NEW_CATEGORY_KEY}
                  />
                  {category &&
                    !selectedCategoryOption &&
                    category !== NEW_CATEGORY_KEY && (
                      <Picker.Item
                        key={category}
                        label={category}
                        value={category}
                      />
                    )}
                </Picker>
              </View>

              {(category === NEW_CATEGORY_KEY ||
                (!selectedCategoryOption && category)) && (
                <View style={styles.newCategorySection}>
                  <Text style={styles.label}>New category name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Freelance Supplies"
                    placeholderTextColor={themeColors.mutedForeground}
                    value={
                      category === NEW_CATEGORY_KEY ? newCategoryName : category
                    }
                    onChangeText={setNewCategoryName}
                  />

                  <Text style={[styles.label, { marginTop: spacing.md }]}>
                    Save category permanently?
                  </Text>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>
                      Save for future transactions
                    </Text>
                    <RNSwitch
                      value={saveCategoryPermanently}
                      onValueChange={setSaveCategoryPermanently}
                      trackColor={{
                        false: themeColors.muted,
                        true: themeColors.primary,
                      }}
                      thumbColor={themeColors.foreground}
                    />
                  </View>

                  {saveCategoryPermanently && (
                    <>
                      <Text style={styles.label}>Category color</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="#6B7280"
                        placeholderTextColor={themeColors.mutedForeground}
                        value={newCategoryColor}
                        onChangeText={setNewCategoryColor}
                      />
                      <Text style={styles.helpText}>
                        Optional color for the saved category.
                      </Text>
                    </>
                  )}
                </View>
              )}
            </View>

            {/* Date */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Date *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={16} color={themeColors.mutedForeground} />
                <Text style={styles.dateText}>
                  {formatDate(date, "MMMM do, yyyy")}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (selectedDate) {
                      setDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>

            {/* Payment Method */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Payment Method *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={paymentMethod}
                  onValueChange={setPaymentMethod}
                  style={styles.picker}
                  dropdownIconColor={themeColors.foreground}
                >
                  <Picker.Item label="Select payment method" value="" />
                  {PAYMENT_METHODS.map((method) => (
                    <Picker.Item
                      key={method.value}
                      label={method.label}
                      value={method.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Recurring Toggle */}
            <View style={[styles.fieldContainer, styles.recurringContainer]}>
              <View style={styles.recurringLeft}>
                <Text style={styles.label}>Recurring Transaction</Text>
                <Text style={styles.recurringSubtext}>
                  {isRecurring
                    ? "This will repeat automatically"
                    : "Set to repeat this transaction"}
                </Text>
              </View>
              <RNSwitch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{
                  false: themeColors.muted,
                  true: themeColors.primary,
                }}
                thumbColor={themeColors.foreground}
              />
            </View>

            {/* Frequency (if recurring) */}
            {isRecurring && (
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Frequency</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={frequency}
                    onValueChange={setFrequency}
                    style={styles.picker}
                    dropdownIconColor={themeColors.foreground}
                  >
                    {FREQUENCY_OPTIONS.map((freq) => (
                      <Picker.Item
                        key={freq.value}
                        label={freq.label}
                        value={freq.value}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            {/* Description */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add notes about this transaction"
                placeholderTextColor={themeColors.mutedForeground}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (isCreating || isUpdating || (isEdit && !isDirty)) &&
                styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isCreating || isUpdating || (isEdit && !isDirty)}
            >
              <Text style={styles.submitButtonText}>
                {isCreating || isUpdating
                  ? "Saving..."
                  : isEdit
                    ? "Update Transaction"
                    : "Add Transaction"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (theme: typeof colors.light) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    headerTitle: {
      fontFamily: fontFamily.semibold,
      fontSize: 18,
      color: theme.foreground,
      marginBottom: spacing.xs,
    },
    headerSubtitle: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      color: theme.mutedForeground,
    },
    closeButton: {
      padding: spacing.xs,
    },
    tabsContainer: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    tabsBackground: {
      flexDirection: "row",
      backgroundColor: theme.muted,
      borderRadius: borderRadius.full,
      padding: spacing.xs,
      gap: spacing.xs,
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.full,
    },
    tabActive: {
      backgroundColor: theme.background,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    tabText: {
      fontFamily: fontFamily.medium,
      fontSize: 12,
      color: theme.mutedForeground,
    },
    tabTextActive: {
      color: theme.foreground,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl * 2,
    },
    uploadRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    fileBox: {
      flex: 1,
      borderWidth: 1,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
    },
    scanIconBtn: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderRadius: borderRadius.md,
    },
    chooseBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    helpText: {
      fontFamily: fontFamily.regular,
      fontSize: 11,
      marginTop: spacing.xs,
      color: theme.mutedForeground,
    },
    fieldContainer: {
      marginBottom: spacing.md,
    },
    label: {
      fontFamily: fontFamily.medium,
      fontSize: 13,
      color: theme.foreground,
      marginBottom: spacing.sm,
    },
    input: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: borderRadius.xl,
      padding: spacing.md,
      fontFamily: fontFamily.regular,
      fontSize: 14,
      color: theme.foreground,
    },
    textArea: {
      height: 100,
      paddingTop: spacing.md,
    },
    typeSelector: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    typeButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: borderRadius.xl,
      padding: spacing.md,
      paddingVertical: spacing.sm + 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
      elevation: 1,
    },
    typeButtonActive: {
      borderColor: theme.primary,
      borderWidth: 1.5,
    },
    radioCircle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background,
    },
    radioCircleActive: {
      borderColor: theme.primary,
    },
    radioCircleInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.primary,
    },
    typeButtonText: {
      fontFamily: fontFamily.regular,
      fontSize: 14,
      color: theme.foreground,
    },
    typeButtonTextActive: {
      fontFamily: fontFamily.medium,
      color: theme.foreground,
    },
    amountContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.md,
    },
    currencySymbol: {
      fontFamily: fontFamily.semibold,
      fontSize: 16,
      color: theme.foreground,
      marginRight: spacing.xs,
    },
    amountInput: {
      flex: 1,
      padding: spacing.md,
      fontFamily: fontFamily.medium,
      fontSize: 15,
      color: theme.foreground,
    },
    pickerContainer: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: borderRadius.xl,
      overflow: "hidden",
    },
    picker: {
      fontFamily: fontFamily.regular,
      color: theme.foreground,
    },
    segmentRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    segmentBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
      paddingVertical: spacing.sm + 2,
      borderRadius: borderRadius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentBtnActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    segmentText: {
      color: theme.foreground,
      fontFamily: fontFamily.regular,
      fontSize: 13,
    },
    segmentTextActive: {
      color: "#ffffff",
      fontFamily: fontFamily.medium,
    },
    dateButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: borderRadius.xl,
      padding: spacing.md,
    },
    dateText: {
      fontFamily: fontFamily.regular,
      fontSize: 14,
      color: theme.foreground,
    },
    recurringContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: borderRadius.xl,
      padding: spacing.md,
    },
    recurringLeft: {
      flex: 1,
    },
    recurringSubtext: {
      fontFamily: fontFamily.regular,
      fontSize: 11,
      color: theme.mutedForeground,
      marginTop: spacing.xs,
    },
    newCategorySection: {
      marginTop: spacing.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: borderRadius.md,
      backgroundColor: theme.background,
    },

    switchRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: spacing.sm,
    },

    switchLabel: {
      fontSize: fontSize.sm,
      color: theme.foreground,
    },
    submitButton: {
      backgroundColor: theme.primary,
      borderRadius: borderRadius.full,
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.lg,
      alignItems: "center",
      justifyContent: "center",
      marginTop: spacing.lg,
      marginBottom: spacing.xl,
      ...shadows.md,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      fontFamily: fontFamily.semibold,
      fontSize: 15,
      color: "#ffffff",
    },
  });
