import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme/colors';
import { useVoiceRecording } from '../context/VoiceRecordingContext';
import VoiceRecorder from './transaction/VoiceRecorder';

interface VoiceRecordingModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const VoiceRecordingModal: React.FC<VoiceRecordingModalProps> = ({ isVisible, onClose }) => {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const insets = useSafeAreaInsets();
  const { onVoiceComplete, isAutoStart } = useVoiceRecording();

  const [isVoiceProcessing, setIsVoiceProcessing] = React.useState(false);

  const handleVoiceComplete = (data: any) => {
    if (onVoiceComplete) {
      onVoiceComplete(data);
    }
    // Close modal after a brief delay to allow user to see completion
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar
        barStyle={activeTheme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={themeColors.background}
      />
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: themeColors.background },
        ]}
        edges={['left', 'right']}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: themeColors.border,
              paddingTop: Math.max(insets.top, spacing.md),
            },
          ]}
        >
          <Text
            style={[
              styles.headerTitle,
              { color: themeColors.foreground },
            ]}
          >
            Voice Transaction
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <X size={24} color={themeColors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Voice Recorder */}
        <ScrollView
          style={styles.content}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        >
          <VoiceRecorder
            loadingChange={isVoiceProcessing}
            onLoadingChange={setIsVoiceProcessing}
            onVoiceComplete={handleVoiceComplete}
            autoStart={isAutoStart}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
});

export default VoiceRecordingModal;
