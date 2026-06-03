import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Camera } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useTypedSelector, useAppDispatch } from '../../store/hooks';
import { updateUser as updateUserStore } from '../../features/auth/authSlice';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme/colors';
import * as ImagePicker from 'expo-image-picker';
import { useUpdateUserMutation } from '../../features/user/userAPI';

export default function AccountScreen() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const dispatch = useAppDispatch();
  const user = useTypedSelector((state) => state.auth.user);

  const [originalName, setOriginalName] = useState(user?.name || '');
  const [originalProfilePicture, setOriginalProfilePicture] = useState<string | null>(
    user?.profilePicture || null
  );

  const [name, setName] = useState(originalName);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(originalProfilePicture);
  const [picked, setPicked] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [updateUser] = useUpdateUserMutation();

  // Detect changes
  const hasChanges = useMemo(() => {
    const trimmedName = name.trim();
    const trimmedOriginalName = originalName.trim();

    return trimmedName !== trimmedOriginalName || !!picked;
  }, [name, originalName, picked]);

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
      name: asset.fileName || 'avatar.jpg',
      type: asset.mimeType || 'image/jpeg',
    });

    setAvatarPreview(asset.uri);
  };

  const handleSave = async () => {
    // Prevent unnecessary API calls
    if (!hasChanges) return;

    try {
      setIsSaving(true);

      const form = new FormData();

      form.append('name', name.trim());

      if (picked) {
        // @ts-ignore
        form.append('profilePicture', {
          uri: picked.uri,
          name: picked.name,
          type: picked.type,
        });
      }

      const resp = await updateUser(form as any).unwrap();

      const updated =
        (resp as any)?.data?.user ||
        (resp as any)?.data ||
        (resp as any);

      if (updated) {
        const profileUrl =
          updated.profilePicture ||
          updated.avatar ||
          null;

        dispatch(
          updateUserStore({
            name: updated.name,
            profilePicture: profileUrl || undefined,
          })
        );

        const newName = updated.name || name;
        const newProfilePicture = profileUrl || avatarPreview;

        setOriginalName(newName);
        setOriginalProfilePicture(newProfilePicture);
        setName(newName);
        setAvatarPreview(newProfilePicture);
        setPicked(null);
      }

      Alert.alert('Saved', 'Account updated successfully');
    } catch {
      Alert.alert('Update failed', 'Could not update your account');
    } finally {
      setIsSaving(false);
    }
  };

  const styles = createStyles(themeColors);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        {/* Navbar */}
        <View style={styles.navbar}>
          <Text style={styles.navbarTitle}>Settings</Text>
          <Text style={styles.navbarSubtitle}>
            Manage your account settings and set e-mail preferences.
          </Text>
        </View>

        <View style={styles.content}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
          >
            {/* Profile Picture */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.label,
                  { color: themeColors.foreground },
                ]}
              >
                Profile Picture
              </Text>

              <View style={styles.avatarRow}>
                {/* Avatar */}
                <View style={styles.avatarWrap}>
                  {avatarPreview ? (
                    <Image
                      source={{ uri: avatarPreview }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <View
                      style={[
                        styles.avatarPlaceholder,
                        { backgroundColor: themeColors.muted },
                      ]}
                    >
                      <User
                        size={32}
                        color={themeColors.mutedForeground}
                        strokeWidth={1.5}
                      />
                    </View>
                  )}

                  <View
                    style={[
                      styles.cameraIcon,
                      {
                        backgroundColor: themeColors.primary,
                        borderColor: themeColors.card,
                      },
                    ]}
                  >
                    <Camera
                      size={13}
                      color={themeColors.primaryForeground}
                    />
                  </View>
                </View>

                {/* Controls */}
                <View style={styles.avatarControls}>
                  <TouchableOpacity
                    style={[
                      styles.changePhotoBtn,
                      {
                        borderColor: themeColors.border,
                        backgroundColor: themeColors.background,
                      },
                    ]}
                    onPress={handleChooseFile}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.changePhotoBtnText,
                        { color: themeColors.foreground },
                      ]}
                    >
                      Change photo
                    </Text>
                  </TouchableOpacity>

                  <Text
                    style={[
                      styles.avatarHint,
                      { color: themeColors.mutedForeground },
                    ]}
                  >
                    Recommended: Square JPG, PNG, at least 300×300px.
                  </Text>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View
              style={[
                styles.divider,
                { backgroundColor: themeColors.border },
              ]}
            />

            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.label,
                  { color: themeColors.foreground },
                ]}
              >
                Name
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

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: hasChanges
                    ? themeColors.primary
                    : themeColors.muted,
                },
                (isSaving || !hasChanges) && {
                  opacity: 0.7,
                },
              ]}
              onPress={handleSave}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? (
                <ActivityIndicator
                  color={themeColors.primaryForeground}
                />
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
                  Update account
                </Text>
              )}
            </TouchableOpacity>
          </View>
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

    navbar: {
      backgroundColor: theme.navbar,
      padding: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
    },

    navbarTitle: {
      fontSize: fontSize['2xl'],
      fontWeight: fontWeight.bold,
      color: theme.navbarForeground,
    },

    navbarSubtitle: {
      fontSize: fontSize.sm,
      color: theme.navbarForeground,
      opacity: 0.8,
      marginTop: spacing.xs,
    },

    content: {
      padding: spacing.lg,
    },

    card: {
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      padding: spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },

    fieldGroup: {
      marginBottom: spacing.lg,
    },

    label: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      marginBottom: spacing.sm,
    },

    avatarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
    },

    avatarWrap: {
      position: 'relative',
      flexShrink: 0,
    },

    avatarImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
      resizeMode: 'cover',
    },

    avatarPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },

    cameraIcon: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },

    avatarControls: {
      flex: 1,
      gap: spacing.sm,
    },

    changePhotoBtn: {
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },

    changePhotoBtnText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
    },

    avatarHint: {
      fontSize: fontSize.xs,
      lineHeight: 16,
    },

    divider: {
      height: 1,
      marginBottom: spacing.lg,
    },

    input: {
      borderWidth: 1,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: fontSize.md,
    },

    button: {
      padding: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginTop: spacing.xs,
    },

    buttonText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
    },
  });
