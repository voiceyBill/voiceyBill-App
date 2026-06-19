// Shared category icon + color mapping (exact match against fixed category enum)
// Avoids fuzzy substring bugs like "healthCARe".includes("car") -> car icon.
import { Ionicons } from "@expo/vector-icons";

export type CategoryVisual = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
};

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  groceries: { icon: "cart", color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.12)" },
  dining: { icon: "restaurant", color: "#8b5cf6", bgColor: "rgba(139, 92, 246, 0.12)" },
  transportation: { icon: "car-sport", color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.12)" },
  utilities: { icon: "flash", color: "#10b981", bgColor: "rgba(16, 185, 129, 0.12)" },
  entertainment: { icon: "film", color: "#a855f7", bgColor: "rgba(168, 85, 247, 0.12)" },
  shopping: { icon: "bag-handle", color: "#ec4899", bgColor: "rgba(236, 72, 153, 0.12)" },
  healthcare: { icon: "medkit", color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.12)" },
  travel: { icon: "airplane", color: "#06b6d4", bgColor: "rgba(6, 182, 212, 0.12)" },
  housing: { icon: "home", color: "#64748b", bgColor: "rgba(100, 116, 139, 0.12)" },
  income: { icon: "trending-up", color: "#16a34a", bgColor: "rgba(22, 163, 74, 0.12)" },
  investments: { icon: "stats-chart", color: "#14b8a6", bgColor: "rgba(20, 184, 166, 0.12)" },
  other: { icon: "pricetag", color: "#8e8e93", bgColor: "rgba(142, 142, 147, 0.12)" },
};

const FALLBACK: CategoryVisual = CATEGORY_VISUALS.other;

export function getCategoryVisual(category?: string): CategoryVisual {
  if (!category) return FALLBACK;
  const key = category.toLowerCase().trim();

  // 1. Exact match against known categories
  if (CATEGORY_VISUALS[key]) return CATEGORY_VISUALS[key];

  // 2. Word-boundary aware aliases (no naive substring matching)
  const words = key.split(/[^a-z]+/).filter(Boolean);
  const has = (w: string) => words.includes(w);

  if (has("food") || has("dining") || has("drink") || has("restaurant") || has("coffee"))
    return CATEGORY_VISUALS.dining;
  if (has("grocery") || has("groceries")) return CATEGORY_VISUALS.groceries;
  if (has("health") || has("healthcare") || has("medical") || has("pharmacy"))
    return CATEGORY_VISUALS.healthcare;
  if (has("transport") || has("transportation") || has("car") || has("taxi") || has("fuel") || has("gas"))
    return CATEGORY_VISUALS.transportation;
  if (has("travel") || has("flight") || has("hotel")) return CATEGORY_VISUALS.travel;
  if (has("shopping") || has("shop") || has("retail")) return CATEGORY_VISUALS.shopping;
  if (has("bill") || has("bills") || has("utility") || has("utilities")) return CATEGORY_VISUALS.utilities;
  if (has("rent") || has("housing") || has("home")) return CATEGORY_VISUALS.housing;
  if (has("entertainment") || has("movie") || has("game")) return CATEGORY_VISUALS.entertainment;
  if (has("income") || has("salary")) return CATEGORY_VISUALS.income;
  if (has("investment") || has("investments") || has("stock")) return CATEGORY_VISUALS.investments;

  return FALLBACK;
}
