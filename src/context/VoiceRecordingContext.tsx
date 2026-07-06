import React, { createContext, useContext, useState, ReactNode } from 'react';
import { NavigationProp } from '@react-navigation/native';
import { useVoiceCapture } from '../features/voice/useVoiceCapture';

export interface VoiceRecordingData {
  title: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  paymentMethod: string;
  description?: string;
  currency?: string;
}

interface VoiceRecordingContextType {
  // Capture state (menu-bar mic records via the hold gesture).
  isRecording: boolean;
  duration: number;
  isProcessing: boolean;
  result: any | null;
  error: string | null;
  isVisible: boolean;

  // Hold-to-record on the menu-bar mic.
  holdStart: () => void;
  holdEnd: () => Promise<'tooShort' | 'processing'>;
  applyResult: () => void;
  closePopup: () => void;

  // Navigation + prefill wiring consumed by TransactionsScreen.
  voiceData: VoiceRecordingData | null;
  setVoiceData: (data: VoiceRecordingData | null) => void;
  onVoiceComplete?: (data: VoiceRecordingData) => void;
  setOnVoiceComplete: (callback: (data: VoiceRecordingData) => void) => void;
  navigationRef?: NavigationProp<any>;
  setNavigationRef: (ref: NavigationProp<any>) => void;
}

const VoiceRecordingContext = createContext<VoiceRecordingContextType | undefined>(undefined);

export const VoiceRecordingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const capture = useVoiceCapture();
  const [isVisible, setIsVisible] = useState(false);
  const [voiceData, setVoiceData] = useState<VoiceRecordingData | null>(null);
  const [onVoiceComplete, setOnVoiceComplete] = useState<
    ((data: VoiceRecordingData) => void) | undefined
  >();
  const [navigationRef, setNavigationRef] = useState<NavigationProp<any>>();

  // Hold the menu-bar mic to record (no popup while recording).
  const holdStart = () => {
    capture.start();
  };

  // Release: if the hold was long enough, open the popup and process (so the
  // user sees the centered spinner, then the Apply-to-Form result).
  const holdEnd = async (): Promise<'tooShort' | 'processing'> => {
    const { uri, tooShort } = await capture.stop();
    if (tooShort || !uri) {
      capture.reset();
      return 'tooShort';
    }
    setIsVisible(true);
    capture.process(uri);
    return 'processing';
  };

  const applyResult = () => {
    if (capture.result && onVoiceComplete) {
      onVoiceComplete(capture.result);
    }
    capture.reset();
    setIsVisible(false);
  };

  const closePopup = () => {
    capture.cancel();
    setIsVisible(false);
  };

  return (
    <VoiceRecordingContext.Provider
      value={{
        isRecording: capture.isRecording,
        duration: capture.duration,
        isProcessing: capture.isProcessing,
        result: capture.result,
        error: capture.error,
        isVisible,
        holdStart,
        holdEnd,
        applyResult,
        closePopup,
        voiceData,
        setVoiceData,
        onVoiceComplete,
        setOnVoiceComplete,
        navigationRef,
        setNavigationRef,
      }}
    >
      {children}
    </VoiceRecordingContext.Provider>
  );
};

export const useVoiceRecording = () => {
  const context = useContext(VoiceRecordingContext);
  if (context === undefined) {
    throw new Error('useVoiceRecording must be used within a VoiceRecordingProvider');
  }
  return context;
};
