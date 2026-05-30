import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform } from "react-native";
import { useTypedSelector } from "../store/hooks";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";
import { registerForPushNotificationsAsync } from "../lib/push-notifications";
import { useRegisterPushTokenMutation } from "../features/user/userAPI";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { accessToken } = useTypedSelector((state) => state.auth);
  const isAuthenticated = !!accessToken;
  const [registerPushToken] = useRegisterPushTokenMutation();
  const lastTokenRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!isAuthenticated) {
      lastTokenRef.current = null;
      return;
    }

    if (Platform.OS !== "android") {
      return;
    }

    let isMounted = true;

    const register = async () => {
      const result = await registerForPushNotificationsAsync();
      if (!isMounted || result.status !== "granted" || !result.token) return;
      if (lastTokenRef.current === result.token) return;

      lastTokenRef.current = result.token;
      await registerPushToken({
        token: result.token,
        platform: "ANDROID",
      });
    };

    register();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, registerPushToken]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
