import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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
import { setRefreshToken } from '../../lib/tokenStorage';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';
import { createAuthStyles } from '../../theme/authStyles';
import Logo from '../../components/common/Logo';
import { mapAuthApiErrors } from '../../features/auth/authValidation';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton';
import { useGoogleAuth } from '../../features/auth/hooks/useGoogleAuth';

export default function SignInScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const passwordRef = useRef<TextInput>(null);

  const [login, { isLoading }] = useLoginMutation();
  const {
    error: googleError,
    isGoogleLoading,
    isGoogleReady,
    signInWithGoogle,
  } = useGoogleAuth();

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email.trim())) newErrors.email = 'Invalid email address';
    if (!password) newErrors.password = 'Password is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      const result = await login({ email: email.trim(), password }).unwrap();
      await setRefreshToken(result.refreshToken);
      dispatch(setCredentials(result));
    } catch (error: any) {
      if (error?.data?.errorCode === 'AUTH_EMAIL_NOT_VERIFIED') {
        (navigation as any).navigate('VerifyOtp', { email: email.trim() });
        return;
      }
      setErrors(mapAuthApiErrors(error, 'Invalid email or password', 'password'));
    }
  };

  const styles = createAuthStyles(themeColors);
  const canSubmit = !isLoading && email.trim() !== '' && password !== '';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }} keyboardVerticalOffset={0}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Logo size="lg" />
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to your VoiceyBill account</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
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
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
                {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.passwordWrap, errors.password && styles.inputError]}>
                  <TextInput
                    ref={passwordRef}
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    placeholderTextColor={themeColors.mutedForeground}
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      setErrors((e) => ({ ...e, password: undefined }));
                    }}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
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
              </View>

              <TouchableOpacity
                style={[styles.button, !canSubmit && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={!canSubmit || isGoogleLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={themeColors.primaryForeground} />
                ) : (
                  <Text style={[styles.buttonText, { color: themeColors.primaryForeground }]}>
                    Sign in
                  </Text>
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
              {googleError ? <Text style={styles.fieldError}>{googleError}</Text> : null}

              <TouchableOpacity
                style={styles.forgotRow}
                onPress={() => (navigation as any).navigate('ForgotPassword')}
              >
                <Text style={styles.link}>Forgot password?</Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignUp' as never)}>
                  <Text style={styles.link}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.features}>
              {[
                'Log expenses by voice in any language',
                'AI-powered receipt scanning',
                'Monthly email reports',
                'Free and open source',
              ].map((item) => (
                <View key={item} style={styles.featureRow}>
                  <Text style={styles.featureDot}>›</Text>
                  <Text style={styles.featureText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
