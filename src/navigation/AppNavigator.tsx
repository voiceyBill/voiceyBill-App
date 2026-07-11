import React, { useEffect } from "react";
import {
  NavigationContainer,
  useNavigation,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { InteractionManager, Platform } from "react-native";
import { useTypedSelector } from "../store/hooks";
import { useTheme } from "../context/ThemeContext";
import { colors } from "../theme/colors";
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
        // "unsupported" is expected (Expo Go / simulator) — only surface a real
        // permission denial so the console stays clean during development.
        if (result.status === "denied") {
          console.warn("[push-notifications] permission denied by user");
        }
        return;
      }
      if (lastTokenRef.current === result.token) return;

      lastTokenRef.current = result.token;
      await registerPushToken({
        token: result.token,
        platform: Platform.OS === "ios" ? "IOS" : "ANDROID",
      });
    };

    // PERF: push registration isn't needed for first paint — defer it until
    // the initial render/animations settle so permission checks and the
    // register-token request don't compete with startup on the JS thread.
    const task = InteractionManager.runAfterInteractions(() => {
      register();
    });

    return () => {
      isMounted = false;
      task.cancel();
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
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const base = activeTheme === "dark" ? DarkTheme : DefaultTheme;

  // Theme the navigator root so the window background (incl. the area behind
  // the transparent edge-to-edge system bars) matches the app theme instead
  // of React Navigation's default white. This is what removed the white strip
  // under the floating tab bar, and also kills white flashes between screens.
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: themeColors.background,
      card: themeColors.card,
      text: themeColors.foreground,
      border: themeColors.border,
      primary: themeColors.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <AppContent />
    </NavigationContainer>
  );
}
