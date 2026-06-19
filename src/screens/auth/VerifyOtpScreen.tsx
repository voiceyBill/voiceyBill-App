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
import { Mail } from 'lucide-react-native';
import { useVerifyOtpMutation, useResendOtpMutation } from '../../features/auth/authAPI';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials } from '../../features/auth/authSlice';
import { setRefreshToken } from '../../lib/tokenStorage';
import { useTheme } from '../../context/ThemeContext';
import { colors, fontFamily } from '../../theme/colors';
import { createAuthStyles } from '../../theme/authStyles';
import OtpInput from '../../components/common/OtpInput';
import Logo from '../../components/common/Logo';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useToast } from '../../context/NotificationContext';

type VerifyOtpRouteProp = RouteProp<AuthStackParamList, 'VerifyOtp'>;

export default function VerifyOtpScreen() {
  const navigation = useNavigation();
  const route = useRoute<VerifyOtpRouteProp>();
  const email = route.params?.email ?? '';
  const dispatch = useAppDispatch();
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { showToast } = useToast();

  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setOtpError('Enter the 6-digit code from your email');
      return;
    }
    setOtpError('');
    try {
      const result = await verifyOtp({ email, otp }).unwrap();
      await setRefreshToken(result.data.refreshToken);
      dispatch(
        setCredentials({
          user: result.data.user,
          accessToken: result.data.accessToken,
          reportSetting: result.data.reportSetting,
        }),
      );
      showToast({ type: 'success', title: 'Email verified', message: 'Welcome to VoiceyBill!' });
    } catch (error: any) {
      setOtpError(error?.data?.message || 'Invalid or expired code. Please try again.');
      showToast({
        type: 'error',
        title: 'Verification failed',
        message: error?.data?.message || 'Invalid or expired code. Please try again.',
      });
    }
  };

  const handleResend = async () => {
    try {
      const result = await resendOtp({ email }).unwrap();
      showToast({
        type: 'success',
        title: 'Code sent',
        message: result.message || 'A new verification code has been sent to your email.',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Could not resend',
        message: error?.data?.message || 'Failed to resend code. Please try again.',
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
          <View style={styles.content}>
            <View style={styles.header}>
              <Logo size="lg" />
              <View style={styles.iconWrap}>
                <Mail size={28} color={themeColors.foreground} strokeWidth={1.5} />
              </View>
              <Text style={styles.title}>Verify your email</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code sent to{'\n'}
                <Text style={{ color: themeColors.foreground, fontFamily: fontFamily.semibold }}>
                  {email}
                </Text>
              </Text>
            </View>

            <View style={styles.form}>
              <OtpInput value={otp} onChange={(v) => { setOtp(v); setOtpError(''); }} disabled={isLoading} />
              {otpError ? <Text style={styles.otpHint}>{otpError}</Text> : null}

              <TouchableOpacity
                style={[styles.button, (isLoading || otp.length !== 6) && styles.buttonDisabled]}
                onPress={handleVerify}
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <ActivityIndicator color={themeColors.primaryForeground} />
                ) : (
                  <Text style={[styles.buttonText, { color: themeColors.primaryForeground }]}>
                    Verify email
                  </Text>
                )}
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

              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => (navigation as any).navigate('SignIn')}
              >
                <Text style={styles.linkText}>
                  Already verified? <Text style={styles.link}>Sign in</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
