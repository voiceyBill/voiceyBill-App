import React from 'react';
import { useVoiceRecording } from '../context/VoiceRecordingContext';
import VoiceRecordingModal from './VoiceRecordingModal';
import TransactionFormSheet from './transaction/TransactionFormSheet';

const VoiceRecordingModalContainer: React.FC = () => {
  const { formVisible, voicePrefill, closeVoiceForm } = useVoiceRecording();

  return (
    <>
      {/* Processing / result popup shown while holding the menu-bar mic. */}
      <VoiceRecordingModal />
      {/* Global transaction form opened on "Apply to Form" — sits on top of the
          popup so there's no tab switch or home-screen flash. */}
      <TransactionFormSheet
        isVisible={formVisible}
        onClose={closeVoiceForm}
        initialMode="MANUAL"
        voicePrefill={voicePrefill}
      />
    </>
  );
};

export default VoiceRecordingModalContainer;
