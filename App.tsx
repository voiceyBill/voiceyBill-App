import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";

import { store, persistor } from "./src/store/store";
import { ThemeProvider } from "./src/context/ThemeContext";
import { NotificationProvider } from "./src/context/NotificationContext";
import { ConfirmProvider } from "./src/context/ConfirmContext";
import { VoiceRecordingProvider } from "./src/context/VoiceRecordingContext";
import AppNavigator from "./src/navigation/AppNavigator";
import SplashScreen from "./src/components/SplashScreen";
import ToastHost from "./src/components/common/ToastHost";

export default function App() {
  const [splashDone, setSplashDone] = React.useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) {
    return null; // Or a simple view
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SafeAreaProvider>
            <ThemeProvider>
              <NotificationProvider>
                <ConfirmProvider>
                  <VoiceRecordingProvider>
                    <StatusBar style="auto" />

                    {splashDone ? (
                      <>
                        <AppNavigator />
                        <ToastHost />
                      </>
                    ) : (
                      <SplashScreen onComplete={() => setSplashDone(true)} />
                    )}
                  </VoiceRecordingProvider>
                </ConfirmProvider>
              </NotificationProvider>
            </ThemeProvider>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
