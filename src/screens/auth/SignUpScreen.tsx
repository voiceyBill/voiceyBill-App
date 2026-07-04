import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import Spinner from '../../components/common/Spinner';
import { Button } from '../../components/common';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useRegisterMutation } from '../../features/auth/authAPI';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';
import { createAuthStyles } from '../../theme/authStyles';
import Logo from '../../components/common/Logo';
import { getPasswordRules } from '../../features/auth/authValidation';
import { getApiErrorMessage, getServerFieldErrors } from '../../lib/getApiErrorMessage';
import { useToast } from '../../context/NotificationContext';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton';
import PasswordRequirements from '../../components/auth/PasswordRequirements';
import { useGoogleAuth } from '../../features/auth/hooks/useGoogleAuth';

export default function SignUpScreen() {
  const navigation = useNavigation();
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { showToast } = useToast();

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
  // Y offsets captured via onLayout, used to scroll a focused field into view
  // above the keyboard (Fabric-safe — no measureLayout needed).
  const formTopRef = useRef(0);
  const emailGroupTopRef = useRef(0);
  const passwordGroupTopRef = useRef(0);

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

  // Bring the focused field near the top of the scroll view so it stays visible
  // above the keyboard. Android needs this because, unlike iOS, the ScrollView
  // does not reliably auto-scroll to the focused input. We scroll to the field's
  // recorded onLayout offset (form offset + field offset) — Fabric-safe, and it
  // avoids the old "scroll to end of form" bug that hid the focused field.
  const scrollToField = (fieldTopRef: React.RefObject<number>) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(formTopRef.current + fieldTopRef.current - 24, 0),
        animated: true,
      });
    }, 150);
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
      const fieldErrors = getServerFieldErrors(error);
      if (fieldErrors.name || fieldErrors.email || fieldErrors.password) {
        setErrors({
          name: fieldErrors.name,
          email: fieldErrors.email,
          password: fieldErrors.password,
        });
      }
      showToast({
        type: 'error',
        title: 'Sign up failed',
        message: getApiErrorMessage(error, 'Registration failed. Please try again.'),
        duration: 5000,
      });
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Logo size="lg" />
              <Text style={styles.title}>Create your account</Text>
              <Text style={styles.subtitle}>Start tracking expenses with VoiceyBill</Text>
            </View>

            <View
              style={styles.form}
              onLayout={(e) => {
                formTopRef.current = e.nativeEvent.layout.y;
              }}
            >
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

              <View
                style={styles.inputGroup}
                onLayout={(e) => {
                  emailGroupTopRef.current = e.nativeEvent.layout.y;
                }}
              >
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
                  onFocus={() => scrollToField(emailGroupTopRef)}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
                {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
              </View>

              <View
                style={styles.inputGroup}
                onLayout={(e) => {
                  passwordGroupTopRef.current = e.nativeEvent.layout.y;
                }}
              >
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
                      scrollToField(passwordGroupTopRef);
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

              <Button
                style={styles.button}
                onPress={handleRegister}
                loading={isLoading}
                loadingLabel="Creating…"
                disabled={!canSubmit || isGoogleLoading}
                label="Create account"
              />

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
