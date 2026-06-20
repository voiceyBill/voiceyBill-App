import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronDown, Check, Search, X } from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";
import {
  colors,
  spacing,
  borderRadius,
  fontFamily,
  cardRadius,
} from "../../theme/colors";

export interface SelectOption {
  label: string;
  value: string;
  /** Optional leading color dot (used for categories). */
  color?: string;
  /** Optional secondary line shown under the label. */
  description?: string;
}

export interface SelectFieldFooterAction {
  label: string;
  onPress: () => void;
}

interface SelectFieldProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  /** Title shown at the top of the picker sheet. Defaults to the label. */
  title?: string;
  searchable?: boolean;
  disabled?: boolean;
  /** Action pinned to the bottom of the sheet, e.g. "+ Add new category…". */
  footerAction?: SelectFieldFooterAction;
  /** Override the text shown in the selector button (e.g. an in-progress value). */
  selectedLabel?: string;
  emptyText?: string;
}

/**
 * A themed, bottom-sheet style select that replaces the native
 * `@react-native-picker/picker` dropdown so pickers match the app UI/UX.
 */
export default function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  title,
  searchable = false,
  disabled = false,
  footerAction,
  selectedLabel,
  emptyText = "No options available.",
}: SelectFieldProps) {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];
  const insets = useSafeAreaInsets();

  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");

  // Guard against junk entries ever rendering (e.g. "undefined"/null/blank).
  const safeOptions = useMemo(
    () =>
      (options || []).filter(
        (opt) => opt && typeof opt.label === "string" && opt.label.trim().length > 0,
      ),
    [options],
  );

  const selectedOption = useMemo(
    () => safeOptions.find((opt) => opt.value === value),
    [safeOptions, value],
  );

  const displayLabel =
    selectedLabel ?? selectedOption?.label ?? (value ? value : "");

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return safeOptions;
    return safeOptions.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [query, safeOptions]);

  const close = () => {
    setVisible(false);
    setQuery("");
  };

  const handleSelect = (next: string) => {
    onChange(next);
    close();
  };

  const styles = createStyles(theme);

  const renderItem = ({ item }: { item: SelectOption }) => {
    const isSelected = item.value === value;
    return (
      <TouchableOpacity
        style={[styles.itemRow, isSelected && styles.itemRowSelected]}
        onPress={() => handleSelect(item.value)}
        activeOpacity={0.7}
      >
        <View style={styles.itemLeft}>
          {item.color ? (
            <View style={[styles.colorDot, { backgroundColor: item.color }]} />
          ) : null}
          <View style={styles.itemTextWrap}>
            <Text style={styles.itemLabel} numberOfLines={1}>
              {item.label}
            </Text>
            {item.description ? (
              <Text style={styles.itemDescription} numberOfLines={1}>
                {item.description}
              </Text>
            ) : null}
          </View>
        </View>
        {isSelected ? (
          <Check size={18} color={theme.primary} strokeWidth={2.5} />
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        style={[styles.selector, disabled && styles.selectorDisabled]}
        onPress={() => !disabled && setVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={styles.selectorContent}>
          {selectedOption?.color ? (
            <View
              style={[styles.colorDot, { backgroundColor: selectedOption.color }]}
            />
          ) : null}
          <Text
            style={[
              styles.selectorText,
              !displayLabel && styles.selectorPlaceholder,
            ]}
            numberOfLines={1}
          >
            {displayLabel || placeholder}
          </Text>
        </View>
        <ChevronDown size={18} color={theme.mutedForeground} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={close}
        statusBarTranslucent
      >
        <Pressable style={styles.overlay} onPress={close}>
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.grabber} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {title || label || "Select"}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={close}
                activeOpacity={0.7}
              >
                <X size={18} color={theme.foreground} />
              </TouchableOpacity>
            </View>

            {searchable ? (
              <View style={styles.searchBar}>
                <Search size={16} color={theme.mutedForeground} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search…"
                  placeholderTextColor={theme.mutedForeground}
                  value={query}
                  onChangeText={setQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {query.length > 0 ? (
                  <TouchableOpacity onPress={() => setQuery("")}>
                    <X size={15} color={theme.mutedForeground} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              renderItem={renderItem}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>{emptyText}</Text>
                </View>
              }
            />

            {footerAction ? (
              <TouchableOpacity
                style={styles.footerAction}
                onPress={() => {
                  close();
                  footerAction.onPress();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.footerActionText}>{footerAction.label}</Text>
              </TouchableOpacity>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (theme: typeof colors.light) =>
  StyleSheet.create({
    container: {
      width: "100%",
    },
    label: {
      fontFamily: fontFamily.medium,
      fontSize: 13,
      color: theme.foreground,
      marginBottom: spacing.sm,
    },
    selector: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.md,
      height: 50,
    },
    selectorDisabled: {
      opacity: 0.6,
    },
    selectorContent: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginRight: spacing.sm,
    },
    selectorText: {
      flex: 1,
      fontFamily: fontFamily.regular,
      fontSize: 14,
      color: theme.foreground,
    },
    selectorPlaceholder: {
      color: theme.mutedForeground,
    },
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: theme.card,
      borderTopLeftRadius: cardRadius,
      borderTopRightRadius: cardRadius,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      paddingTop: spacing.sm,
      maxHeight: "75%",
    },
    grabber: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: borderRadius.full,
      backgroundColor: theme.border,
      marginBottom: spacing.sm,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    sheetTitle: {
      flex: 1,
      fontFamily: fontFamily.semibold,
      fontSize: 17,
      color: theme.foreground,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.muted,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      height: 44,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: borderRadius.xl,
      backgroundColor: theme.background,
    },
    searchInput: {
      flex: 1,
      height: "100%",
      fontFamily: fontFamily.regular,
      fontSize: 14,
      color: theme.foreground,
      paddingVertical: 0,
    },
    list: {
      flexGrow: 0,
    },
    listContent: {
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.sm,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.lg,
    },
    itemRowSelected: {
      backgroundColor: theme.secondary,
    },
    itemLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      marginRight: spacing.sm,
    },
    colorDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    itemTextWrap: {
      flex: 1,
    },
    itemLabel: {
      fontFamily: fontFamily.medium,
      fontSize: 15,
      color: theme.foreground,
    },
    itemDescription: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      color: theme.mutedForeground,
      marginTop: 2,
    },
    emptyWrap: {
      padding: spacing.xl,
      alignItems: "center",
    },
    emptyText: {
      fontFamily: fontFamily.regular,
      fontSize: 14,
      color: theme.mutedForeground,
    },
    footerAction: {
      marginTop: spacing.xs,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.xs,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.primary,
      alignItems: "center",
      backgroundColor: theme.secondary,
    },
    footerActionText: {
      fontFamily: fontFamily.semibold,
      fontSize: 14,
      color: theme.primary,
    },
  });
