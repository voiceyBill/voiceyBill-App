import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import Spinner from "../../components/common/Spinner";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFloatingTabBarSpace } from "../../navigation/tabBarLayout";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";
import { useNavigation } from "@react-navigation/native";
import {
  User,
  Camera,
  ChevronLeft,
  ChevronRight,
  Mail,
  Lock,
  ShieldCheck,
} from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/NotificationContext";
import { useTypedSelector, useAppDispatch } from "../../store/hooks";
import { updateUser as updateUserStore } from "../../features/auth/authSlice";
import {
  colors,
  spacing,
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
  const tabBarSpace = useFloatingTabBarSpace();
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
    } catch (error) {
      showToast({ type: "error", title: "Update failed", message: getApiErrorMessage(error, "Could not update your account.") });
    } finally {
      setIsSaving(false);
    }
  };

  const styles = createStyles(themeColors);
  const displayName = name.trim() || user?.name || "Your account";
  const email = user?.email || "—";

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: tabBarSpace + spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={[styles.screenHeader, { paddingTop: Math.max(insets.top, spacing.sm) }]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[
              styles.backBtn,
              { backgroundColor: themeColors.card, borderColor: themeColors.border },
            ]}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={20} color={themeColors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.screenTitle, { color: themeColors.foreground }]}>
              Account
            </Text>
            <Text
              style={[styles.screenSubtitle, { color: themeColors.mutedForeground }]}
            >
              Profile & preferences
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Avatar hero */}
          <View style={styles.hero}>
            <TouchableOpacity
              onPress={handleChooseFile}
              activeOpacity={0.85}
              style={styles.avatarWrap}
            >
              <View
                style={[styles.avatarRing, { borderColor: themeColors.primary + "30" }]}
              >
                {avatarPreview ? (
                  <Image source={{ uri: avatarPreview }} style={styles.avatarImage} />
                ) : (
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      { backgroundColor: themeColors.primary + "18" },
                    ]}
                  >
                    <User size={40} color={themeColors.primary} strokeWidth={1.5} />
                  </View>
                )}
              </View>
              <View
                style={[
                  styles.cameraIcon,
                  {
                    backgroundColor: themeColors.primary,
                    borderColor: themeColors.background,
                  },
                ]}
              >
                <Camera size={13} color={themeColors.primaryForeground} />
              </View>
            </TouchableOpacity>

            <Text
              style={[styles.heroName, { color: themeColors.foreground }]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text
              style={[styles.heroEmail, { color: themeColors.mutedForeground }]}
              numberOfLines={1}
            >
              {email}
            </Text>

            <TouchableOpacity
              onPress={handleChooseFile}
              style={[styles.changePhotoBtn, { borderColor: themeColors.border }]}
              activeOpacity={0.7}
            >
              <Camera size={14} color={themeColors.foreground} />
              <Text
                style={[styles.changePhotoBtnText, { color: themeColors.foreground }]}
              >
                Change photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* PROFILE */}
          <Text style={[styles.sectionLabel, { color: themeColors.mutedForeground }]}>
            Profile
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: themeColors.card, borderColor: themeColors.border },
            ]}
          >
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: themeColors.mutedForeground }]}>
                Full name
              </Text>
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

            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

            {/* Email — read-only identity */}
            <View style={styles.readonlyRow}>
              <View style={[styles.rowIcon, { backgroundColor: themeColors.muted }]}>
                <Mail size={16} color={themeColors.mutedForeground} />
              </View>
              <View style={styles.readonlyTextWrap}>
                <Text style={[styles.label, { color: themeColors.mutedForeground }]}>
                  Email
                </Text>
                <Text
                  style={[styles.readonlyValue, { color: themeColors.foreground }]}
                  numberOfLines={1}
                >
                  {email}
                </Text>
              </View>
              <View style={styles.lockHint}>
                <Lock size={12} color={themeColors.mutedForeground} />
              </View>
            </View>
          </View>

          {/* PREFERENCES */}
          <Text style={[styles.sectionLabel, { color: themeColors.mutedForeground }]}>
            Preferences
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: themeColors.card, borderColor: themeColors.border },
            ]}
          >
            <CurrencyPicker
              label="Base currency"
              value={baseCurrency}
              onChange={setBaseCurrency}
              options={currencyOptions}
            />
          </View>

          {/* SECURITY */}
          <Text style={[styles.sectionLabel, { color: themeColors.mutedForeground }]}>
            Security
          </Text>
          <View
            style={[
              styles.card,
              styles.cardTight,
              { backgroundColor: themeColors.card, borderColor: themeColors.border },
            ]}
          >
            <TouchableOpacity
              style={styles.navRow}
              activeOpacity={0.7}
              onPress={() => (navigation as any).navigate("ChangePassword")}
            >
              <View
                style={[styles.rowIcon, { backgroundColor: themeColors.primary + "18" }]}
              >
                <ShieldCheck size={17} color={themeColors.primary} />
              </View>
              <View style={styles.navTextWrap}>
                <Text style={[styles.navTitle, { color: themeColors.foreground }]}>
                  Change password
                </Text>
                <Text
                  style={[styles.navSubtitle, { color: themeColors.mutedForeground }]}
                >
                  Update your account password
                </Text>
              </View>
              <ChevronRight size={18} color={themeColors.mutedForeground} />
            </TouchableOpacity>
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
              <Spinner size={18} color={themeColors.primaryForeground} />
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
                {hasChanges ? "Save changes" : "No changes to save"}
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
    },

    // Hero
    hero: {
      alignItems: "center",
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
    },
    avatarWrap: {
      position: "relative",
    },
    avatarRing: {
      width: 104,
      height: 104,
      borderRadius: 52,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarImage: {
      width: 92,
      height: 92,
      borderRadius: 46,
      resizeMode: "cover",
    },
    avatarPlaceholder: {
      width: 92,
      height: 92,
      borderRadius: 46,
      alignItems: "center",
      justifyContent: "center",
    },
    cameraIcon: {
      position: "absolute",
      bottom: 2,
      right: 2,
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
    },
    heroName: {
      fontFamily: fontFamily.bold,
      fontSize: 18,
      letterSpacing: -0.3,
      marginTop: spacing.md,
    },
    heroEmail: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      marginTop: 2,
    },
    changePhotoBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs + 2,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: StyleSheet.hairlineWidth,
      marginTop: spacing.md,
    },
    changePhotoBtnText: {
      fontFamily: fontFamily.semibold,
      fontSize: 13,
    },

    // Sections
    sectionLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: 12,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
      marginLeft: spacing.xs,
      marginTop: spacing.md,
    },
    card: {
      borderRadius: cardRadius,
      borderWidth: StyleSheet.hairlineWidth,
      padding: spacing.lg,
      ...shadows.card,
    },
    cardTight: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
    },
    fieldGroup: {
      gap: spacing.sm,
    },
    label: {
      fontFamily: fontFamily.medium,
      fontSize: 12.5,
    },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      fontFamily: fontFamily.regular,
      fontSize: 15,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      marginVertical: spacing.md,
    },

    // Read-only row (email)
    readonlyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    rowIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    readonlyTextWrap: {
      flex: 1,
      gap: 2,
    },
    readonlyValue: {
      fontFamily: fontFamily.medium,
      fontSize: 15,
    },
    lockHint: {
      paddingLeft: spacing.sm,
    },

    // Navigation row (security)
    navRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
    },
    navTextWrap: {
      flex: 1,
      gap: 2,
    },
    navTitle: {
      fontFamily: fontFamily.semibold,
      fontSize: 15,
    },
    navSubtitle: {
      fontFamily: fontFamily.regular,
      fontSize: 12.5,
    },

    button: {
      paddingVertical: spacing.md,
      borderRadius: borderRadius.full,
      alignItems: "center",
      marginTop: spacing.xl,
      ...shadows.md,
    },
    buttonText: {
      fontFamily: fontFamily.semibold,
      fontSize: 15,
    },
  });
