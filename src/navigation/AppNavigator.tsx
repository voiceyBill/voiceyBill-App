import React, { useEffect } from "react";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform } from "react-native";
import { useTypedSelector } from "../store/hooks";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";
import { registerForPushNotificationsAsync } from "../lib/push-notifications";
import { useRegisterPushTokenMutation } from "../features/user/userAPI";
import { useVoiceRecording } from "@/context/VoiceRecordingContext";
import VoiceRecordingModalContainer from "@/components/VoiceRecordingModalContainer";

const Stack = createNativeStackNavigator();

// Inner component that has access to navigation context
function AppContent() {
  const navigation = useNavigation();
  const { setNavigationRef } = useVoiceRecording();
  const { accessToken } = useTypedSelector((state) => state.auth);
  const isAuthenticated = !!accessToken;
  const [registerPushToken] = useRegisterPushTokenMutation();
  const lastTokenRef = React.useRef<string | null>(null);
  const navigationSetRef = React.useRef(false);

  React.useEffect(() => {
    if (!isAuthenticated) {
      lastTokenRef.current = null;
      return;
    }

    let isMounted = true;

    const register = async () => {
      const result = await registerForPushNotificationsAsync();
      if (!isMounted) return;
      if (result.status !== "granted" || !result.token) {
        console.warn(
          `[push-notifications] registration skipped (status: ${result.status})`,
        );
        return;
      }
      if (lastTokenRef.current === result.token) return;

      lastTokenRef.current = result.token;
      await registerPushToken({
        token: result.token,
        platform: Platform.OS === "ios" ? "IOS" : "ANDROID",
      });
    };

    register();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, registerPushToken]);

  // Store navigation ref in context so VoiceRecordingModalContainer can use it
  useEffect(() => {
    if (!navigationSetRef.current) {
      setNavigationRef(navigation as any); // FIX CI TYPE ERROR
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
