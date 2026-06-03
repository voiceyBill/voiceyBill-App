import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Image,
  Platform,
} from "react-native";
import { Search, X, Check } from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../theme/colors";
import { getFlagUrl } from "../../lib/currency-flag";

interface SupportedCurrency {
  code: string;
  name: string;
  symbol: string;
}

interface CurrencyPickerProps {
  value: string;
  onChange: (code: string) => void;
  options: SupportedCurrency[];
  label?: string;
  disabled?: boolean;
}

export default function CurrencyPicker({
  value,
  onChange,
  options,
  label,
  disabled = false,
}: CurrencyPickerProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedCurrency = useMemo(() => {
    return options.find((opt) => opt.code.toUpperCase() === value.toUpperCase()) || {
      code: value,
      name: "",
      symbol: "",
    };
  }, [value, options]);

  const filteredOptions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return options || [];
    return (options || []).filter(
      (opt) =>
        (opt?.code || "").toLowerCase().includes(query) ||
        (opt?.name || "").toLowerCase().includes(query)
    );
  }, [searchQuery, options]);

  const handleSelect = (code: string) => {
    onChange(code);
    setModalVisible(false);
    setSearchQuery("");
  };

  const renderItem = ({ item }: { item: SupportedCurrency }) => {
    const isSelected = item.code.toUpperCase() === value.toUpperCase();
    const flagUrl = getFlagUrl(item.code);

    return (
      <TouchableOpacity
        style={[
          styles.itemRow,
          { borderBottomColor: themeColors.border },
          isSelected && { backgroundColor: themeColors.secondary },
        ]}
        onPress={() => handleSelect(item.code)}
      >
        <View style={styles.itemLeft}>
          {flagUrl ? (
            <Image
              source={{ uri: flagUrl }}
              style={styles.flagImage}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.flagPlaceholder, { backgroundColor: themeColors.muted }]}>
              <Text style={{ fontSize: 10, color: themeColors.mutedForeground, fontWeight: fontWeight.bold }}>
                {item.code.substring(0, 2)}
              </Text>
            </View>
          )}
          <View style={styles.itemMeta}>
            <Text style={[styles.itemCode, { color: themeColors.foreground }]}>
              {item.code}
            </Text>
            <Text style={[styles.itemName, { color: themeColors.mutedForeground }]} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
        </View>

        <View style={styles.itemRight}>
          <Text style={[styles.itemSymbol, { color: themeColors.foreground }]}>
            {item.symbol}
          </Text>
          {isSelected && (
            <Check size={18} color={themeColors.primary} strokeWidth={2.5} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const currentFlagUrl = getFlagUrl(selectedCurrency.code);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: themeColors.foreground }]}>{label}</Text>}

      <TouchableOpacity
        style={[
          styles.selectorButton,
          {
            borderColor: themeColors.border,
            backgroundColor: themeColors.background,
          },
          disabled && { opacity: 0.6 },
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={styles.selectorContent}>
          {currentFlagUrl ? (
            <Image
              source={{ uri: currentFlagUrl }}
              style={styles.selectedFlag}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.selectedFlagPlaceholder, { backgroundColor: themeColors.muted }]}>
              <Text style={{ fontSize: 8, color: themeColors.mutedForeground }}>
                {selectedCurrency.code.substring(0, 2)}
              </Text>
            </View>
          )}
          <Text style={[styles.selectorText, { color: themeColors.foreground }]}>
            {selectedCurrency.code} {selectedCurrency.symbol ? `(${selectedCurrency.symbol})` : ""}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
            <Text style={[styles.modalTitle, { color: themeColors.foreground }]}>
              Select Currency
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: themeColors.muted }]}
              onPress={() => {
                setModalVisible(false);
                setSearchQuery("");
              }}
            >
              <X size={20} color={themeColors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <View
              style={[
                styles.searchBar,
                {
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.card,
                },
              ]}
            >
              <Search size={18} color={themeColors.mutedForeground} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: themeColors.foreground }]}
                placeholder="Search code or name..."
                placeholderTextColor={themeColors.mutedForeground}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={16} color={themeColors.mutedForeground} style={{ marginRight: spacing.sm }} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* List */}
          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item.code}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: spacing.lg }}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={10}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: themeColors.mutedForeground }]}>
                  No currencies match your search.
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  selectorButton: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    height: 50,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  selectorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  selectedFlag: {
    width: 24,
    height: 16,
    borderRadius: 2,
  },
  selectedFlagPlaceholder: {
    width: 24,
    height: 16,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  selectorText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    padding: spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: borderRadius.md,
    height: 46,
  },
  searchIcon: {
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: fontSize.sm,
    paddingVertical: 0,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  flagImage: {
    width: 32,
    height: 22,
    borderRadius: 2,
  },
  flagPlaceholder: {
    width: 32,
    height: 22,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  itemMeta: {
    flex: 1,
    gap: 2,
  },
  itemCode: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  itemName: {
    fontSize: fontSize.xs,
  },
  itemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  itemSymbol: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: fontSize.sm,
  },
});
