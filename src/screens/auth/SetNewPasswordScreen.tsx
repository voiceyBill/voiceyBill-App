import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResetPasswordMutation } from '../../features/auth/authAPI';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';
import { createAuthStyles } from '../../theme/authStyles';
import Logo from '../../components/common/Logo';
import PasswordRequirements from '../../components/auth/PasswordRequirements';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import {
  getPasswordValidationMessage,
  isPasswordValid,
  mapAuthApiErrors,
} from '../../features/auth/authValidation';
import { useToast } from '../../context/NotificationContext';

type SetNewPasswordRouteProp = RouteProp<AuthStackParamList, 'SetNewPassword'>;

export default function SetNewPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute<SetNewPasswordRouteProp>();
  const { email, otp } = route.params;
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { showToast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const scrollRef = useRef<ScrollView>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const scrollToFormEnd = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
  };

  const validate = () => {
    const newErrors: typeof errors = {};
    const passwordError = getPasswordValidationMessage(password);

    if (passwordError) newErrors.password = passwordError;
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords don't match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) return;

    try {
      await resetPassword({ email, otp, password }).unwrap();
      showToast({
        type: 'success',
        title: 'Password reset',
        message: 'Your password has been updated. Please sign in.',
      });
      (navigation as any).navigate('SignIn');
    } catch (error: any) {
      setErrors(mapAuthApiErrors(error, 'Failed to reset password. Please try again.', 'password'));
      showToast({
        type: 'error',
        title: 'Reset failed',
        message: error?.data?.message || 'Failed to reset password. Please try again.',
      });
    }
  };

  const styles = createAuthStyles(themeColors);
  const canSubmit =
    !isLoading &&
    password !== '' &&
    confirmPassword !== '' &&
    password === confirmPassword &&
    isPasswordValid(password);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          ref={scrollRef}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color={themeColors.foreground} />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.header}>
              <Logo size="lg" />
              <Text style={styles.title}>Create new password</Text>
              <Text style={styles.subtitle}>Choose a strong password for your account.</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>New password</Text>
                <View style={[styles.passwordWrap, errors.password ? styles.inputError : null]}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Create a strong password"
                    placeholderTextColor={themeColors.mutedForeground}
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      setErrors((e) => ({ ...e, password: undefined }));
                    }}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    returnKeyType="next"
                    submitBehavior="submit"
                    onFocus={scrollToFormEnd}
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={themeColors.mutedForeground} />
                    ) : (
                      <Eye size={18} color={themeColors.mutedForeground} />
                    )}
                  </TouchableOpacity>
                </View>
                {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
                <PasswordRequirements
                  password={password}
                  themeColors={themeColors}
                  alwaysShowRules
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm password</Text>
                <View
                  style={[styles.passwordWrap, errors.confirmPassword ? styles.inputError : null]}
                >
                  <TextInput
                    ref={confirmPasswordRef}
                    style={styles.passwordInput}
                    placeholder="Re-enter your password"
                    placeholderTextColor={themeColors.mutedForeground}
                    value={confirmPassword}
                    onChangeText={(v) => {
                      setConfirmPassword(v);
                      setErrors((e) => ({ ...e, confirmPassword: undefined }));
                    }}
                    secureTextEntry={!showConfirm}
                    editable={!isLoading}
                    returnKeyType="done"
                    onFocus={scrollToFormEnd}
                    onSubmitEditing={handleReset}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirm(!showConfirm)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showConfirm ? (
                      <EyeOff size={18} color={themeColors.mutedForeground} />
                    ) : (
                      <Eye size={18} color={themeColors.mutedForeground} />
                    )}
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword ? (
                  <Text style={styles.fieldError}>{errors.confirmPassword}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={[styles.button, !canSubmit && styles.buttonDisabled]}
                onPress={handleReset}
                disabled={!canSubmit}
              >
                {isLoading ? (
                  <ActivityIndicator color={themeColors.primaryForeground} />
                ) : (
                  <Text style={[styles.buttonText, { color: themeColors.primaryForeground }]}>
                    Reset password
                  </Text>
                )}
              </TouchableOpacity>

              {!canSubmit && password.length > 0 && !isPasswordValid(password) ? (
                <Text style={styles.otpHint}>Complete all password requirements to continue</Text>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
