import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTypedSelector } from '../store/hooks';
import { useVoiceRecording } from '../context/VoiceRecordingContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import VoiceRecordingModalContainer from '../components/VoiceRecordingModalContainer';

const Stack = createNativeStackNavigator();

// Inner component that has access to navigation context
function AppContent() {
  const navigation = useNavigation();
  const { setNavigationRef } = useVoiceRecording();
  const { accessToken } = useTypedSelector((state) => state.auth);
  const isAuthenticated = !!accessToken;
  const navigationSetRef = useRef(false);

  // Store navigation ref in context so VoiceRecordingModalContainer can use it
  useEffect(() => {
    if (!navigationSetRef.current) {
      setNavigationRef(navigation);
      navigationSetRef.current = true;
    }
  }, []);

  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
      <VoiceRecordingModalContainer />
    </>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <AppContent />
    </NavigationContainer>
  );
}
