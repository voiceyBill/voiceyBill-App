import React from 'react';
import { useVoiceRecording, VoiceRecordingData } from '../context/VoiceRecordingContext';
import VoiceRecordingModal from './VoiceRecordingModal';

const VoiceRecordingModalContainer: React.FC = () => {
  const { setOnVoiceComplete, setVoiceData, navigationRef } = useVoiceRecording();

  // When the user applies a voice result, stash it and switch to the
  // Transactions tab, where the form opens pre-filled in Manual mode.
  React.useEffect(() => {
    const handleVoiceComplete = (data: VoiceRecordingData) => {
      setVoiceData(data);
      if (navigationRef && 'navigate' in navigationRef) {
        setTimeout(() => {
          (navigationRef as any).navigate('Main', { screen: 'Transactions' });
        }, 100);
      }
    };
    // Wrap in a function: passing the handler directly would make useState treat
    // it as an updater and run it immediately with undefined.
    setOnVoiceComplete(() => handleVoiceComplete);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigationRef]);

  return <VoiceRecordingModal />;
};

export default VoiceRecordingModalContainer;
