import React, { useState, useMemo } from 'react';
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

  const originalName = user?.name || '';
  const originalImage = user?.profilePicture || null;

  const [name, setName] = useState(originalName);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(originalImage);
  const [picked, setPicked] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [updateUser] = useUpdateUserMutation();

  // ✅ FIX: dirty state check
  const isDirty = useMemo(() => {
    return name !== originalName || picked !== null;
  }, [name, picked, originalName]);

  const handleChooseFile = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (res.canceled || !res.assets?.length) return;

    const asset = res.assets[0];

    const file = {
      uri: asset.uri,
      name: asset.fileName || 'avatar.jpg',
      type: asset.mimeType || 'image/jpeg',
    };

    setPicked(file);
    setAvatarPreview(asset.uri);
  };

  const handleSave = async () => {
    // ✅ FIX: stop API if nothing changed
    if (!isDirty) {
      Alert.alert('No changes', 'You have not updated anything');
      return;
    }

    try {
      setIsSaving(true);

      const form = new FormData();
      form.append('name', name);

      if (picked) {
        // @ts-ignore
        form.append('profilePicture', {
          uri: picked.uri,
          name: picked.name,
          type: picked.type,
        });
      }

      const resp = await updateUser(form as any).unwrap();

      const updated = (resp as any)?.data?.user || (resp as any)?.data || (resp as any);

      if (updated) {
        const profileUrl = updated.profilePicture || updated.avatar || null;

        dispatch(
          updateUserStore({
            name: updated.name,
            profilePicture: profileUrl || undefined,
          })
        );

        setPicked(null);
        setAvatarPreview(profileUrl);
        setName(updated.name);
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        
        <View style={styles.navbar}>
          <Text style={styles.navbarTitle}>Settings</Text>
          <Text style={styles.navbarSubtitle}>
            Manage your account settings and preferences.
          </Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>

            {/* Profile */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: themeColors.foreground }]}>
                Profile Picture
              </Text>

              <View style={styles.avatarRow}>
                <View style={styles.avatarWrap}>
                  {avatarPreview ? (
                    <Image source={{ uri: avatarPreview }} style={styles.avatarImage} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors.muted }]}>
                      <User size={32} color={themeColors.mutedForeground} />
                    </View>
                  )}

                  <View style={[styles.cameraIcon, { backgroundColor: themeColors.primary }]}>
                    <Camera size={12} color={themeColors.primaryForeground} />
                  </View>
                </View>

                <View style={styles.avatarControls}>
                  <TouchableOpacity
                    style={[styles.changePhotoBtn, { borderColor: themeColors.border }]}
                    onPress={handleChooseFile}
                  >
                    <Text style={[styles.changePhotoBtnText, { color: themeColors.foreground }]}>
                      Change photo
                    </Text>
                  </TouchableOpacity>

                  <Text style={[styles.avatarHint, { color: themeColors.mutedForeground }]}>
                    Recommended: 300x300 JPG/PNG
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: themeColors.foreground }]}>
                Name
              </Text>

              <TextInput
                value={name}
                onChangeText={setName}
                style={[styles.input, { borderColor: themeColors.border, color: themeColors.foreground }]}
                placeholder="Enter name"
                placeholderTextColor={themeColors.mutedForeground}
              />
            </View>

            {/* Button */}
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: themeColors.primary },
                (!isDirty || isSaving) && { opacity: 0.5 },
              ]}
              onPress={handleSave}
              disabled={!isDirty || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={themeColors.primaryForeground} />
              ) : (
                <Text style={[styles.buttonText, { color: themeColors.primaryForeground }]}>
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
    container: { flex: 1, backgroundColor: theme.background },
    navbar: { padding: spacing.lg },
    navbarTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
    navbarSubtitle: { fontSize: fontSize.sm, opacity: 0.7, marginTop: 4 },
    content: { padding: spacing.lg },
    card: { padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1 },

    fieldGroup: { marginBottom: spacing.lg },
    label: { marginBottom: 6, fontSize: fontSize.sm },

    avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarWrap: { position: 'relative' },
    avatarImage: { width: 80, height: 80, borderRadius: 40 },
    avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },

    cameraIcon: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },

    avatarControls: { flex: 1 },
    changePhotoBtn: { borderWidth: 1, padding: 8, borderRadius: 6, alignSelf: 'flex-start' },
    changePhotoBtnText: { fontSize: 12 },
    avatarHint: { fontSize: 10, marginTop: 4 },

    divider: { height: 1, marginVertical: 16 },

    input: { borderWidth: 1, padding: 10, borderRadius: 8 },

    button: { padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { fontWeight: '600' },
  });