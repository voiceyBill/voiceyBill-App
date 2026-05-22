import React, { useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors, borderRadius, fontSize, spacing } from '../../theme/colors';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const OTP_LENGTH = 6;

export default function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const digits = value.padEnd(OTP_LENGTH, '').split('').slice(0, OTP_LENGTH);

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '');

    // Multi-digit input = paste. Distribute starting at the current box and
    // focus the box after the last filled one (or the final box).
    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, OTP_LENGTH - index);
      const newDigits = [...digits];
      for (let i = 0; i < pasted.length; i++) {
        newDigits[index + i] = pasted[i];
      }
      const newValue = newDigits.join('').replace(/ /g, '');
      onChange(newValue);
      const focusIndex = Math.min(index + pasted.length, OTP_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    const digit = cleaned.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    const newValue = newDigits.join('').replace(/ /g, '');
    onChange(newValue);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      onChange(newDigits.join('').replace(/ /g, ''));
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <TouchableOpacity
          key={i}
          activeOpacity={1}
          onPress={() => inputRefs.current[i]?.focus()}
          style={[
            styles.box,
            {
              borderColor: digits[i] ? themeColors.primary : themeColors.border,
              backgroundColor: themeColors.card,
            },
          ]}
        >
          <TextInput
            ref={(ref) => { inputRefs.current[i] = ref; }}
            style={[styles.input, { color: themeColors.foreground }]}
            value={digits[i] && digits[i] !== ' ' ? digits[i] : ''}
            onChangeText={(text) => handleChange(text, i)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            editable={!disabled}
            selectTextOnFocus
            caretHidden
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  box: {
    width: 46,
    height: 52,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
});
