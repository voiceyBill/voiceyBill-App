import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft, Edit, Plus, Trash2, Check } from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from "../../theme/colors";
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useUpdateCategoryMutation,
} from "../../features/category/categoryAPI";

export default function CategorySettingsScreen() {
  const navigation = useNavigation();
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const { data, isFetching } = useGetCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] =
    useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] =
    useDeleteCategoryMutation();

  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState("#6B7280");
  const [isEditing, setIsEditing] = useState(false);

  const categories = data?.data ?? [];
  const defaultCategories = useMemo(
    () => categories.filter((category) => category.isDefault),
    [categories],
  );
  const customCategories = useMemo(
    () => categories.filter((category) => !category.isDefault),
    [categories],
  );

  const resetForm = () => {
    setCategoryId("");
    setCategoryName("");
    setCategoryColor("#6B7280");
    setIsEditing(false);
  };

  const handleSaveCategory = async () => {
    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      Alert.alert("Validation", "Category name is required.");
      return;
    }

    try {
      if (isEditing) {
        await updateCategory({
          id: categoryId,
          name: trimmedName,
          color: categoryColor,
        }).unwrap();
      } else {
        await createCategory({
          name: trimmedName,
          color: categoryColor,
        }).unwrap();
      }
      resetForm();
    } catch (error: any) {
      Alert.alert(
        "Save failed",
        error?.data?.message || "Unable to save category.",
      );
    }
  };

  const handleEdit = (category: {
    _id: string;
    name: string;
    color: string;
  }) => {
    setCategoryId(category._id);
    setCategoryName(category.name);
    setCategoryColor(category.color || "#6B7280");
    setIsEditing(true);
  };

  const handleDelete = (category: { _id: string; name: string }) => {
    Alert.alert(
      "Delete category",
      `Delete "${category.name}"? Existing transactions will fall back to Uncategorized.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCategory(category._id).unwrap();
              if (categoryId === category._id) {
                resetForm();
              }
            } catch (error: any) {
              Alert.alert(
                "Delete failed",
                error?.data?.message || "Unable to delete category.",
              );
            }
          },
        },
      ],
    );
  };

  const styles = createStyles(themeColors);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={22} color={themeColors.foreground} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Category Management</Text>
          <Text style={styles.subtitle}>
            Create custom categories, edit saved names, and delete unused ones.
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          <Text style={styles.sectionLabel}>New category</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Category name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Freelance Supplies"
              placeholderTextColor={themeColors.mutedForeground}
              value={categoryName}
              onChangeText={setCategoryName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Color</Text>
            <TextInput
              style={styles.input}
              placeholder="#6B7280"
              placeholderTextColor={themeColors.mutedForeground}
              value={categoryColor}
              onChangeText={setCategoryColor}
            />
            <Text style={styles.helpText}>
              Use a hex color for label accents and category chips.
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSaveCategory}
            style={[
              styles.saveButton,
              { backgroundColor: themeColors.primary },
            ]}
            activeOpacity={0.8}
            disabled={isCreating || isUpdating}
          >
            {isCreating || isUpdating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditing ? "Update category" : "Create category"}
              </Text>
            )}
          </TouchableOpacity>

          {isEditing && (
            <TouchableOpacity
              onPress={resetForm}
              style={[styles.cancelButton, { borderColor: themeColors.border }]}
            >
              <Text
                style={[styles.cancelText, { color: themeColors.foreground }]}
              >
                Cancel edit
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.listSection}>
          <Text style={styles.sectionLabel}>Default categories</Text>
          {defaultCategories.map((category) => (
            <View key={category._id} style={styles.categoryRow}>
              <View style={styles.categoryInfo}>
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: category.color || "#6B7280" },
                  ]}
                />
                <View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categorySubtext}>Default</Text>
                </View>
              </View>
            </View>
          ))}

          <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>
            Custom categories
          </Text>
          {customCategories.length === 0 ? (
            <Text style={styles.emptyText}>
              Create a custom category from above to see it here.
            </Text>
          ) : (
            customCategories.map((category) => (
              <View key={category._id} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: category.color || "#6B7280" },
                    ]}
                  />
                  <View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categorySubtext}>Custom</Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() => handleEdit(category)}
                    style={styles.iconButton}
                  >
                    <Edit size={16} color={themeColors.foreground} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(category)}
                    style={styles.iconButton}
                  >
                    <Trash2 size={16} color={themeColors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {(isFetching || isDeleting) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={themeColors.primary} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: typeof colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      flexDirection: "row",
      gap: spacing.md,
      alignItems: "center",
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.xl,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    title: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: theme.foreground,
    },
    subtitle: {
      marginTop: spacing.xs,
      color: theme.mutedForeground,
      fontSize: fontSize.sm,
      lineHeight: 20,
      maxWidth: "80%",
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    formCard: {
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    sectionLabel: {
      fontSize: fontSize.xs,
      color: theme.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    field: {
      marginBottom: spacing.md,
    },
    label: {
      color: theme.foreground,
      fontWeight: fontWeight.bold,
      marginBottom: spacing.xs,
    },
    input: {
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
      color: theme.foreground,
      padding: spacing.md,
      fontSize: fontSize.sm,
    },
    helpText: {
      marginTop: spacing.xs,
      fontSize: fontSize.xs,
      color: theme.mutedForeground,
    },
    saveButton: {
      borderRadius: borderRadius.xl,
      paddingVertical: spacing.md,
      alignItems: "center",
      justifyContent: "center",
      marginTop: spacing.sm,
    },
    saveButtonText: {
      color: "#ffffff",
      fontWeight: fontWeight.bold,
    },
    cancelButton: {
      marginTop: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      alignItems: "center",
    },
    cancelText: {
      fontWeight: fontWeight.bold,
    },
    listSection: {
      marginTop: spacing.lg,
    },
    categoryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    categoryInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      flex: 1,
    },
    colorDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    categoryName: {
      color: theme.foreground,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
    categorySubtext: {
      color: theme.mutedForeground,
      fontSize: fontSize.xs,
      marginTop: spacing.xs / 2,
    },
    actions: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    iconButton: {
      padding: spacing.xs,
      borderRadius: borderRadius.md,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    emptyText: {
      color: theme.mutedForeground,
      fontSize: fontSize.sm,
      marginTop: spacing.sm,
    },
    loadingOverlay: {
      marginTop: spacing.lg,
      alignItems: "center",
    },
  });
