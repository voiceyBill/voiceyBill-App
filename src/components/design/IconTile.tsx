import React from "react";
import { View, ViewStyle, StyleProp } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { colors, borderRadius } from "../../theme/colors";

type Size = "sm" | "md" | "lg";
type Shape = "circle" | "rounded";

export interface IconTileProps {
  children: React.ReactNode;
  /** Foreground/icon tint; also drives the default tinted background. */
  color?: string;
  /** Explicit background override. Default: 12% of `color`. */
  background?: string;
  size?: Size;
  shape?: Shape;
  style?: StyleProp<ViewStyle>;
}

const DIMEN: Record<Size, number> = { sm: 32, md: 40, lg: 48 };

const withAlpha = (hex: string, alpha: number) => {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * A tinted rounded container for an icon — the recurring "colored circle with a
 * glyph" pattern (categories, insights, empty states), unified into one tile.
 */
export default function IconTile({
  children,
  color,
  background,
  size = "md",
  shape = "circle",
  style,
}: IconTileProps) {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];
  const tint = color ?? theme.primary;
  const dimen = DIMEN[size];

  return (
    <View
      style={[
        {
          width: dimen,
          height: dimen,
          borderRadius: shape === "circle" ? dimen / 2 : borderRadius.button,
          backgroundColor: background ?? withAlpha(tint, 0.12),
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
