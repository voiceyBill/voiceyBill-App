import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Eye, EyeOff } from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from "../../theme/colors";
import { useChangePasswordMutation } from "../../features/user/userAPI";
import {
  getPasswordRules,
  isPasswordValid,
  getPasswordValidationMessage,
} from "../../features/auth/authValidation";

type PasswordRuleKey =
  | "length"
  | "uppercase"
  | "number"
  | "special"
  | "different"
  | "confirm";

const passwordRuleList: { key: PasswordRuleKey; label: string }[] = [
  { key: "length", label: "At least 8 characters" },
  { key: "uppercase", label: "One uppercase letter" },
  { key: "number", label: "One number" },
  { key: "special", label: "One special character" },
  {
    key: "different",
    label: "New password and current password must be different",
  },
  { key: "confirm", label: "New password and confirmation must match" },
];

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const passwordRules: Record<PasswordRuleKey, boolean> = {
    ...getPasswordRules(newPassword),
    different:
      currentPassword.trim().length > 0 &&
      newPassword.trim().length > 0 &&
      currentPassword.trim() !== newPassword.trim(),
    confirm:
      newPassword.trim().length > 0 &&
      confirmPassword.trim().length > 0 &&
      newPassword.trim() === confirmPassword.trim(),
  };

  const passwordValidationMessage = getPasswordValidationMessage(newPassword);

  const canSubmit =
    currentPassword.trim().length > 0 &&
    isPasswordValid(newPassword) &&
    passwordRules.different &&
    passwordRules.confirm &&
    !isLoading;

  const handleSubmit = async () => {
    setApiError(null);

    if (!currentPassword.trim()) {
      setApiError("Please enter your current password.");
      return;
    }

    if (!isPasswordValid(newPassword)) {
      setApiError(
        passwordValidationMessage ?? "Password does not meet requirements.",
      );
      return;
    }

    if (!passwordRules.different) {
      setApiError("New password must be different from the current password.");
      return;
    }

    if (!passwordRules.confirm) {
      setApiError("New password and confirmation do not match.");
      return;
    }

    try {
      await changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      }).unwrap();

      Alert.alert(
        "Password Updated",
        "Your password has been updated successfully.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setApiError(
        error?.data?.message || "Unable to update password. Please try again.",
      );
    }
  };

  const styles = createStyles(themeColors);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View
            style={[styles.header, { backgroundColor: themeColors.background }]}
          >
            <Text style={[styles.title, { color: themeColors.foreground }]}>
              Change Password
            </Text>
            <Text
              style={[styles.subtitle, { color: themeColors.mutedForeground }]}
            >
              Keep your account secure by updating your password.
            </Text>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
          >
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: themeColors.foreground }]}>
                Current password
              </Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrent}
                  placeholder="Enter current password"
                  placeholderTextColor={themeColors.mutedForeground}
                  style={[
                    styles.input,
                    {
                      backgroundColor: themeColors.secondary,
                      borderColor: themeColors.border,
                      color: themeColors.foreground,
                    },
                  ]}
                />

                <TouchableOpacity
                  onPress={() => setShowCurrent((v) => !v)}
                  style={styles.eyeIcon}
                >
                  {showCurrent ? (
                    <EyeOff size={18} color={themeColors.mutedForeground} />
                  ) : (
                    <Eye size={18} color={themeColors.mutedForeground} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: themeColors.foreground }]}>
                New password
              </Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNew}
                  placeholder="Enter new password"
                  placeholderTextColor={themeColors.mutedForeground}
                  style={[
                    styles.input,
                    {
                      backgroundColor: themeColors.secondary,
                      borderColor: themeColors.border,
                      color: themeColors.foreground,
                    },
                  ]}
                />

                <TouchableOpacity
                  onPress={() => setShowNew((v) => !v)}
                  style={styles.eyeIcon}
                >
                  {showNew ? (
                    <EyeOff size={18} color={themeColors.mutedForeground} />
                  ) : (
                    <Eye size={18} color={themeColors.mutedForeground} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: themeColors.foreground }]}>
                Confirm password
              </Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  placeholder="Confirm new password"
                  placeholderTextColor={themeColors.mutedForeground}
                  style={[
                    styles.input,
                    {
                      backgroundColor: themeColors.secondary,
                      borderColor: themeColors.border,
                      color: themeColors.foreground,
                    },
                  ]}
                />

                <TouchableOpacity
                  onPress={() => setShowConfirm((v) => !v)}
                  style={styles.eyeIcon}
                >
                  {showConfirm ? (
                    <EyeOff size={18} color={themeColors.mutedForeground} />
                  ) : (
                    <Eye size={18} color={themeColors.mutedForeground} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.rulesContainer}>
              {passwordRuleList.map((rule) => {
                const ok = passwordRules[rule.key];
                return (
                  <View key={rule.key} style={styles.ruleRow}>
                    <Text
                      style={[
                        styles.ruleBullet,
                        {
                          color: ok
                            ? themeColors.primary
                            : themeColors.mutedForeground,
                        },
                      ]}
                    >
                      {ok ? "✔" : "•"}
                    </Text>
                    <Text
                      style={[
                        styles.ruleText,
                        { color: themeColors.mutedForeground },
                      ]}
                    >
                      {rule.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {apiError ? (
              <Text
                style={[styles.errorText, { color: themeColors.destructive }]}
              >
                {apiError}
              </Text>
            ) : null}

            <TouchableOpacity
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={!canSubmit}
              style={[
                styles.button,
                {
                  backgroundColor: themeColors.primary,
                  opacity: canSubmit ? 1 : 0.45,
                },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color={themeColors.primaryForeground} />
              ) : (
                <Text
                  style={[
                    styles.buttonText,
                    { color: themeColors.primaryForeground },
                  ]}
                >
                  Update password
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    keyboardAvoiding: {
      flex: 1,
    },
    scrollContainer: {
      padding: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    header: {
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: fontSize["2xl"],
      fontWeight: fontWeight.extrabold,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: fontSize.base,
      lineHeight: 24,
    },
    card: {
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      padding: spacing.lg,
    },
    fieldGroup: {
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      marginBottom: spacing.xs,
    },
    inputWrapper: {
      position: "relative",
      justifyContent: "center",
    },
    input: {
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: fontSize.base,
      paddingRight: 45,
    },
    eyeIcon: {
      position: "absolute",
      right: 12,
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    rulesContainer: {
      marginBottom: spacing.lg,
      marginTop: spacing.sm,
    },
    ruleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.xs,
    },
    ruleBullet: {
      width: 18,
      fontSize: fontSize.sm,
      marginRight: spacing.sm,
    },
    ruleText: {
      fontSize: fontSize.sm,
      lineHeight: 20,
    },
    errorText: {
      marginBottom: spacing.md,
      fontSize: fontSize.sm,
    },
    button: {
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.md,
      alignItems: "center",
      justifyContent: "center",
      marginTop: spacing.sm,
    },
    buttonText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
    },
  });
