import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { ChevronLeft, Pencil, Trash2, Check } from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";
import { colors, spacing, fontFamily, borderRadius, shadows, cardRadius } from "../../theme/colors";
import { useFloatingTabBarSpace } from "../../navigation/tabBarLayout";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";
import { getCategoryVisual } from "../../lib/categoryVisuals";
import { isValidCategoryName } from "../../lib/category";
import Spinner from "../../components/common/Spinner";
import { ListSkeleton } from "../../components/common/Skeleton";
import { Button } from "../../components/common";
import { useToast } from "../../context/NotificationContext";
import { useConfirm } from "../../context/ConfirmContext";
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useUpdateCategoryMutation,
} from "../../features/category/categoryAPI";

// Friendly preset palette — users tap a swatch instead of typing a hex code.
const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

const DEFAULT_COLOR = "#3b82f6";

export default function CategorySettingsScreen() {
  const navigation = useNavigation();
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const insets = useSafeAreaInsets();
  const tabBarSpace = useFloatingTabBarSpace();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const { data, isFetching } = useGetCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState(DEFAULT_COLOR);
  const [isEditing, setIsEditing] = useState(false);

  const categories = useMemo(
    () => (data?.data ?? []).filter((category) => isValidCategoryName(category.name)),
    [data],
  );
  const defaultCategories = useMemo(
    () => categories.filter((category) => category.isDefault),
    [categories],
  );
  const customCategories = useMemo(
    () => categories.filter((category) => !category.isDefault),
    [categories],
  );

  // Icon is auto-matched from the name (the API stores name + color only).
  const previewIcon = getCategoryVisual(categoryName).icon;
  const previewName = categoryName.trim() || "New category";
  const isSaving = isCreating || isUpdating;

  const resetForm = () => {
    setCategoryId("");
    setCategoryName("");
    setCategoryColor(DEFAULT_COLOR);
    setIsEditing(false);
  };

  const handleSaveCategory = async () => {
    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      showToast({
        type: "warning",
        title: "Name required",
        message: "Please enter a category name.",
      });
      return;
    }

    try {
      if (isEditing) {
        await updateCategory({ id: categoryId, name: trimmedName, color: categoryColor }).unwrap();
        showToast({ type: "success", title: "Updated", message: `"${trimmedName}" was updated.` });
      } else {
        await createCategory({ name: trimmedName, color: categoryColor }).unwrap();
        showToast({ type: "success", title: "Created", message: `"${trimmedName}" was added.` });
      }
      resetForm();
    } catch (error) {
      showToast({
        type: "error",
        title: "Save failed",
        message: getApiErrorMessage(error, "Unable to save category."),
      });
    }
  };

  const handleEdit = (category: { _id: string; name: string; color?: string }) => {
    setCategoryId(category._id);
    setCategoryName(category.name);
    setCategoryColor(category.color || DEFAULT_COLOR);
    setIsEditing(true);
  };

  const handleDelete = async (category: { _id: string; name: string }) => {
    await confirm({
      title: "Delete category",
      message: `Delete "${category.name}"? Existing transactions will fall back to Uncategorized.`,
      confirmText: "Delete",
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteCategory(category._id).unwrap();
          if (categoryId === category._id) resetForm();
          showToast({ type: "success", title: "Deleted", message: `"${category.name}" was removed.` });
        } catch (error) {
          showToast({
            type: "error",
            title: "Delete failed",
            message: getApiErrorMessage(error, "Unable to delete category."),
          });
        }
      },
    });
  };

  const styles = createStyles(themeColors);

  const renderCategoryRow = (
    category: { _id: string; name: string; color?: string; isDefault?: boolean },
    editable: boolean,
  ) => {
    const color = category.color || "#8e8e93";
    const icon = getCategoryVisual(category.name).icon;
    return (
      <View key={category._id} style={styles.categoryRow}>
        <View style={[styles.iconTile, { backgroundColor: color + "1A" }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={styles.categoryTextWrap}>
          <Text style={styles.categoryName} numberOfLines={1}>
            {category.name}
          </Text>
          <Text style={styles.categorySubtext}>
            {category.isDefault ? "Default" : "Custom"}
          </Text>
        </View>
        {editable && (
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => handleEdit(category)} style={styles.iconButton} hitSlop={8}>
              <Pencil size={15} color={themeColors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(category)} style={styles.iconButton} hitSlop={8}>
              <Trash2 size={15} color={themeColors.destructive} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.sm) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <ChevronLeft size={20} color={themeColors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Categories</Text>
          <Text style={styles.subtitle}>Create and manage your transaction categories</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form */}
        <Text style={styles.sectionLabel}>{isEditing ? "Edit category" : "New category"}</Text>
        <View style={styles.formCard}>
          {/* Live preview */}
          <View style={styles.previewRow}>
            <View style={[styles.previewTile, { backgroundColor: categoryColor + "1A" }]}>
              <Ionicons name={previewIcon} size={22} color={categoryColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewName} numberOfLines={1}>
                {previewName}
              </Text>
              <Text style={styles.previewHint}>Live preview · icon auto-matches the name</Text>
            </View>
          </View>

          {/* Name */}
          <Text style={styles.label}>Category name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Coffee, Freelance, Rent"
            placeholderTextColor={themeColors.mutedForeground}
            value={categoryName}
            onChangeText={setCategoryName}
          />

          {/* Color swatches */}
          <Text style={[styles.label, { marginTop: spacing.md }]}>Color</Text>
          <View style={styles.swatchRow}>
            {PRESET_COLORS.map((color) => {
              const selected = color.toLowerCase() === categoryColor.toLowerCase();
              return (
                <TouchableOpacity
                  key={color}
                  onPress={() => setCategoryColor(color)}
                  activeOpacity={0.8}
                  style={[
                    styles.swatch,
                    { backgroundColor: color },
                    selected && { borderColor: themeColors.foreground, borderWidth: 3 },
                  ]}
                >
                  {selected && <Check size={15} color="#fff" strokeWidth={3} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Actions */}
          <Button
            style={styles.saveButton}
            onPress={handleSaveCategory}
            loading={isSaving}
            loadingLabel={isEditing ? "Updating…" : "Creating…"}
            label={isEditing ? "Update category" : "Create category"}
          />

          {isEditing && (
            <Button
              style={styles.cancelButton}
              variant="outline"
              onPress={resetForm}
              label="Cancel edit"
            />
          )}
        </View>

        {/* Custom categories */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>Your categories</Text>
          {isFetching && data && <Spinner size={14} />}
        </View>
        {!data ? (
          <ListSkeleton count={6} separatorColor={themeColors.border} />
        ) : (
          <>
            {customCategories.length === 0 ? (
              <View style={[styles.emptyCard, { borderColor: themeColors.border }]}>
                <Text style={styles.emptyText}>
                  No custom categories yet. Create one above to see it here.
                </Text>
              </View>
            ) : (
              customCategories.map((category) => renderCategoryRow(category, true))
            )}

            {/* Default categories */}
            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Default categories</Text>
            {defaultCategories.map((category) => renderCategoryRow(category, false))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: typeof colors.light) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: "center",
      justifyContent: "center",
      ...shadows.card,
    },
    title: { fontFamily: fontFamily.bold, fontSize: 20, letterSpacing: -0.3, color: theme.foreground },
    subtitle: { fontFamily: fontFamily.regular, fontSize: 13, marginTop: 2, color: theme.mutedForeground },
    content: { paddingHorizontal: spacing.lg },
    sectionLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: 12,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: theme.mutedForeground,
      marginBottom: spacing.sm,
      marginLeft: spacing.xs,
      marginTop: spacing.md,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingRight: spacing.xs,
    },
    formCard: {
      borderRadius: cardRadius,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      backgroundColor: theme.card,
      padding: spacing.lg,
      ...shadows.card,
    },
    previewRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingBottom: spacing.md,
      marginBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    previewTile: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    previewName: { fontFamily: fontFamily.semibold, fontSize: 16, color: theme.foreground },
    previewHint: { fontFamily: fontFamily.regular, fontSize: 11.5, color: theme.mutedForeground, marginTop: 2 },
    label: { fontFamily: fontFamily.medium, fontSize: 12.5, color: theme.mutedForeground, marginBottom: spacing.sm },
    input: {
      borderRadius: borderRadius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      backgroundColor: theme.background,
      color: theme.foreground,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      fontFamily: fontFamily.regular,
      fontSize: 15,
    },
    swatchRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm + 2,
    },
    swatch: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      borderColor: "transparent",
    },
    saveButton: { marginTop: spacing.lg },
    cancelButton: { marginTop: spacing.sm },
    categoryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      borderRadius: cardRadius,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      backgroundColor: theme.card,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
      ...shadows.card,
    },
    iconTile: {
      width: 38,
      height: 38,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },
    categoryTextWrap: { flex: 1, minWidth: 0 },
    categoryName: { fontFamily: fontFamily.semibold, fontSize: 14.5, color: theme.foreground },
    categorySubtext: { fontFamily: fontFamily.regular, fontSize: 11.5, color: theme.mutedForeground, marginTop: 1 },
    actions: { flexDirection: "row", gap: spacing.xs },
    iconButton: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.muted,
    },
    emptyCard: {
      borderRadius: cardRadius,
      borderWidth: StyleSheet.hairlineWidth,
      borderStyle: "dashed",
      padding: spacing.lg,
      alignItems: "center",
    },
    emptyText: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      color: theme.mutedForeground,
      textAlign: "center",
    },
  });
