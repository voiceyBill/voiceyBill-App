import { useEffect } from "react";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../../context/ThemeContext";
import { colors } from "../../theme/colors";

/**
 * Drives the OS system bars from the app's active theme so they blend with the
 * UI instead of showing a stray white strip:
 *
 *  - Native root/window background (expo-system-ui): this is what shows behind
 *    the system bars under edge-to-edge, and is the key fix for the white
 *    navigation-bar area on Android.
 *  - Android navigation-bar button (icon) colour + its background where the
 *    platform allows it (expo-navigation-bar).
 *  - Top status-bar icon colour (expo-status-bar).
 *
 * Native calls are lazily required inside try/catch so a missing module (e.g.
 * in Expo Go) degrades gracefully; failures are logged so they're diagnosable.
 */
export default function ThemedSystemBars() {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === "dark";
  const bg = colors[activeTheme].background;

  useEffect(() => {
    if (Platform.OS !== "android") return;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const SystemUI = require("expo-system-ui");
        await SystemUI.setBackgroundColorAsync(bg);
      } catch (e) {
        console.warn("[SystemBars] expo-system-ui setBackgroundColor failed:", e);
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const NavigationBar = require("expo-navigation-bar");
        await NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
        await NavigationBar.setBackgroundColorAsync?.(bg);
      } catch (e) {
        console.warn("[SystemBars] expo-navigation-bar failed:", e);
      }
    })();
  }, [activeTheme, isDark, bg]);

  return <StatusBar style={isDark ? "light" : "dark"} />;
}
