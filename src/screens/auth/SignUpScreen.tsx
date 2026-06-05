import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Check, Circle, Eye, EyeOff } from 'lucide-react-native';
import { useRegisterMutation } from '../../features/auth/authAPI';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';
import Logo from '../../components/common/Logo';
import {
  getPasswordRules,
  mapAuthApiErrors,
} from '../../features/auth/authValidation';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton';
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
  const rules = getPasswordRules(password);
  const signupRules = {
    ...rules,
    lowercase: /[a-z]/.test(password),
  };
  const passwordRequirements = [
    { label: 'At least 8 characters', met: signupRules.length },
    { label: 'One uppercase letter', met: signupRules.uppercase },
    { label: 'One lowercase letter', met: signupRules.lowercase },
    { label: 'One number', met: signupRules.number },
    { label: 'One special character', met: signupRules.special },
  ];
  const isSignupPasswordValid = passwordRequirements.every((requirement) => requirement.met);

  const getSignupPasswordError = () => {
    if (!password) return 'Password is required';
    if (!isSignupPasswordValid) {
      return 'Password must contain at least 8 characters, uppercase, lowercase, number, and special character';
    }
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
      setErrors(mapAuthApiErrors(error, getSignupPasswordError() || 'Registration failed. Please try again.', 'password'));
    }
  };

  const styles = createStyles(themeColors);
  const canSubmit =
    !isLoading &&
    name.trim() !== '' &&
    email.trim() !== '' &&
    password !== '' &&
    !getSignupPasswordError();

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
                {!!errors.name && <Text style={styles.error}>{errors.name}</Text>}
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
                {!!errors.email && <Text style={styles.error}>{errors.email}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View
                  style={[
                    styles.passwordWrap,
                    isPasswordFocused && styles.passwordWrapFocused,
                    password !== '' && isSignupPasswordValid && styles.passwordWrapFocused,
                    errors.password && styles.inputError,
                  ]}
                >
                  <TextInput
                    ref={passwordRef}
                    style={styles.passwordInput}
                    placeholder="At least 8 characters"
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
                {!!errors.password && <Text style={styles.error}>{errors.password}</Text>}
                <View style={styles.passwordRules}>
                  {passwordRequirements.map((requirement) => (
                    <View key={requirement.label} style={styles.passwordRuleRow}>
                      {requirement.met ? (
                        <Check size={13} color={themeColors.incomeText} strokeWidth={2.4} />
                      ) : (
                        <Circle size={12} color={themeColors.foreground} strokeWidth={1.8} />
                      )}
                      <Text style={[styles.passwordRule, requirement.met && styles.passwordRuleValid]}>
                        {requirement.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, !canSubmit && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={!canSubmit || isGoogleLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={themeColors.primaryForeground} />
                ) : (
                  <Text style={[styles.buttonText, { color: themeColors.primaryForeground }]}>Create account</Text>
                )}
              </TouchableOpacity>

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
              {!!googleError && <Text style={styles.error}>{googleError}</Text>}

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

const createStyles = (theme: typeof colors.light) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollContent: {
      flexGrow: 1,
      padding: spacing.lg,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xxxl,
    },
    content: { maxWidth: 400, width: '100%', alignSelf: 'center' },
    header: { marginBottom: spacing.xl, alignItems: 'center' },
    title: {
      fontSize: fontSize['2xl'],
      fontWeight: fontWeight.bold,
      color: theme.foreground,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    subtitle: { fontSize: fontSize.sm, color: theme.mutedForeground, textAlign: 'center' },
    form: { gap: spacing.md },
    inputGroup: { gap: spacing.sm },
    label: { fontSize: fontSize.sm, color: theme.foreground, fontWeight: fontWeight.medium },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: fontSize.md,
      color: theme.foreground,
      backgroundColor: theme.card,
    },
    inputError: { borderColor: theme.destructive },
    passwordWrapFocused: { borderColor: theme.primary },
    passwordWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      backgroundColor: theme.card,
    },
    passwordInput: {
      flex: 1,
      paddingVertical: spacing.md,
      fontSize: fontSize.md,
      color: theme.foreground,
    },
    error: { fontSize: fontSize.xs, color: theme.destructive },
    passwordRules: { marginTop: spacing.xs, gap: spacing.sm },
    passwordRuleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    passwordRule: { fontSize: fontSize.xs, color: theme.foreground },
    passwordRuleValid: { color: theme.incomeText },
    button: {
      backgroundColor: theme.primary,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginVertical: spacing.xs,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: theme.border },
    dividerText: { fontSize: fontSize.xs, color: theme.mutedForeground },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.sm },
    footerText: { fontSize: fontSize.sm, color: theme.mutedForeground },
    link: {
      fontSize: fontSize.sm,
      color: theme.foreground,
      fontWeight: fontWeight.semibold,
      textDecorationLine: 'underline',
    },
  });
