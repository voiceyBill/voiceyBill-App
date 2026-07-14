// VoiceyBill design system — shared primitives.
// Screens compose from these instead of hand-rolling styles, so typography,
// radius, elevation, spacing and press feedback stay consistent app-wide.

export { default as Text } from "./Text";
export type { AppTextProps } from "./Text";
export { default as Card } from "./Card";
export type { CardProps } from "./Card";
export { default as SectionHeader } from "./SectionHeader";
export { default as ListItem } from "./ListItem";
export { default as IconTile } from "./IconTile";
export { default as Amount } from "./Amount";
export { default as StatCard } from "./StatCard";
export { default as Badge } from "./Badge";
export { default as Chip } from "./Chip";
export { default as ProgressBar } from "./ProgressBar";
export { default as EmptyState } from "./EmptyState";
export { default as ErrorState } from "./ErrorState";

// Existing unified primitives, surfaced here so screens have one import path.
// (Loading states are covered by these — no duplicate component.)
export { default as Button } from "../common/Button";
export { default as Skeleton } from "../common/Skeleton";
export { default as Spinner, ScreenLoader } from "../common/Spinner";
