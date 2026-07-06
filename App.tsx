import "react-native-gesture-handler";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import * as SplashScreen from "expo-splash-screen";
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
import ToastHost from "./src/components/common/ToastHost";
import ThemedSystemBars from "./src/components/common/ThemedSystemBars";

// Keep the native (branded) splash on screen until fonts + persisted state are
// ready, then fade straight into the app — one splash, no redundant JS logo
// screen and no white flash into the dark UI.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ fade: true, duration: 300 });

/**
 * Rendered as a child of PersistGate, so it only mounts once the persisted
 * store has rehydrated. Once fonts are also ready, hide the native splash.
 */
function SplashController({ ready }: { ready: boolean }) {
  React.useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  return null;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  // While fonts load the native splash is still up (auto-hide is prevented),
  // so there's nothing to render here.
  if (!fontsLoaded) {
    return null;
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
                    <ThemedSystemBars />
                    <AppNavigator />
                    <ToastHost />
                    <SplashController ready={fontsLoaded} />
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
