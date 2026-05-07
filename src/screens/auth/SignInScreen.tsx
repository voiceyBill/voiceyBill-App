import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useLoginMutation } from '../../features/auth/authAPI';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials } from '../../features/auth/authSlice';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/colors';
import Logo from '../../components/common/Logo';

export default function SignInScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const [login, { isLoading }] = useLoginMutation();

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email address';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setCredentials(result));
    } catch (error: any) {
      setErrors({ email: error?.data?.message || 'Login failed. Please try again.' });
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
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to your VoiceyBill account</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="you@example.com"
                  placeholderTextColor={themeColors.mutedForeground}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: undefined })); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                {errors.email && <Text style={styles.error}>{errors.email}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.passwordWrap, errors.password && styles.inputError]}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    placeholderTextColor={themeColors.mutedForeground}
                    value={password}
                    onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })); }}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
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
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading
                  ? <ActivityIndicator color={themeColors.primaryForeground} />
                  : <Text style={[styles.buttonText, { color: themeColors.primaryForeground }]}>Sign in</Text>
                }
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignUp' as never)}>
                  <Text style={styles.link}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Feature highlights */}
            <View style={[styles.features, { borderColor: themeColors.border }]}>
              {[
                'Log expenses by voice in any language',
                'AI-powered receipt scanning',
                'Monthly email reports',
                'Free and open source',
              ].map((item) => (
                <View key={item} style={styles.featureRow}>
                  <Text style={[styles.featureDot, { color: themeColors.foreground }]}>›</Text>
                  <Text style={[styles.featureText, { color: themeColors.mutedForeground }]}>{item}</Text>
                </View>
              ))}
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
    features: {
      marginTop: spacing.xl,
      paddingTop: spacing.xl,
      borderTopWidth: 1,
      gap: spacing.sm,
    },
    featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    featureDot: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, lineHeight: 20 },
    featureText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
  });
