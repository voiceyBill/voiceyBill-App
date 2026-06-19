import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp } from "@react-navigation/native";
import {
  useGetAllTransactionsQuery,
  useGetSingleTransactionQuery,
  useDeleteTransactionMutation,
  useDuplicateTransactionMutation,
  useBulkDeleteTransactionMutation,
  useBulkImportTransactionMutation,
} from "../../features/transaction/transactionAPI";
import { useTheme } from "../../context/ThemeContext";
import { useVoiceRecording } from "../../context/VoiceRecordingContext";
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadows,
  fontFamily,
} from "../../theme/colors";
import { Transaction } from "../../types/transaction";
import TransactionFormSheet from "../../components/transaction/TransactionFormSheet";
import ActionSheet from "../../components/common/ActionSheet";
import { useToast } from "../../context/NotificationContext";
import { useConfirm } from "../../context/ConfirmContext";
import { TRANSACTION_TYPE } from "../../constants/transaction";
import { MainTabParamList } from "../../navigation/MainNavigator";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { format } from "date-fns";
import { formatCurrency } from "../../lib/formatCurrency";
import { getCategoryVisual } from "../../lib/categoryVisuals";
import { useTypedSelector } from "../../store/hooks";
import { Ionicons } from "@expo/vector-icons";
import {
  Search,
  Filter,
  Plus,
  Upload,
  MoreVertical,
  Trash2,
  X,
  CircleDot,
} from "lucide-react-native";

type FilterType = "ALL" | "INCOME" | "EXPENSE";
type RecurringFilter = "ALL" | "RECURRING" | "NON_RECURRING";
type RecurringStatus = "RECURRING" | "NON_RECURRING" | undefined;

type TransactionsScreenRouteProp = RouteProp<MainTabParamList, "Transactions">;

interface TransactionsScreenProps {
  route?: TransactionsScreenRouteProp;
}

