import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "../theme/colors";

/**
 * Height of the floating tab bar pill rendered by `FloatingTabBar` in
 * MainNavigator. The bar is absolutely positioned, so it floats *over* every
 * tab screen (including nested stacks like Settings) rather than reserving
 * layout space. Any screen content or pinned control near the bottom must
 * clear this height plus the device's safe-area inset.
 */
export const FLOATING_TAB_BAR_HEIGHT = 64;

/**
 * Bottom spacing a screen needs so its content clears the floating tab bar and
 * the device safe-area inset, with a little breathing room above the pill.
 *
 * Use it as `paddingBottom` on scroll content, or `marginBottom` on a pinned
 * bottom bar (e.g. the Transactions pagination footer). Mirrors the bar's own
 * `insets.bottom || spacing.md` bottom offset so the maths stay in sync.
 */
export function useFloatingTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  return (insets.bottom || spacing.md) + FLOATING_TAB_BAR_HEIGHT + spacing.lg;
}
