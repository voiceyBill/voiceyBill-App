import React, { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { FileX } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import type { BudgetCategorySummary } from '../../features/budget/budgetType';
import { formatCurrency } from '../../lib/formatCurrency';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '../../theme/colors';

type CategoryIconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

type Props = {
  categories: BudgetCategorySummary[];
  totalSpent: number;
  formatCategory: (name: string) => string;
  getCategoryIcon: (name: string) => React.ComponentType<CategoryIconProps>;
};

const CATEGORY_COLORS = [
  '#166114',
  '#2563eb',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#0f766e',
  '#be123c',
  '#4d7c0f',
  '#9333ea',
  '#b45309',
  '#475569',
];

const SIZE = 220;
const CENTER = SIZE / 2;
const RADIUS = 78;
const STROKE_WIDTH = 24;

const toRad = (deg: number) => (deg * Math.PI) / 180;

const polar = (angle: number) => ({
  x: CENTER + RADIUS * Math.cos(toRad(angle)),
  y: CENTER + RADIUS * Math.sin(toRad(angle)),
});

const arcPath = (startAngle: number, endAngle: number) => {
  const start = polar(startAngle);
  const end = polar(endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`;
};

const formatBudgetCurrency = (value: number) =>
  formatCurrency(Math.round(value), { decimalPlaces: 0 });

const getUsageColor = (
  category: BudgetCategorySummary & { color: string },
  theme: typeof colors.light,
) => {
  if (category.exceeded || category.usagePercentage > 90) return theme.destructive;
  if (category.usagePercentage >= 70) return '#d97706';
  return category.color;
};

export default function BudgetCategoryPie({
  categories,
  totalSpent,
  formatCategory,
  getCategoryIcon,
}: Props) {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];
  const { width } = useWindowDimensions();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const isWide = width >= 760;

  const displayItems = useMemo(() => {
    return categories.map((category, index) => ({
      ...category,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      sharePercentage: totalSpent > 0 ? (category.spent / totalSpent) * 100 : 0,
    }));
  }, [categories, totalSpent]);

  const chartItems = useMemo(
    () => displayItems.filter((category) => category.spent > 0),
    [displayItems],
  );

  const segments = useMemo(() => {
    let start = -90;

    return chartItems.map((item) => {
      const sweep = Math.max((item.sharePercentage / 100) * 360, 0);
      const end = start + sweep;
      const segment = {
        name: item.name,
        color: item.color,
        d: arcPath(start, Math.max(end - 2, start)),
      };
      start = end;
      return segment;
    });
  }, [chartItems]);

  const selectedItem =
    displayItems.find((item) => item.name === activeCategory) || chartItems[0];
  const hasData = totalSpent > 0 && chartItems.length > 0;

  return (
    <View style={[styles.layout, isWide && styles.layoutWide]}>
      <View style={[styles.chartPane, isWide && styles.chartPaneWide]}>
        {hasData ? (
          <>
            <View style={styles.chartFrame}>
              <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
                <Circle
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  stroke={activeTheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,31,18,0.08)'}
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                />
                <G>
                  {segments.map((segment) => (
                    <Path
                      key={segment.name}
                      d={segment.d}
                      stroke={segment.color}
                      strokeWidth={STROKE_WIDTH}
                      strokeLinecap="round"
                      fill="none"
                      opacity={!activeCategory || activeCategory === segment.name ? 1 : 0.38}
                      onPress={() => setActiveCategory(segment.name)}
                    />
                  ))}
                </G>
              </Svg>
              <View style={styles.centerLabel}>
                <Text style={[styles.centerValue, { color: theme.foreground }]}>
                  {formatBudgetCurrency(totalSpent)}
                </Text>
                <Text style={[styles.centerCaption, { color: theme.mutedForeground }]}>
                  Spent
                </Text>
              </View>
            </View>

            {selectedItem ? (
              <View style={[styles.tooltip, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <View style={styles.tooltipHeader}>
                  <View style={[styles.tooltipDot, { backgroundColor: selectedItem.color }]} />
                  <Text style={[styles.tooltipTitle, { color: theme.foreground }]}>
                    {formatCategory(selectedItem.name)}
                  </Text>
                </View>
                <Text style={[styles.tooltipMeta, { color: theme.mutedForeground }]}>
                  {formatBudgetCurrency(selectedItem.spent)} / {formatBudgetCurrency(selectedItem.limit)}
                </Text>
                <Text style={[styles.tooltipMeta, { color: selectedItem.exceeded ? theme.destructive : theme.mutedForeground }]}>
                  {Math.round(selectedItem.usagePercentage)}% usage, {Math.round(selectedItem.sharePercentage)}% of spending
                </Text>
              </View>
            ) : null}

            <View style={styles.legendWrap}>
              {chartItems.map((item) => (
                <Pressable
                  key={item.name}
                  onPress={() => setActiveCategory(item.name)}
                  onHoverIn={() => setActiveCategory(item.name)}
                  onHoverOut={() => setActiveCategory(null)}
                  style={[
                    styles.legendChip,
                    {
                      backgroundColor:
                        activeCategory === item.name ? theme.secondary : theme.background,
                      borderColor:
                        activeCategory === item.name ? item.color : theme.border,
                    },
                  ]}
                >
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendText, { color: theme.foreground }]} numberOfLines={1}>
                    {formatCategory(item.name)}
                  </Text>
                  <Text style={[styles.legendPercent, { color: theme.mutedForeground }]}>
                    {Math.round(item.sharePercentage)}%
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.muted }]}>
              <FileX size={24} color={theme.mutedForeground} strokeWidth={1.7} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.foreground }]}>
              No category spending yet
            </Text>
            <Text style={[styles.emptyDescription, { color: theme.mutedForeground }]}>
              Category distribution will appear when expenses are recorded.
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.listPane, isWide && styles.listPaneWide]}>
        {displayItems.map((category) => {
          const CategoryIcon = getCategoryIcon(category.name);
          const isActive = activeCategory === category.name;

          return (
            <Pressable
              key={category.name}
              onPress={() => setActiveCategory(category.name)}
              onHoverIn={() => setActiveCategory(category.name)}
              onHoverOut={() => setActiveCategory(null)}
              style={[
                styles.categoryRow,
                {
                  backgroundColor: category.exceeded
                    ? `${theme.destructive}12`
                    : isActive
                      ? theme.secondary
                      : theme.background,
                  borderColor: category.exceeded
                    ? theme.destructive
                    : isActive
                      ? category.color
                      : theme.border,
                },
              ]}
            >
              <View style={[styles.accentBar, { backgroundColor: category.color }]} />
              <View style={styles.categoryMain}>
                <View style={[styles.iconCircle, { backgroundColor: theme.muted }]}>
                  <CategoryIcon size={18} color={category.color} strokeWidth={2.4} />
                </View>
                <View style={styles.categoryText}>
                  <Text style={[styles.categoryTitle, { color: theme.foreground }]} numberOfLines={1}>
                    {formatCategory(category.name)}
                  </Text>
                  <Text style={[styles.categoryMeta, { color: theme.mutedForeground }]}>
                    {formatBudgetCurrency(category.spent)} / {formatBudgetCurrency(category.limit)}
                  </Text>
                  <View style={[styles.progressTrack, { backgroundColor: theme.muted }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(category.usagePercentage, 100)}%`,
                          backgroundColor: getUsageColor(category, theme),
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
              <View style={styles.categoryStats}>
                <Text
                  style={[
                    styles.categoryPercent,
                    { color: category.exceeded ? theme.destructive : theme.foreground },
                  ]}
                >
                  {Math.round(category.usagePercentage)}%
                </Text>
                <Text style={[styles.categoryMeta, { color: theme.mutedForeground }]}>
                  {Math.round(category.sharePercentage)}% share
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layout: {
    gap: spacing.lg,
  },
  layoutWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  chartPane: {
    alignItems: 'center',
  },
  chartPaneWide: {
    flex: 0.95,
  },
  chartFrame: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerLabel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  centerValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  centerCaption: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  tooltip: {
    width: '100%',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  tooltipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tooltipTitle: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  tooltipMeta: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  legendWrap: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  legendChip: {
    maxWidth: '100%',
    minHeight: 34,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    flexShrink: 0,
  },
  legendText: {
    maxWidth: 132,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  legendPercent: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  listPane: {
    gap: spacing.sm,
  },
  listPaneWide: {
    flex: 1.15,
  },
  categoryRow: {
    minHeight: 68,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  accentBar: {
    alignSelf: 'stretch',
    width: 4,
  },
  categoryMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  categoryText: {
    flex: 1,
    minWidth: 0,
  },
  categoryTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  categoryMeta: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  categoryStats: {
    flexShrink: 0,
    alignItems: 'flex-end',
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
    paddingLeft: spacing.xs,
  },
  categoryPercent: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  emptyDescription: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});
