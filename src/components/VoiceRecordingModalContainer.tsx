import React from 'react';
import { useVoiceRecording, VoiceRecordingData } from '../context/VoiceRecordingContext';
import VoiceRecordingModal from './VoiceRecordingModal';

const VoiceRecordingModalContainer: React.FC = () => {
  const { isVisible, closeVoiceRecording, setOnVoiceComplete, setVoiceData, navigationRef } = useVoiceRecording();

  // Re-register the callback whenever navigationRef changes so it always holds
  // a valid navigator (AppNavigator sets it asynchronously on mount).
  React.useEffect(() => {
    const handleVoiceComplete = (data: VoiceRecordingData) => {
      // Store the voice result; TransactionsScreen picks it up and opens the
      // transaction form pre-filled in Manual mode.
      setVoiceData(data);

      // Switch to the Transactions tab so its form is mounted and focused. No
      // openVoiceMode param — that would open a fresh recorder; the voiceData
      // carries the pre-fill instead.
      if (navigationRef && 'navigate' in navigationRef) {
        setTimeout(() => {
          (navigationRef as any).navigate('Main', {
            screen: 'Transactions',
          });
        }, 100);
      }

      // Close the popup after a brief delay.
      setTimeout(() => {
        closeVoiceRecording();
      }, 300);
    };

    setOnVoiceComplete(handleVoiceComplete);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigationRef]);

  return (
    <VoiceRecordingModal
      isVisible={isVisible}
      onClose={closeVoiceRecording}
    />
  );
};

export default VoiceRecordingModalContainer;
