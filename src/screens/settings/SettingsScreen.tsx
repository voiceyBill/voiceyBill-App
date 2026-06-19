import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  User,
  Palette,
  CreditCard,
  Lock,
  ChevronRight,
  LogOut,
  Tag,
} from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/NotificationContext";
import { useConfirm } from "../../context/ConfirmContext";
import { useTypedSelector, useAppDispatch } from "../../store/hooks";
import { logout } from "../../features/auth/authSlice";
import {
  useDeleteUserMutation,
  useSendDeleteAccountOtpMutation,
} from "../../features/user/userAPI";
import { apiClient } from "../../store/api-client";
import { deleteRefreshToken } from "../../lib/tokenStorage";
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

type Section = {
  title: string;
  items: MenuItem[];
};

type MenuItem = {
  title: string;
  subtitle: string;
  screen: string;
  icon: React.ElementType;
};

const sections: Section[] = [
  {
    title: "Personal",
    items: [
      {
        title: "Account",
        subtitle: "Update profile and avatar",
        screen: "Account",
        icon: User,
      },
    ],
  },
  {
    title: "Customization",
    items: [
      {
        title: "Categories",
        subtitle: "Create and manage custom transaction categories",
        screen: "CategorySettings",
        icon: Tag,
      },
    ],
  },
  {
    title: "Security",
    items: [
      {
        title: "Password",
        subtitle: "Update your password securely",
        screen: "ChangePassword",
        icon: Lock,
      },
    ],
  },
  {
    title: "Preferences",
    items: [
      {
        title: "Appearance",
        subtitle: "Theme and display settings",
        screen: "Appearance",
        icon: Palette,
      },
    ],
  },
  {
    title: "Subscription",
    items: [
      {
        title: "Billing",
        subtitle: "Manage subscription and payments",
        screen: "Billing",
        icon: CreditCard,
      },
    ],
  },
];

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const dispatch = useAppDispatch();
  const user = useTypedSelector((s) => s.auth.user);

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: "Log out",
      message: "Are you sure you want to log out?",
      confirmText: "Log out",
      destructive: true,
    });
    if (!confirmed) return;

    await deleteRefreshToken();
    dispatch(logout());
    dispatch(apiClient.util.resetApiState());
  };

  const [sendDeleteAccountOtp] = useSendDeleteAccountOtpMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteOtp, setDeleteOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSendOtp = async () => {
    try {
      setIsSendingOtp(true);
      await sendDeleteAccountOtp().unwrap();
      showToast({
        type: "success",
        title: "OTP sent",
        message: "A verification code has been sent to your email.",
      });
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Failed to send OTP",
        message: err?.data?.message || "Unable to send verification code",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText.trim() !== "DELETE") {
      showToast({
        type: "warning",
        title: "Confirmation required",
        message: 'Type DELETE to confirm account deletion.',
      });
      return;
    }

    if (!deleteOtp.trim()) {
      showToast({
        type: "warning",
        title: "OTP required",
        message: "Enter the 6-digit OTP sent to your email.",
      });
      return;
    }

    try {
      setIsDeleting(true);
      await deleteUser({ otp: deleteOtp.trim() }).unwrap();
      await deleteRefreshToken();
      dispatch(logout());
      dispatch(apiClient.util.resetApiState());
      showToast({ type: "success", title: "Account deleted", message: "Your account has been deleted." });
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Deletion failed",
        message: err?.data?.message || "Could not delete account",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setConfirmText("");
      setDeleteOtp("");
    }
  };

  const styles = createStyles(themeColors);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* User card — taps into Account settings */}
        {user && (
          <TouchableOpacity
            style={[
              styles.userCard,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
                marginTop: Math.max(insets.top, spacing.sm),
              },
            ]}
            onPress={() => navigation.navigate("Account" as never)}
            activeOpacity={0.7}
          >
            {user.profilePicture ? (
              <Image
                source={{ uri: user.profilePicture }}
                style={styles.userAvatarImage}
              />
            ) : (
              <View
                style={[
                  styles.userAvatar,
                  { backgroundColor: themeColors.primary + "18" },
                ]}
              >
                <Text
                  style={[
                    styles.userInitial,
                    { color: themeColors.primary },
                  ]}
                >
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </Text>
              </View>
            )}
            <View style={styles.userInfo}>
              <Text
                style={[styles.userName, { color: themeColors.foreground }]}
                numberOfLines={1}
              >
                {user.name}
              </Text>
              <Text
                style={[
                  styles.userEmail,
                  { color: themeColors.mutedForeground },
                ]}
                numberOfLines={1}
              >
                {user.email}
              </Text>
              <Text
                style={[styles.userEditHint, { color: themeColors.primary }]}
              >
                Edit profile
              </Text>
            </View>
            <ChevronRight size={18} color={themeColors.mutedForeground} />
          </TouchableOpacity>
        )}

        <View style={styles.content}>
          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: themeColors.mutedForeground },
                ]}
              >
                {section.title}
              </Text>
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                {section.items.map((item, index) => {
                  const IconComponent = item.icon;
                  const isLast = index === section.items.length - 1;
                  return (
                    <TouchableOpacity
                      key={item.screen}
                      style={[
                        styles.menuItem,
                        !isLast && {
                          borderBottomWidth: 1,
                          borderBottomColor: themeColors.border,
                        },
                      ]}
                      onPress={() => navigation.navigate(item.screen as never)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.menuIconWrap,
                          { backgroundColor: themeColors.muted },
                        ]}
                      >
                        <IconComponent
                          size={18}
                          color={themeColors.foreground}
                          strokeWidth={1.75}
                        />
                      </View>
                      <View style={styles.menuText}>
                        <Text
                          style={[
                            styles.menuTitle,
                            { color: themeColors.foreground },
                          ]}
                        >
                          {item.title}
                        </Text>
                        <Text
                          style={[
                            styles.menuSubtitle,
                            { color: themeColors.mutedForeground },
                          ]}
                        >
                          {item.subtitle}
                        </Text>
                      </View>
                      <ChevronRight
                        size={18}
                        color={themeColors.mutedForeground}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Logout */}
          <View style={styles.section}>
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.menuIconWrap,
                    { backgroundColor: themeColors.muted },
                  ]}
                >
                  <LogOut
                    size={18}
                    color={themeColors.destructive}
                    strokeWidth={1.75}
                  />
                </View>
                <View style={styles.menuText}>
                  <Text
                    style={[
                      styles.menuTitle,
                      { color: themeColors.destructive },
                    ]}
                  >
                    Log out
                  </Text>
                  <Text
                    style={[
                      styles.menuSubtitle,
                      { color: themeColors.mutedForeground },
                    ]}
                  >
                    Sign out of your account
                  </Text>
                </View>
                <ChevronRight size={18} color={themeColors.mutedForeground} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.menuItem,
                  { borderTopWidth: 1, borderTopColor: themeColors.border },
                ]}
                onPress={() => setShowDeleteModal(true)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.menuIconWrap,
                    { backgroundColor: themeColors.muted },
                  ]}
                >
                  <LogOut
                    size={18}
                    color={themeColors.destructive}
                    strokeWidth={1.75}
                  />
                </View>
                <View style={styles.menuText}>
                  <Text
                    style={[
                      styles.menuTitle,
                      { color: themeColors.destructive },
                    ]}
                  >
                    Delete account
                  </Text>
                  <Text
                    style={[
                      styles.menuSubtitle,
                      { color: themeColors.mutedForeground },
                    ]}
                  >
                    Permanently delete your account and data
                  </Text>
                </View>
                <ChevronRight size={18} color={themeColors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          {/* App version */}
          <Text
            style={[styles.version, { color: themeColors.mutedForeground }]}
          >
            VoiceyBill · v1.0.0
          </Text>

          <Modal
            visible={showDeleteModal}
            transparent
            animationType="fade"
            onRequestClose={() => {
              setShowDeleteModal(false);
              Keyboard.dismiss();
            }}
          >
            <TouchableWithoutFeedback
              onPress={() => {
                setShowDeleteModal(false);
                setConfirmText("");
                setDeleteOtp("");
                Keyboard.dismiss();
              }}
            >
              <View style={styles.deleteModalOverlay}>
                <KeyboardAvoidingView
                  behavior={Platform.OS === "ios" ? "padding" : "height"}
                  keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
                >
                  <TouchableWithoutFeedback onPress={() => {}}>
                    <ScrollView
                      style={styles.deleteModalContainer}
                      contentContainerStyle={{ flexGrow: 1 }}
                      bounces={false}
                    >
                      <View
                        style={[
                          styles.deleteModalCard,
                          { backgroundColor: themeColors.card },
                        ]}
                      >
                        <View style={styles.deleteModalHeader}>
                          <Text
                            style={[
                              styles.deleteModalTitle,
                              { color: themeColors.foreground },
                            ]}
                          >
                            Delete Account
                          </Text>
                          <Text
                            style={[
                              styles.deleteModalDesc,
                              { color: themeColors.mutedForeground },
                            ]}
                          >
                            This action is permanent and cannot be undone.
                          </Text>
                        </View>
                        <View style={styles.deleteModalBody}>
                          <Text
                            style={[
                              styles.deleteInputLabel,
                              { color: themeColors.foreground },
                            ]}
                          >
                            Type DELETE to confirm
                          </Text>
                          <TextInput
                            value={confirmText}
                            onChangeText={setConfirmText}
                            placeholder="Type DELETE"
                            placeholderTextColor={themeColors.mutedForeground}
                            style={[
                              styles.deleteInput,
                              {
                                borderColor: themeColors.border,
                                color: themeColors.foreground,
                                backgroundColor: themeColors.muted,
                              },
                            ]}
                          />
                          <View
                            style={[
                              styles.deleteOtpSection,
                              { borderTopColor: themeColors.border },
                            ]}
                          >
                            <Text
                              style={[
                                styles.deleteInputLabel,
                                { color: themeColors.foreground },
                              ]}
                            >
                              Verification Code
                            </Text>
                            <Text
                              style={[
                                styles.deleteOtpHint,
                                { color: themeColors.mutedForeground },
                              ]}
                            >
                              Check your email for the code
                            </Text>
                            <TouchableOpacity
                              onPress={handleSendOtp}
                              disabled={isSendingOtp}
                              style={[
                                styles.deleteSendOtpBtn,
                                {
                                  backgroundColor: themeColors.primary,
                                  opacity: isSendingOtp ? 0.6 : 1,
                                },
                              ]}
                              activeOpacity={0.8}
                            >
                              <Text
                                style={[
                                  styles.deleteSendOtpText,
                                  { color: themeColors.primaryForeground },
                                ]}
                              >
                                {isSendingOtp ? "Sending..." : "Send Code"}
                              </Text>
                            </TouchableOpacity>
                            <TextInput
                              value={deleteOtp}
                              onChangeText={setDeleteOtp}
                              keyboardType="numeric"
                              maxLength={6}
                              placeholder="000000"
                              placeholderTextColor={themeColors.mutedForeground}
                              style={[
                                styles.deleteOtpInput,
                                {
                                  borderColor: themeColors.border,
                                  color: themeColors.foreground,
                                  backgroundColor: themeColors.muted,
                                },
                              ]}
                            />
                          </View>
                        </View>
                        <View
                          style={[
                            styles.deleteModalFooter,
                            { borderTopColor: themeColors.border },
                          ]}
                        >
                          <TouchableOpacity
                            onPress={() => {
                              setShowDeleteModal(false);
                              setConfirmText("");
                              setDeleteOtp("");
                            }}
                            style={[
                              styles.deleteBtnCancel,
                              { borderColor: themeColors.border },
                            ]}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.deleteBtnCancelText,
                                { color: themeColors.foreground },
                              ]}
                            >
                              Cancel
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={handleDelete}
                            disabled={
                              isDeleting ||
                              confirmText.trim() !== "DELETE" ||
                              !deleteOtp.trim()
                            }
                            style={[
                              styles.deleteBtnConfirm,
                              {
                                opacity:
                                  isDeleting ||
                                  confirmText.trim() !== "DELETE" ||
                                  !deleteOtp.trim()
                                    ? 0.5
                                    : 1,
                              },
                            ]}
                            activeOpacity={0.8}
                          >
                            {isDeleting ? (
                              <ActivityIndicator color="#fff" size="small" />
                            ) : (
                              <Text style={styles.deleteBtnConfirmText}>
                                Delete
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </ScrollView>
                  </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: typeof colors.light) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    userCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      padding: spacing.md,
      borderRadius: cardRadius,
      borderWidth: StyleSheet.hairlineWidth,
      ...shadows.card,
    },
    userAvatarImage: {
      width: 52,
      height: 52,
      borderRadius: 26,
      resizeMode: "cover",
    },
    userAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
    },
    userInitial: { fontFamily: fontFamily.bold, fontSize: 20 },
    userInfo: { flex: 1, minWidth: 0 },
    userName: { fontFamily: fontFamily.semibold, fontSize: 16, letterSpacing: -0.2 },
    userEmail: { fontFamily: fontFamily.regular, fontSize: 13, marginTop: 2 },
    userEditHint: { fontFamily: fontFamily.medium, fontSize: 12, marginTop: 4 },
    content: { paddingHorizontal: spacing.lg, gap: spacing.lg },
    section: { gap: spacing.sm },
    sectionTitle: {
      fontFamily: fontFamily.semibold,
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      paddingHorizontal: spacing.xs,
    },
    sectionCard: {
      borderRadius: cardRadius,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: "hidden",
      ...shadows.card,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.sm + 4,
      paddingHorizontal: spacing.md,
    },
    menuIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    menuText: { flex: 1, minWidth: 0 },
    menuTitle: { fontFamily: fontFamily.medium, fontSize: 14 },
    menuSubtitle: { fontFamily: fontFamily.regular, fontSize: 12, marginTop: 1 },
    version: {
      fontFamily: fontFamily.regular,
      fontSize: 11,
      textAlign: "center",
      marginTop: spacing.md,
      opacity: 0.6,
    },
    deleteModalOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    deleteModalContainer: { width: "100%", maxHeight: "85%" },
    deleteModalCard: {
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 12,
    },
    deleteModalHeader: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(0, 0, 0, 0.06)",
    },
    deleteModalTitle: {
      fontFamily: fontFamily.bold,
      fontSize: 18,
      marginBottom: spacing.xs,
    },
    deleteModalDesc: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 19 },
    deleteModalBody: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
    },
    deleteInputLabel: {
      fontFamily: fontFamily.medium,
      fontSize: 13,
      marginBottom: spacing.xs,
    },
    deleteInput: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      fontFamily: fontFamily.regular,
      fontSize: 15,
    },
    deleteOtpSection: {
      marginTop: spacing.lg,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
    },
    deleteOtpHint: {
      fontSize: fontSize.xs,
      marginBottom: spacing.md,
      marginTop: spacing.xs,
    },
    deleteSendOtpBtn: {
      paddingVertical: spacing.sm + 4,
      borderRadius: borderRadius.full,
      alignItems: "center",
      marginBottom: spacing.md,
    },
    deleteSendOtpText: { fontFamily: fontFamily.semibold, fontSize: 14 },
    deleteOtpInput: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      fontFamily: fontFamily.semibold,
      fontSize: 18,
      textAlign: "center",
      letterSpacing: 4,
    },
    deleteModalFooter: {
      flexDirection: "row",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      borderTopWidth: 1,
    },
    deleteBtnCancel: {
      flex: 1,
      paddingVertical: spacing.sm + 4,
      borderRadius: borderRadius.full,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: "center",
      justifyContent: "center",
    },
    deleteBtnCancelText: { fontFamily: fontFamily.semibold, fontSize: 14 },
    deleteBtnConfirm: {
      flex: 1,
      paddingVertical: spacing.sm + 4,
      borderRadius: borderRadius.full,
      backgroundColor: "#ff3b30",
      alignItems: "center",
      justifyContent: "center",
    },
    deleteBtnConfirmText: {
      fontFamily: fontFamily.semibold,
      fontSize: 14,
      color: "#fff",
    },
  });