export default function TransactionsScreen({ route }: TransactionsScreenProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const { voiceData, setVoiceData } = useVoiceRecording();

  const user = useTypedSelector((state) => state.auth.user);
  const baseCurrency = user?.baseCurrency || "USD";

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState(search);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [typeFilter, setTypeFilter] = useState<FilterType>("ALL");
  const [recurringFilter, setRecurringFilter] =
    useState<RecurringFilter>("ALL");
  const [showFormSheet, setShowFormSheet] = useState(false);
  const [initialMode, setInitialMode] = useState<"VOICE" | "SCAN" | "MANUAL">(
    "VOICE",
  );
  const [editingTransactionId, setEditingTransactionId] = useState<
    string | undefined
  >();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showRowsModal, setShowRowsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [actionMenuItem, setActionMenuItem] = useState<Transaction | null>(null);
  const [detailsTransactionId, setDetailsTransactionId] = useState<
    string | null
  >(null);

  const typeOptions: { value: FilterType; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "INCOME", label: "Income" },
    { value: "EXPENSE", label: "Expense" },
  ];
  const frequencyOptions: { value: RecurringFilter; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "RECURRING", label: "Recurring" },
    { value: "NON_RECURRING", label: "Non-recurring" },
  ];

  const lastVoiceModeTs = React.useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Handle voice mode from navigation — param is a timestamp so it changes every press
  useEffect(() => {
    const ts = route?.params?.openVoiceMode;
    if (ts && ts !== lastVoiceModeTs.current) {
      lastVoiceModeTs.current = ts;
      setInitialMode("VOICE");
      setShowFormSheet(true);
    }
  }, [route?.params?.openVoiceMode]);

  // Listen for voice data from context
  useEffect(() => {
    if (voiceData) {
      setShowFormSheet(true);
      setVoiceData(null);
    }
  }, [voiceData]);

  const { data, isLoading, refetch } = useGetAllTransactionsQuery({
    keyword: debounced || undefined,
    pageNumber: page,
    pageSize: pageSize,
    type: typeFilter !== "ALL" ? typeFilter : undefined,
    recurringStatus:
      recurringFilter !== "ALL"
        ? (recurringFilter as RecurringStatus)
        : undefined,
  });

  const [deleteTransaction] = useDeleteTransactionMutation();
  const [duplicateTransaction] = useDuplicateTransactionMutation();
  const [bulkDelete, { isLoading: isBulkDeleting }] =
    useBulkDeleteTransactionMutation();
  const [bulkImport, { isLoading: isBulkImporting }] =
    useBulkImportTransactionMutation();

  const {
    data: detailsData,
    isLoading: isDetailsLoading,
    error: detailsError,
    refetch: refetchDetails,
  } = useGetSingleTransactionQuery(detailsTransactionId || "", {
    skip: !detailsTransactionId,
  });

  useEffect(() => {
    // clear selections when page or page size changes
    setSelectedIds(new Set());
  }, [page, pageSize, data?.transactions?.length]);

  useEffect(() => {
    if (showDetailsSheet && detailsTransactionId) {
      refetchDetails();
    }
  }, [showDetailsSheet, detailsTransactionId, refetchDetails]);

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete transaction",
      message: "Are you sure you want to delete this transaction?",
      confirmText: "Delete",
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await deleteTransaction(id).unwrap();
      showToast({ type: "success", title: "Deleted", message: "Transaction removed." });
      refetch();
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      showToast({ type: "error", title: "Error", message: "Failed to delete transaction." });
    }
  };

  const handleEdit = (id: string) => {
    setEditingTransactionId(id);
    setShowFormSheet(true);
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateTransaction(id).unwrap();
      refetch();
      showToast({ type: "success", title: "Duplicated", message: "Transaction duplicated successfully." });
    } catch (error) {
      console.error("Failed to duplicate transaction:", error);
      showToast({ type: "error", title: "Error", message: "Failed to duplicate transaction." });
    }
  };

  const handleAddNew = () => {
    setEditingTransactionId(undefined);
    setShowFormSheet(true);
  };

  const handleCloseForm = () => {
    setShowFormSheet(false);
    setEditingTransactionId(undefined);
    setInitialMode("MANUAL");
    refetch();
  };

  const handleOpenDetails = (id: string) => {
    setDetailsTransactionId(id);
    setShowDetailsSheet(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsSheet(false);
    setDetailsTransactionId(null);
  };

  const showActionMenu = (item: Transaction) => {
    setActionMenuItem(item);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setSearch("");
    setDebounced("");
    setTypeFilter("ALL");
    setRecurringFilter("ALL");
    setPage(1);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0 || isBulkDeleting) return;
    const confirmed = await confirm({
      title: "Delete selected",
      message: `Delete ${selectedIds.size} selected transaction(s)?`,
      confirmText: "Delete",
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await bulkDelete(Array.from(selectedIds)).unwrap();
      setSelectedIds(new Set());
      showToast({ type: "success", title: "Deleted", message: "Selected transactions removed." });
      refetch();
    } catch {
      showToast({ type: "error", title: "Error", message: "Failed to delete selected transactions." });
    }
  };

  const handleBulkImport = async () => {
    if (isBulkImporting) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json"],
      });
      if (result.canceled || !result.assets?.length) return;
      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) {
        showToast({ type: "error", title: "Invalid file", message: "Expected a JSON array of transactions." });
        return;
      }
      await bulkImport({ transactions: parsed }).unwrap();
      showToast({ type: "success", title: "Imported", message: "Transactions imported successfully." });
      refetch();
    } catch {
      showToast({ type: "error", title: "Import failed", message: "Could not import transactions." });
    }
  };

  const styles = createStyles(themeColors);

  const totalPages = data?.pagination?.totalPages || 0;
  const totalCount = data?.pagination?.totalCount || 0;
  const items = data?.transactions || [];
  const showingFrom = items.length ? (page - 1) * pageSize + 1 : 0;
  const showingTo = items.length ? Math.min(page * pageSize, totalCount) : 0;

  const hasActiveFilters =
    search || typeFilter !== "ALL" || recurringFilter !== "ALL";
  const activeFiltersCount = [
    typeFilter !== "ALL",
    recurringFilter !== "ALL",
  ].filter(Boolean).length;

  const formatLabel = (value?: string) =>
    value
      ? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Not set";

  const formatPaymentMethod = (method: string) => formatLabel(method);

  const selectedTransaction =
    detailsData?.transaction ||
    items.find((tx) => tx._id === detailsTransactionId);

  const selectedAmountColor =
    selectedTransaction?.type === TRANSACTION_TYPE.INCOME
      ? themeColors.incomeText
      : themeColors.expenseText;

  const selectedTypeLabel =
    selectedTransaction?.type === TRANSACTION_TYPE.INCOME
      ? "Income"
      : "Expense";

  const selectedRecurringLabel = selectedTransaction
    ? selectedTransaction.isRecurring
      ? selectedTransaction.recurringFrequency
        ? `Recurring (${formatLabel(selectedTransaction.recurringFrequency)})`
        : "Recurring"
      : "Non-recurring"
    : "Not set";

  // Render transaction card
  const renderTransactionCard = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === TRANSACTION_TYPE.INCOME;
    const selected = selectedIds.has(item._id);
    const isRecurring = item.isRecurring;
    const accentColor = isIncome
      ? themeColors.incomeText
      : themeColors.expenseText;
    const visual = getCategoryVisual(item.category);

    const metaLine1Parts = [
      formatLabel(item.category),
      format(new Date(item.date), "MMM d, yyyy"),
    ];
    const metaLine2Parts: string[] = [];
    if (item.paymentMethod)
      metaLine2Parts.push(formatPaymentMethod(item.paymentMethod));
    if (isRecurring)
      metaLine2Parts.push(item.recurringFrequency || "Recurring");

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleOpenDetails(item._id)}
        onLongPress={() => showActionMenu(item)}
        style={[
          styles.transactionCard,
          {
            backgroundColor: themeColors.card,
            borderColor: selected ? themeColors.primary : themeColors.border,
          },
        ]}
      >
        {/* Card body */}
        <View style={styles.cardContent}>
          {/* Left: Icon + Info */}
          <View style={styles.cardLeft}>
            <TouchableOpacity
              onPress={() => toggleSelect(item._id)}
              activeOpacity={0.7}
              style={[
                styles.iconCircle,
                { backgroundColor: selected ? themeColors.primary : visual.bgColor },
              ]}
            >
              {selected ? (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={themeColors.primaryForeground}
                />
              ) : (
                <Ionicons name={visual.icon} size={20} color={visual.color} />
              )}
            </TouchableOpacity>

            <View style={styles.infoColumn}>
              <Text
                style={[styles.cardTitle, { color: themeColors.foreground }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.metaText,
                  { color: themeColors.mutedForeground },
                ]}
                numberOfLines={1}
              >
                {metaLine1Parts.join(" · ")}
              </Text>
              {metaLine2Parts.length > 0 && (
                <Text
                  style={[
                    styles.metaText,
                    { color: themeColors.mutedForeground },
                  ]}
                  numberOfLines={1}
                >
                  {metaLine2Parts.join(" · ")}
                </Text>
              )}
            </View>
          </View>

          {/* Right: Amount + Actions */}
          <View style={styles.cardRight}>
            <Text
              style={[styles.cardAmount, { color: accentColor }]}
              numberOfLines={1}
            >
              {formatCurrency(item.amount, {
                currency: item.baseCurrencyAtTime || baseCurrency,
                showSign: true,
                isExpense: !isIncome,
              })}
            </Text>
            <TouchableOpacity
              onPress={() => showActionMenu(item)}
              style={styles.moreButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MoreVertical size={18} color={themeColors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Content header */}
      <View style={styles.contentHeader}>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: themeColors.foreground }]}>Transactions</Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.mutedForeground }]} numberOfLines={1}>
            {totalCount > 0 ? `${totalCount} total` : "All your activity"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleBulkImport}
          style={[styles.headerIconBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
          disabled={isBulkImporting}
          activeOpacity={0.7}
        >
          <Upload size={18} color={themeColors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <View
            style={[
              styles.searchBox,
              {
                flex: 1,
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
          >
            <Search size={18} color={themeColors.mutedForeground} />
            <TextInput
              placeholder="Search transactions..."
              placeholderTextColor={themeColors.mutedForeground}
              value={search}
              onChangeText={setSearch}
              style={[styles.searchInput, { color: themeColors.foreground }]}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch("")}>
                <X size={18} color={themeColors.mutedForeground} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={[
            styles.filterButton,
            {
              backgroundColor: hasActiveFilters
                ? themeColors.primary
                : themeColors.card,
              borderColor: hasActiveFilters
                ? themeColors.primary
                : themeColors.border,
            },
          ]}
        >
          <Filter
            size={16}
            color={
              hasActiveFilters
                ? themeColors.primaryForeground
                : themeColors.foreground
            }
          />
          <Text
            style={[
              styles.filterButtonText,
              {
                color: hasActiveFilters
                  ? themeColors.primaryForeground
                  : themeColors.foreground,
              },
            ]}
          >
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Text>
        </TouchableOpacity>

        {hasActiveFilters && (
          <TouchableOpacity onPress={clearFilters} style={styles.resetButton}>
            <X size={14} color={themeColors.mutedForeground} />
            <Text
              style={[
                styles.resetButtonText,
                { color: themeColors.mutedForeground },
              ]}
            >
              Reset
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Expanded Filters */}
      {showFilters && (
        <View
          style={[
            styles.filtersPanel,
            {
              backgroundColor: themeColors.card,
              borderColor: themeColors.border,
            },
          ]}
        >
          <View style={styles.filterGroup}>
            <Text
              style={[
                styles.filterGroupLabel,
                { color: themeColors.mutedForeground },
              ]}
            >
              Type
            </Text>
            <View style={styles.pillRow}>
              {typeOptions.map(({ value, label }) => {
                const active = typeFilter === value;
                return (
                  <TouchableOpacity
                    key={value}
                    onPress={() => {
                      setTypeFilter(value);
                      setPage(1);
                    }}
                    activeOpacity={0.7}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: active
                          ? themeColors.primary
                          : themeColors.muted,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        {
                          color: active
                            ? themeColors.primaryForeground
                            : themeColors.foreground,
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.filterGroup}>
            <Text
              style={[
                styles.filterGroupLabel,
                { color: themeColors.mutedForeground },
              ]}
            >
              Frequency
            </Text>
            <View style={styles.pillRow}>
              {frequencyOptions.map(({ value, label }) => {
                const active = recurringFilter === value;
                return (
                  <TouchableOpacity
                    key={value}
                    onPress={() => {
                      setRecurringFilter(value);
                      setPage(1);
                    }}
                    activeOpacity={0.7}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: active
                          ? themeColors.primary
                          : themeColors.muted,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        {
                          color: active
                            ? themeColors.primaryForeground
                            : themeColors.foreground,
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <View
          style={[
            styles.bulkActionsBar,
            { backgroundColor: themeColors.primary },
          ]}
        >
          <Text
            style={[
              styles.bulkActionsText,
              { color: themeColors.primaryForeground },
            ]}
          >
            {selectedIds.size} selected
          </Text>
          <TouchableOpacity
            onPress={handleBulkDelete}
            style={[
              styles.bulkDeleteButton,
              { backgroundColor: themeColors.destructive },
            ]}
            disabled={isBulkDeleting}
          >
            <Trash2 size={16} color={themeColors.primaryForeground} />
            <Text
              style={[
                styles.bulkDeleteText,
                { color: themeColors.primaryForeground },
              ]}
            >
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Transaction List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={renderTransactionCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <CircleDot
              size={48}
              color={themeColors.mutedForeground}
              opacity={0.5}
            />
            <Text
              style={[styles.emptyText, { color: themeColors.mutedForeground }]}
            >
              No transactions found
            </Text>
          </View>
        }
      />

      {/* Pagination Footer */}
      <View
        style={[
          styles.footerBar,
          {
            backgroundColor: themeColors.card,
            borderTopColor: themeColors.border,
          },
        ]}
      >
        <View style={styles.footerLeft}>
          <Text
            style={[styles.footerText, { color: themeColors.mutedForeground }]}
          >
            Rows per page
          </Text>
          <TouchableOpacity
            onPress={() => setShowRowsModal(true)}
            style={[styles.footerButton, { borderColor: themeColors.border }]}
          >
            <Text
              style={[
                styles.footerButtonText,
                { color: themeColors.foreground },
              ]}
            >
              {pageSize}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              page === 1 && styles.paginationButtonDisabled,
            ]}
            onPress={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            <Text
              style={{
                color:
                  page === 1
                    ? themeColors.mutedForeground
                    : themeColors.foreground,
              }}
            >
              ◀
            </Text>
          </TouchableOpacity>
          <Text
            style={[styles.paginationText, { color: themeColors.foreground }]}
          >
            {page} / {Math.max(totalPages, 1)}
          </Text>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              page === totalPages && styles.paginationButtonDisabled,
            ]}
            onPress={() => setPage(Math.min(Math.max(totalPages, 1), page + 1))}
            disabled={page === totalPages}
          >
            <Text
              style={{
                color:
                  page === totalPages
                    ? themeColors.mutedForeground
                    : themeColors.foreground,
              }}
            >
              ▶
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rows per page modal */}
      <Modal
        transparent
        visible={showRowsModal}
        animationType="fade"
        onRequestClose={() => setShowRowsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
          >
            {[10, 20, 50].map((n) => (
              <TouchableOpacity
                key={n}
                style={styles.modalOption}
                onPress={() => {
                  setPageSize(n);
                  setPage(1);
                  setShowRowsModal(false);
                }}
              >
                <Text style={{ color: themeColors.foreground }}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Transaction Details Bottom Sheet */}
      <Modal
        transparent
        visible={showDetailsSheet}
        animationType="slide"
        onRequestClose={handleCloseDetails}
      >
        <View style={styles.sheetOverlay}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={handleCloseDetails}
          />
          <View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
          >
            {/* Drag Handle */}
            <View style={styles.sheetDragHandle} />

            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.sheetTitle, { color: themeColors.foreground }]}
                >
                  Transaction Details
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 2,
                  }}
                >
                  <Text
                    style={[
                      styles.sheetSubtitle,
                      { color: themeColors.mutedForeground },
                    ]}
                  >
                    Read-only view
                  </Text>

                  <TouchableOpacity
                    onPress={handleCloseDetails}
                    style={[
                      styles.sheetCloseButton,
                      { backgroundColor: themeColors.muted },
                    ]}
                  >
                    <X size={16} color={themeColors.foreground} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {isDetailsLoading && (
              <View style={styles.sheetState}>
                <ActivityIndicator size="small" color={themeColors.primary} />
                <Text
                  style={[
                    styles.sheetStateText,
                    { color: themeColors.mutedForeground },
                  ]}
                >
                  Loading details...
                </Text>
              </View>
            )}

            {!isDetailsLoading && detailsError && (
              <View style={styles.sheetState}>
                <Text
                  style={[
                    styles.sheetStateText,
                    { color: themeColors.mutedForeground },
                  ]}
                >
                  Failed to load transaction details.
                </Text>
                <TouchableOpacity
                  onPress={refetchDetails}
                  style={[
                    styles.retryButton,
                    { borderColor: themeColors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.retryButtonText,
                      { color: themeColors.foreground },
                    ]}
                  >
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!isDetailsLoading && !detailsError && !selectedTransaction && (
              <View style={styles.sheetState}>
                <Text
                  style={[
                    styles.sheetStateText,
                    { color: themeColors.mutedForeground },
                  ]}
                >
                  Transaction not found.
                </Text>
              </View>
            )}

            {!isDetailsLoading && !detailsError && selectedTransaction && (
              <>
                <ScrollView
                  contentContainerStyle={styles.sheetContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.detailRow}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: themeColors.mutedForeground },
                      ]}
                    >
                      Title
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: themeColors.foreground },
                      ]}
                    >
                      {selectedTransaction.title}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: themeColors.mutedForeground },
                      ]}
                    >
                      Amount
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: selectedAmountColor },
                      ]}
                    >
                      {formatCurrency(selectedTransaction.amount, {
                        showSign: true,
                        isExpense:
                          selectedTransaction.type !== TRANSACTION_TYPE.INCOME,
                      })}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: themeColors.mutedForeground },
                      ]}
                    >
                      Type
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: themeColors.foreground },
                      ]}
                    >
                      {selectedTypeLabel}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: themeColors.mutedForeground },
                      ]}
                    >
                      Category
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: themeColors.foreground },
                      ]}
                    >
                      {formatLabel(selectedTransaction.category)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: themeColors.mutedForeground },
                      ]}
                    >
                      Date
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: themeColors.foreground },
                      ]}
                    >
                      {format(
                        new Date(selectedTransaction.date),
                        "MMM d, yyyy",
                      )}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: themeColors.mutedForeground },
                      ]}
                    >
                      Payment method
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: themeColors.foreground },
                      ]}
                    >
                      {formatPaymentMethod(selectedTransaction.paymentMethod)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: themeColors.mutedForeground },
                      ]}
                    >
                      Description / Notes
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        selectedTransaction.description
                          ? { color: themeColors.foreground }
                          : { color: themeColors.mutedForeground },
                      ]}
                    >
                      {selectedTransaction.description?.trim() || "Not set"}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: themeColors.mutedForeground },
                      ]}
                    >
                      Recurring status
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: themeColors.foreground },
                      ]}
                    >
                      {selectedRecurringLabel}
                    </Text>
                  </View>
                </ScrollView>

                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    onPress={() => {
                      handleCloseDetails();
                      handleEdit(selectedTransaction._id);
                    }}
                    style={[
                      styles.actionButton,
                      { backgroundColor: themeColors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        { color: themeColors.primaryForeground },
                      ]}
                    >
                      Edit Transaction
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      handleCloseDetails();
                      handleDuplicate(selectedTransaction._id);
                    }}
                    style={[
                      styles.actionButton,
                      { backgroundColor: themeColors.secondary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        { color: themeColors.secondaryForeground },
                      ]}
                    >
                      Duplicate Transaction
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      handleCloseDetails();
                      handleDelete(selectedTransaction._id);
                    }}
                    style={[
                      styles.actionButton,
                      { backgroundColor: themeColors.destructive },
                    ]}
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        { color: themeColors.destructiveForeground },
                      ]}
                    >
                      Delete Transaction
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Transaction Form Bottom Sheet */}
      <TransactionFormSheet
        isVisible={showFormSheet}
        onClose={handleCloseForm}
        transactionId={editingTransactionId}
        isEdit={!!editingTransactionId}
        initialMode={initialMode}
      />

      <ActionSheet
        visible={!!actionMenuItem}
        title={actionMenuItem?.title}
        onClose={() => setActionMenuItem(null)}
        options={
          actionMenuItem
            ? [
                { label: "Edit", onPress: () => handleEdit(actionMenuItem._id) },
                { label: "Duplicate", onPress: () => handleDuplicate(actionMenuItem._id) },
                {
                  label: "Delete",
                  destructive: true,
                  onPress: () => handleDelete(actionMenuItem._id),
                },
              ]
            : []
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: typeof colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    contentHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
    },
    headerTextWrap: { flex: 1, minWidth: 0 },
    headerTitle: { fontFamily: fontFamily.bold, fontSize: 22, letterSpacing: -0.4 },
    headerSubtitle: { fontFamily: fontFamily.regular, fontSize: 13, marginTop: 2 },
    headerIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: "center",
      justifyContent: "center",
      ...shadows.card,
    },
    iconButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    addButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
    },
    addButtonText: {
      color: theme.primaryForeground,
      fontFamily: fontFamily.semibold,
      fontSize: 13,
    },
    searchContainer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderWidth: 1,
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.md,
      height: 46,
    },
    searchInput: {
      flex: 1,
      fontFamily: fontFamily.regular,
      fontSize: 14,
    },
    filterBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    filterButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
    },
    filterButtonText: {
      fontFamily: fontFamily.medium,
      fontSize: 13,
    },
    resetButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    resetButtonText: {
      fontFamily: fontFamily.medium,
      fontSize: 13,
    },
    filtersPanel: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    filterGroup: {
      gap: spacing.sm,
    },
    filterGroupLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    pillRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    pill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: borderRadius.full,
      minHeight: 32,
      justifyContent: "center",
      alignItems: "center",
    },
    pillText: {
      fontFamily: fontFamily.medium,
      fontSize: 13,
    },
    bulkActionsBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginHorizontal: spacing.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.sm,
      borderRadius: borderRadius.lg,
    },
    bulkActionsText: {
      fontFamily: fontFamily.semibold,
      fontSize: 13,
    },
    bulkDeleteButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.md,
    },
    bulkDeleteText: {
      fontFamily: fontFamily.semibold,
      fontSize: 13,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 120,
    },
    transactionCard: {
      borderRadius: borderRadius.xl,
      marginBottom: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: "hidden",
      flexDirection: "row",
      alignItems: "stretch",
      ...shadows.card,
    },
    accentBar: {
      width: 3,
    },
    selectedCheckText: {
      fontSize: 15,
      fontFamily: fontFamily.bold,
    },
    cardContent: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    cardLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    iconCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    infoColumn: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    cardTitle: {
      fontFamily: fontFamily.semibold,
      fontSize: 14,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    metaText: {
      fontFamily: fontFamily.regular,
      fontSize: 11,
    },
    cardRight: {
      alignItems: "flex-end",
      flexDirection: "row",
      gap: spacing.xs,
      marginLeft: spacing.sm,
      flexShrink: 0,
      maxWidth: 140,
    },
    cardAmount: {
      fontFamily: fontFamily.bold,
      fontSize: 15,
    },
    moreButton: {
      padding: spacing.xs,
    },
    emptyState: {
      paddingTop: spacing.xxxl,
      alignItems: "center",
      gap: spacing.md,
    },
    emptyText: {
      fontFamily: fontFamily.medium,
      fontSize: 15,
    },
    footerBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
    },
    footerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    footerText: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
    },
    footerButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: borderRadius.full,
    },
    footerButtonText: {
      fontFamily: fontFamily.medium,
      fontSize: 13,
    },
    paginationContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    paginationButton: {
      padding: spacing.xs,
      minWidth: 32,
      alignItems: "center",
    },
    paginationButtonDisabled: {
      opacity: 0.3,
    },
    paginationText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.lg,
    },
    modalCard: {
      width: "100%",
      maxWidth: 320,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      overflow: "hidden",
    },
    modalOption: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "rgba(0,0,0,0.1)",
    },
    sheetOverlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    sheetBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.background,
      opacity: 0.6,
    },
    sheetContainer: {
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
      ...shadows.lg,
    },
    sheetDragHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.border,
      alignSelf: "center",
      marginBottom: spacing.md,
      marginTop: spacing.sm,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.lg,
    },
    sheetTitle: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
    },
    sheetSubtitle: {
      fontSize: fontSize.sm,
      marginTop: 2,
    },
    sheetCloseButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    sheetState: {
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.lg,
    },
    sheetStateText: {
      fontSize: fontSize.sm,
      textAlign: "center",
    },
    retryButton: {
      borderWidth: 1,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    retryButtonText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
    },
    sheetContent: {
      gap: 0,
      paddingBottom: spacing.lg,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
      gap: spacing.md,
    },
    detailLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.bold,
      letterSpacing: 0.1,
      flex: 1,
    },
    detailValue: {
      fontSize: fontSize.sm,
      fontWeight: "400",
      flex: 1.5,
      textAlign: "right",
    },
    sheetActions: {
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    actionButton: {
      height: 48,
      borderRadius: borderRadius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    actionButtonText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
  });
