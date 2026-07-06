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
  holdCancel: () => Promise<void>;
  applyResult: () => void;
  closePopup: () => void;

  // Global transaction form opened after applying a voice result — avoids a tab
  // switch / home-screen flash.
  formVisible: boolean;
  voicePrefill: VoiceRecordingData | null;
  closeVoiceForm: () => void;

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
  const [formVisible, setFormVisible] = useState(false);
  const [voicePrefill, setVoicePrefill] = useState<VoiceRecordingData | null>(null);
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

  // Slid to cancel: stop and discard without processing or opening the popup.
  const holdCancel = async () => {
    await capture.cancel();
  };

  const applyResult = () => {
    if (!capture.result) return;
    // Open the transaction form on top of the popup, then close the popup behind
    // it — so we never flash the tab underneath or switch tabs.
    setVoicePrefill(capture.result);
    setFormVisible(true);
    setTimeout(() => {
      setIsVisible(false);
      capture.reset();
    }, 350);
  };

  const closePopup = () => {
    capture.cancel();
    setIsVisible(false);
  };

  const closeVoiceForm = () => {
    setFormVisible(false);
    setVoicePrefill(null);
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
        holdCancel,
        applyResult,
        closePopup,
        formVisible,
        voicePrefill,
        closeVoiceForm,
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
