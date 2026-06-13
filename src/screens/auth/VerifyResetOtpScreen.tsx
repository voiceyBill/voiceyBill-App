import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useForgotPasswordMutation } from '../../features/auth/authAPI';
import { useTheme } from '../../context/ThemeContext';
import { colors, fontFamily } from '../../theme/colors';
import { createAuthStyles } from '../../theme/authStyles';
import OtpInput from '../../components/common/OtpInput';
import Logo from '../../components/common/Logo';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useToast } from '../../context/NotificationContext';

type VerifyResetOtpRouteProp = RouteProp<AuthStackParamList, 'VerifyResetOtp'>;

export default function VerifyResetOtpScreen() {
  const navigation = useNavigation();
  const route = useRoute<VerifyResetOtpRouteProp>();
  const email = route.params?.email ?? '';
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { showToast } = useToast();

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [forgotPassword, { isLoading: isResending }] = useForgotPasswordMutation();

  const handleContinue = () => {
    if (otp.length !== 6) {
      setOtpError('Enter the 6-digit reset code from your email');
      return;
    }
    setOtpError('');
    (navigation as any).navigate('SetNewPassword', { email, otp });
  };

  const handleResend = async () => {
    try {
      await forgotPassword({ email }).unwrap();
      showToast({
        type: 'success',
        title: 'Code sent',
        message: 'A new reset code has been sent to your email.',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Could not resend',
        message: error?.data?.message || 'Failed to resend code.',
      });
    }
  };

  const styles = createAuthStyles(themeColors);

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
              <Text style={styles.title}>Verify reset code</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code sent to{'\n'}
                <Text style={{ color: themeColors.foreground, fontFamily: fontFamily.semibold }}>
                  {email}
                </Text>
              </Text>
            </View>

            <View style={styles.form}>
              <OtpInput value={otp} onChange={(v) => { setOtp(v); setOtpError(''); }} />
              {otpError ? <Text style={styles.otpHint}>{otpError}</Text> : null}

              <TouchableOpacity
                style={[styles.button, otp.length !== 6 && styles.buttonDisabled]}
                onPress={handleContinue}
                disabled={otp.length !== 6}
              >
                <Text style={[styles.buttonText, { color: themeColors.primaryForeground }]}>
                  Continue
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.outlineButton}
                onPress={handleResend}
                disabled={isResending}
              >
                {isResending ? (
                  <ActivityIndicator size="small" color={themeColors.foreground} />
                ) : (
                  <Ionicons name="refresh" size={16} color={themeColors.foreground} />
                )}
                <Text style={styles.outlineButtonText}>
                  {isResending ? 'Sending...' : 'Resend code'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
