import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { User, Camera, ChevronLeft } from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/NotificationContext";
import { useTypedSelector, useAppDispatch } from "../../store/hooks";
import { updateUser as updateUserStore } from "../../features/auth/authSlice";
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  fontFamily,
  shadows,
  cardRadius,
} from "../../theme/colors";
import * as ImagePicker from "expo-image-picker";
import { useUpdateUserMutation } from "../../features/user/userAPI";
import { CurrencyPicker } from "../../components/common";
import { useGetSupportedCurrenciesQuery } from "../../features/currency/currencyAPI";
import { ALL_CURRENCIES } from "../../constants/currencies";

export default function AccountScreen() {
  const navigation = useNavigation();
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const user = useTypedSelector((state) => state.auth.user);

  const [originalName, setOriginalName] = useState(user?.name || "");
  const [originalProfilePicture, setOriginalProfilePicture] = useState<
    string | null
  >(user?.profilePicture || null);
  const [originalBaseCurrency, setOriginalBaseCurrency] = useState(
    user?.baseCurrency || "USD",
  );

  const [name, setName] = useState(originalName);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    originalProfilePicture,
  );
  const [baseCurrency, setBaseCurrency] = useState(originalBaseCurrency);
  const [picked, setPicked] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [updateUser] = useUpdateUserMutation();
  const { data: currenciesData } = useGetSupportedCurrenciesQuery();
  const currencyOptions = useMemo(() => {
    if (currenciesData?.currencies && currenciesData.currencies.length > 0) {
      return currenciesData.currencies;
    }
    return ALL_CURRENCIES;
  }, [currenciesData]);

  // Detect changes
  const hasChanges = useMemo(() => {
    const trimmedName = name.trim();
    const trimmedOriginalName = originalName.trim();

    return (
      trimmedName !== trimmedOriginalName ||
      baseCurrency !== originalBaseCurrency ||
      !!picked
    );
  }, [name, originalName, baseCurrency, originalBaseCurrency, picked]);

  const handleChooseFile = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (res.canceled || !res.assets?.length) return;

    const asset = res.assets[0];

    setPicked({
      uri: asset.uri,
      name: asset.fileName || "avatar.jpg",
      type: asset.mimeType || "image/jpeg",
    });

    setAvatarPreview(asset.uri);
  };

  const handleSave = async () => {
    // Prevent unnecessary API calls
    if (!hasChanges) return;

    try {
      setIsSaving(true);

      const form = new FormData();

      form.append("name", name.trim());
      form.append("baseCurrency", baseCurrency);

      if (picked) {
        // @ts-ignore
        form.append("profilePicture", {
          uri: picked.uri,
          name: picked.name,
          type: picked.type,
        });
      }

      const resp = await updateUser(form as any).unwrap();

      const updated =
        (resp as any)?.data?.user || (resp as any)?.data || (resp as any);

      if (updated) {
        const profileUrl = updated.profilePicture || updated.avatar || null;

        const updatedBaseCurrency = updated.baseCurrency || baseCurrency;

        dispatch(
          updateUserStore({
            name: updated.name,
            profilePicture: profileUrl || undefined,
            baseCurrency: updatedBaseCurrency,
          }),
        );

        const newName = updated.name || name;
        const newProfilePicture = profileUrl || avatarPreview;

        setOriginalName(newName);
        setOriginalProfilePicture(newProfilePicture);
        setOriginalBaseCurrency(updatedBaseCurrency);
        setName(newName);
        setAvatarPreview(newProfilePicture);
        setBaseCurrency(updatedBaseCurrency);
        setPicked(null);
      }

      showToast({ type: "success", title: "Saved", message: "Account updated successfully." });
    } catch {
      showToast({ type: "error", title: "Update failed", message: "Could not update your account." });
    } finally {
      setIsSaving(false);
    }
  };

  const styles = createStyles(themeColors);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.screenHeader, { paddingTop: Math.max(insets.top, spacing.sm) }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={20} color={themeColors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.screenTitle, { color: themeColors.foreground }]}>Account</Text>
            <Text style={[styles.screenSubtitle, { color: themeColors.mutedForeground }]}>
              Profile & preferences
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Avatar hero */}
          <View style={styles.avatarHero}>
            <TouchableOpacity onPress={handleChooseFile} activeOpacity={0.85} style={styles.avatarWrap}>
              {avatarPreview ? (
                <Image source={{ uri: avatarPreview }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors.primary + "18" }]}>
                  <User size={36} color={themeColors.primary} strokeWidth={1.5} />
                </View>
              )}
              <View style={[styles.cameraIcon, { backgroundColor: themeColors.primary, borderColor: themeColors.background }]}>
                <Camera size={12} color={themeColors.primaryForeground} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleChooseFile}
              style={[styles.changePhotoBtn, { borderColor: themeColors.border }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.changePhotoBtnText, { color: themeColors.foreground }]}>Change photo</Text>
            </TouchableOpacity>
            <Text style={[styles.avatarHint, { color: themeColors.mutedForeground }]}>
              JPG or PNG, at least 300×300px
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: themeColors.card, borderColor: themeColors.border },
            ]}
          >
            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: themeColors.foreground }]}>Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.background,
                    color: themeColors.foreground,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={themeColors.mutedForeground}
              />
            </View>

            {/* Base Currency */}
            <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
              <CurrencyPicker
                label="Base Currency"
                value={baseCurrency}
                onChange={setBaseCurrency}
                options={currencyOptions}
              />
            </View>
          </View>

          {/* Save */}
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: hasChanges ? themeColors.primary : themeColors.muted,
              },
              (isSaving || !hasChanges) && { opacity: 0.7 },
            ]}
            onPress={handleSave}
            disabled={isSaving || !hasChanges}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator color={themeColors.primaryForeground} />
            ) : (
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: hasChanges
                      ? themeColors.primaryForeground
                      : themeColors.mutedForeground,
                  },
                ]}
              >
                Save changes
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
    screenHeader: {
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
    headerTextWrap: { flex: 1 },
    screenTitle: {
      fontFamily: fontFamily.bold,
      fontSize: 20,
      letterSpacing: -0.3,
    },
    screenSubtitle: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      marginTop: 2,
    },
    content: {
      paddingHorizontal: spacing.lg,
      gap: spacing.lg,
    },
    avatarHero: {
      alignItems: "center",
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    avatarWrap: {
      position: "relative",
    },
    avatarImage: {
      width: 88,
      height: 88,
      borderRadius: 44,
      resizeMode: "cover",
    },
    avatarPlaceholder: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    cameraIcon: {
      position: "absolute",
      bottom: 2,
      right: 2,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2.5,
    },
    changePhotoBtn: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: StyleSheet.hairlineWidth,
      marginTop: spacing.xs,
    },
    changePhotoBtnText: {
      fontFamily: fontFamily.semibold,
      fontSize: 13,
    },
    avatarHint: {
      fontFamily: fontFamily.regular,
      fontSize: 11,
      textAlign: "center",
    },
    card: {
      borderRadius: cardRadius,
      borderWidth: StyleSheet.hairlineWidth,
      padding: spacing.lg,
      ...shadows.card,
    },
    fieldGroup: {
      marginBottom: spacing.lg,
    },
    label: {
      fontFamily: fontFamily.medium,
      fontSize: 13,
      marginBottom: spacing.sm,
    },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      fontFamily: fontFamily.regular,
      fontSize: 15,
    },
    button: {
      paddingVertical: spacing.md,
      borderRadius: borderRadius.full,
      alignItems: "center",
      ...shadows.md,
    },
    buttonText: {
      fontFamily: fontFamily.semibold,
      fontSize: 15,
    },
  });
