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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useRegisterMutation } from '../../features/auth/authAPI';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';
import Logo from '../../components/common/Logo';

export default function SignUpScreen() {
  const navigation = useNavigation();
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const rules = {
  length: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /[0-9]/.test(password),
  special: /[^A-Za-z0-9]/.test(password),
};
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const [register, { isLoading }] = useRegisterMutation();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const validate = () => {
    const newErrors: { name?: string; email?: string; password?: string } = {};
    if (!name) newErrors.name = 'Name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email address';
    if (!password) {
  newErrors.password = 'Password is required';
} else if (
  !rules.length ||
  !rules.uppercase ||
  !rules.lowercase ||
  !rules.number ||
  !rules.special
) {
  newErrors.password =
    'Password must contain uppercase, lowercase, number and special character';
}
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await register({ name, email, password }).unwrap();
      (navigation as any).navigate('VerifyOtp', { email });
    } catch (error: any) {
      setErrors({ email: error?.data?.message || 'Registration failed. Please try again.' });
    }
  };

  const styles = createStyles(themeColors);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }} keyboardVerticalOffset={0}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Brand */}
            <View style={styles.header}>
              <Logo size="lg" />
              <Text style={styles.title}>Create your account</Text>
              <Text style={styles.subtitle}>Start tracking expenses with VoiceyBill</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="Your full name"
                  placeholderTextColor={themeColors.mutedForeground}
                  value={name}
                  onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: undefined })); }}
                  autoCapitalize="words"
                  editable={!isLoading}
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
                {errors.name && <Text style={styles.error}>{errors.name}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  ref={emailRef}
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="you@example.com"
                  placeholderTextColor={themeColors.mutedForeground}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: undefined })); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
                {errors.email && <Text style={styles.error}>{errors.email}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.passwordWrap, errors.password && styles.inputError]}>
                  <TextInput
                    ref={passwordRef}
                    style={styles.passwordInput}
                    placeholder="At least 8 characters"
                    placeholderTextColor={themeColors.mutedForeground}
                    value={password}
                    onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })); }}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showPassword
                      ? <EyeOff size={18} color={themeColors.mutedForeground} />
                      : <Eye size={18} color={themeColors.mutedForeground} />
                    }
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.error}>{errors.password}</Text>}
                <View style={{ marginTop: 8, gap: 4 }}>
  <Text
    style={{
      color: rules.length
        ? 'green'
        : themeColors.mutedForeground,
      fontSize: 12,
    }}
  >
    • At least 8 characters
  </Text>

  <Text
    style={{
      color: rules.uppercase
        ? 'green'
        : themeColors.mutedForeground,
      fontSize: 12,
    }}
  >
    • One uppercase letter
  </Text>

  <Text
    style={{
      color: rules.lowercase
        ? 'green'
        : themeColors.mutedForeground,
      fontSize: 12,
    }}
  >
    • One lowercase letter
  </Text>

  <Text
    style={{
      color: rules.number
        ? 'green'
        : themeColors.mutedForeground,
      fontSize: 12,
    }}
  >
    • One number
  </Text>

  <Text
    style={{
      color: rules.special
        ? 'green'
        : themeColors.mutedForeground,
      fontSize: 12,
    }}
  >
    • One special character
  </Text>
</View>
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading
                  ? <ActivityIndicator color={themeColors.primaryForeground} />
                  : <Text style={[styles.buttonText, { color: themeColors.primaryForeground }]}>Create account</Text>
                }
              </TouchableOpacity>

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
    scrollContent: { padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
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
    button: {
      backgroundColor: theme.primary,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.sm },
    footerText: { fontSize: fontSize.sm, color: theme.mutedForeground },
    link: { fontSize: fontSize.sm, color: theme.foreground, fontWeight: fontWeight.semibold, textDecorationLine: 'underline' },
  });
