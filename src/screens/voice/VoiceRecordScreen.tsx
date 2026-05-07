import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';

// This screen is never rendered — the Voice tab listener always
// intercepts tabPress and redirects to Transactions with openVoiceMode.
export default function VoiceRecordScreen() {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];
  return <View style={{ flex: 1, backgroundColor: theme.background }} />;
}
