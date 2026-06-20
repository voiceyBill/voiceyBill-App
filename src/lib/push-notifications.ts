import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

// Remote push (getExpoPushTokenAsync / device-token server registration) was
// removed from Expo Go in SDK 53. Calling it there throws and spams the console
// with "_ideBackoff.computeNextBackoffInterval" errors. Detect Expo Go so we
// skip remote push there while keeping it working in dev/standalone builds.
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const configureNotifications = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};

export const registerForPushNotificationsAsync = async (): Promise<{
  status: "granted" | "denied" | "unsupported";
  token: string | null;
}> => {
  if (!Device.isDevice || isExpoGo) {
    return { status: "unsupported", token: null };
  }

  let { status } = await Notifications.getPermissionsAsync();

  if (status !== "granted") {
    const request = await Notifications.requestPermissionsAsync();
    status = request.status;
  }

  if (status !== "granted") {
    return { status: "denied", token: null };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return { status: "granted", token: token.data };
  } catch (error) {
    console.warn("[push-notifications] Failed to get push token:", error);
    return { status: "unsupported", token: null };
  }
};
