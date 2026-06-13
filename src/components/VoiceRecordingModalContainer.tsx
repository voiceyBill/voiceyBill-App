import React, { useRef } from 'react';
import { useVoiceRecording, VoiceRecordingData } from '../context/VoiceRecordingContext';
import { MainTabParamList } from '../navigation/MainNavigator';
import VoiceRecordingModal from './VoiceRecordingModal';

const VoiceRecordingModalContainer: React.FC = () => {
  const { isVisible, closeVoiceRecording, setOnVoiceComplete, setVoiceData, navigationRef } = useVoiceRecording();
  const callbackSetRef = useRef(false);

  React.useEffect(() => {
    if (!callbackSetRef.current) {
      // Set the callback for when voice recording completes
      const handleVoiceComplete = (data: VoiceRecordingData) => {
        // Store the voice data in context for TransactionsScreen to pick up
        setVoiceData(data);

        // Navigate to Transactions if we have navigation ref
        if (navigationRef && 'navigate' in navigationRef) {
          // Use the BottomTabNavigator's navigate to switch to Transactions tab
          setTimeout(() => {
            (navigationRef as any).navigate('Main', {
              screen: 'Transactions',
              params: { openVoiceMode: Date.now() },
            });
          }, 100);
        }

        // Close the modal
        setTimeout(() => {
          closeVoiceRecording();
        }, 300);
      };

      setOnVoiceComplete(handleVoiceComplete);
      callbackSetRef.current = true;
    }
  }, []);

  return (
    <VoiceRecordingModal
      isVisible={isVisible}
      onClose={closeVoiceRecording}
    />
  );
};

export default VoiceRecordingModalContainer;
