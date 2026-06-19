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
import { useNavigation } from '@react-navigation/native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useRegisterMutation } from '../../features/auth/authAPI';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';
import { createAuthStyles } from '../../theme/authStyles';
import Logo from '../../components/common/Logo';
import { getPasswordRules, mapAuthApiErrors } from '../../features/auth/authValidation';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton';
import PasswordRequirements from '../../components/auth/PasswordRequirements';
import { useGoogleAuth } from '../../features/auth/hooks/useGoogleAuth';

export default function SignUpScreen() {
  const navigation = useNavigation();
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const [register, { isLoading }] = useRegisterMutation();
  const {
    error: googleError,
    isGoogleLoading,
    isGoogleReady,
    signInWithGoogle,
  } = useGoogleAuth();
  const scrollRef = useRef<ScrollView>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const signupRules = {
    ...getPasswordRules(password),
    lowercase: /[a-z]/.test(password),
  };
  const isSignupPasswordValid = Object.values(signupRules).every(Boolean);

  const getSignupPasswordError = () => {
    if (!password) return 'Password is required';
    if (!isSignupPasswordValid) return 'Complete all password requirements below';
    return undefined;
  };

  const scrollToFormEnd = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
  };

  const validate = () => {
    const newErrors: { name?: string; email?: string; password?: string } = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email.trim())) newErrors.email = 'Invalid email address';

    const passwordError = getSignupPasswordError();
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      await register({ name: name.trim(), email: email.trim(), password }).unwrap();
      (navigation as any).navigate('VerifyOtp', { email: email.trim() });
    } catch (error: any) {
      setErrors(
        mapAuthApiErrors(
          error,
          getSignupPasswordError() || 'Registration failed. Please try again.',
          'password',
        ),
      );
    }
  };

  const styles = createAuthStyles(themeColors);
  const canSubmit =
    !isLoading &&
    name.trim() !== '' &&
    email.trim() !== '' &&
    password !== '' &&
    isSignupPasswordValid;

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
          <View style={styles.content}>
            <View style={styles.header}>
              <Logo size="lg" />
              <Text style={styles.title}>Create your account</Text>
              <Text style={styles.subtitle}>Start tracking expenses with VoiceyBill</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="Your full name"
                  placeholderTextColor={themeColors.mutedForeground}
                  value={name}
                  onChangeText={(v) => {
                    setName(v);
                    setErrors((e) => ({ ...e, name: undefined }));
                  }}
                  autoCapitalize="words"
                  editable={!isLoading}
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
                {errors.name ? <Text style={styles.fieldError}>{errors.name}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  ref={emailRef}
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="you@example.com"
                  placeholderTextColor={themeColors.mutedForeground}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setErrors((e) => ({ ...e, email: undefined }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                  returnKeyType="next"
                  submitBehavior="submit"
                  onFocus={scrollToFormEnd}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
                {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View
                  style={[
                    styles.passwordWrap,
                    (isPasswordFocused || isSignupPasswordValid) && styles.passwordWrapFocused,
                    errors.password && styles.inputError,
                  ]}
                >
                  <TextInput
                    ref={passwordRef}
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
                    returnKeyType="done"
                    onFocus={() => {
                      setIsPasswordFocused(true);
                      scrollToFormEnd();
                    }}
                    onBlur={() => setIsPasswordFocused(false)}
                    onSubmitEditing={handleRegister}
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
                  includeLowercase
                  alwaysShowRules
                />
              </View>

              <TouchableOpacity
                style={[styles.button, !canSubmit && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={!canSubmit || isGoogleLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={themeColors.primaryForeground} />
                ) : (
                  <Text style={[styles.buttonText, { color: themeColors.primaryForeground }]}>
                    Create account
                  </Text>
                )}
              </TouchableOpacity>

              {!canSubmit && password.length > 0 && !isSignupPasswordValid ? (
                <Text style={styles.otpHint}>Finish the password requirements to continue</Text>
              ) : null}

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <GoogleAuthButton
                themeColors={themeColors}
                onPress={signInWithGoogle}
                isLoading={isGoogleLoading}
                disabled={isLoading || isGoogleLoading || !isGoogleReady}
              />
              {googleError ? <Text style={styles.fieldError}>{googleError}</Text> : null}

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignIn' as never)}>
                  <Text style={styles.link}>Sign in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
