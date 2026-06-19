import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useForgotPasswordMutation } from '../../features/auth/authAPI';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';
import { createAuthStyles } from '../../theme/authStyles';
import Logo from '../../components/common/Logo';
import { useToast } from '../../context/NotificationContext';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const validate = () => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setEmailError('Invalid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await forgotPassword({ email: email.trim() }).unwrap();
      (navigation as any).navigate('VerifyResetOtp', { email: email.trim() });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Could not send code',
        message: error?.data?.message || 'Failed to send reset code. Please try again.',
      });
    }
  };

  const styles = createAuthStyles(themeColors);
  const canSubmit = !isLoading && email.trim() !== '';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color={themeColors.foreground} />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.header}>
              <Logo size="lg" />
              <Text style={styles.title}>Forgot password</Text>
              <Text style={styles.subtitle}>
                Enter your email and we'll send a 6-digit reset code.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, emailError ? styles.inputError : null]}
                  placeholder="you@example.com"
                  placeholderTextColor={themeColors.mutedForeground}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
              </View>

              <TouchableOpacity
                style={[styles.button, !canSubmit && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit}
              >
                {isLoading ? (
                  <ActivityIndicator color={themeColors.primaryForeground} />
                ) : (
                  <Text style={[styles.buttonText, { color: themeColors.primaryForeground }]}>
                    Send reset code
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => (navigation as any).navigate('SignIn')}
              >
                <Text style={styles.linkText}>
                  Remember your password? <Text style={styles.link}>Sign in</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
