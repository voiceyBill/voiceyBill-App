import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontFamily, borderRadius } from '../../theme/colors';
import { getPasswordRules } from '../../features/auth/authValidation';

type Requirement = { key: string; label: string; met: boolean };

type PasswordRequirementsProps = {
  password: string;
  themeColors: typeof colors.light;
  includeLowercase?: boolean;
  showStrengthBar?: boolean;
  /** Always show the checklist (e.g. sign-up) even before typing */
  alwaysShowRules?: boolean;
};

export default function PasswordRequirements({
  password,
  themeColors,
  includeLowercase = false,
  showStrengthBar = true,
  alwaysShowRules = false,
}: PasswordRequirementsProps) {
  const rules = getPasswordRules(password);
  const lowercaseMet = /[a-z]/.test(password);

  const requirements: Requirement[] = useMemo(() => {
    const list: Requirement[] = [
      { key: 'length', label: 'At least 8 characters', met: rules.length },
      { key: 'uppercase', label: 'One uppercase letter', met: rules.uppercase },
      ...(includeLowercase
        ? [{ key: 'lowercase', label: 'One lowercase letter', met: lowercaseMet }]
        : []),
      { key: 'number', label: 'One number', met: rules.number },
      { key: 'special', label: 'One special character', met: rules.special },
    ];
    return list;
  }, [rules, includeLowercase, lowercaseMet]);

  const metCount = requirements.filter((r) => r.met).length;
  const strength = password.length === 0 ? 0 : metCount / requirements.length;

  const strengthColor =
    strength >= 1
      ? themeColors.primary
      : strength >= 0.6
        ? '#d97706'
        : themeColors.destructive;

  const strengthLabel =
    password.length === 0
      ? ''
      : strength >= 1
        ? 'Strong'
        : strength >= 0.6
          ? 'Almost there'
          : strength >= 0.2
            ? 'Weak'
            : 'Too weak';

  if (!password && !alwaysShowRules) return null;

  return (
    <View style={styles.wrap}>
      {showStrengthBar && password.length > 0 && (
        <View style={styles.strengthRow}>
          <View style={[styles.strengthTrack, { backgroundColor: themeColors.muted }]}>
            <View
              style={[
                styles.strengthFill,
                {
                  width: `${Math.max(strength * 100, 8)}%`,
                  backgroundColor: strengthColor,
                },
              ]}
            />
          </View>
          <Text style={[styles.strengthLabel, { color: strengthColor }]}>{strengthLabel}</Text>
        </View>
      )}
      <View style={styles.rules}>
        {requirements.map((req) => (
          <View key={req.key} style={styles.ruleRow}>
            <Ionicons
              name={req.met ? 'checkmark-circle' : 'ellipse-outline'}
              size={15}
              color={req.met ? themeColors.primary : themeColors.mutedForeground}
            />
            <Text
              style={[
                styles.ruleText,
                { color: req.met ? themeColors.foreground : themeColors.mutedForeground },
                req.met && styles.ruleTextMet,
              ]}
            >
              {req.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  strengthTrack: {
    flex: 1,
    height: 4,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  strengthLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    minWidth: 72,
    textAlign: 'right',
  },
  rules: {
    gap: 6,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ruleText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    flex: 1,
  },
  ruleTextMet: {
    fontFamily: fontFamily.medium,
  },
});
