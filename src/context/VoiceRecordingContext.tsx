import React, { createContext, useContext, useState, ReactNode } from 'react';
import { NavigationProp } from '@react-navigation/native';

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
  isVisible: boolean;
  isAutoStart: boolean;
  openVoiceRecording: (autoStart?: boolean) => void;
  closeVoiceRecording: () => void;
  onVoiceComplete?: (data: VoiceRecordingData) => void;
  setOnVoiceComplete: (callback: (data: VoiceRecordingData) => void) => void;
  voiceData: VoiceRecordingData | null;
  setVoiceData: (data: VoiceRecordingData | null) => void;
  navigationRef?: NavigationProp<any>;
  setNavigationRef: (ref: NavigationProp<any>) => void;
}

const VoiceRecordingContext = createContext<VoiceRecordingContextType | undefined>(undefined);

export const VoiceRecordingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAutoStart, setIsAutoStart] = useState(false);
  const [onVoiceComplete, setOnVoiceComplete] = useState<
    ((data: VoiceRecordingData) => void) | undefined
  >();
  const [voiceData, setVoiceData] = useState<VoiceRecordingData | null>(null);
  const [navigationRef, setNavigationRef] = useState<NavigationProp<any>>();

  const openVoiceRecording = (autoStart: boolean = false) => {
    setIsAutoStart(autoStart);
    setIsVisible(true);
  };

  const closeVoiceRecording = () => {
    setIsVisible(false);
    setIsAutoStart(false);
    setVoiceData(null);
  };

  return (
    <VoiceRecordingContext.Provider
      value={{
        isVisible,
        isAutoStart,
        openVoiceRecording,
        closeVoiceRecording,
        onVoiceComplete,
        setOnVoiceComplete,
        voiceData,
        setVoiceData,
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
