import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store/store';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/components/SplashScreen';

export default function App() {
  const [splashDone, setSplashDone] = React.useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SafeAreaProvider>
            <ThemeProvider>
              <StatusBar style="auto" />
              <AppNavigator />
            </ThemeProvider>
          </SafeAreaProvider>
        </PersistGate>

        {!splashDone && (
          <SplashScreen onComplete={() => setSplashDone(true)} />
        )}
      </Provider>
    </GestureHandlerRootView>
  );
}
