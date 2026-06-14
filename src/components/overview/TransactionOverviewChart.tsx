import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Line, Text as SvgText, G } from 'react-native-svg';
import { TrendingUp, TrendingDown, FileX } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, borderRadius, fontSize, fontWeight, fontFamily } from '../../theme/colors';
import { ChartDataPoint } from '../../features/analytics/analyticsAPI';
import { formatCurrency } from '../../lib/formatCurrency';
import { format } from 'date-fns';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  data: ChartDataPoint[];
  totalIncomeCount?: number;
  totalExpenseCount?: number;
  periodLabel?: string;
  baseCurrency?: string;
  hideHeader?: boolean;
  transparentBackground?: boolean;
  height?: number;
};

const DEFAULT_CHART_H = 220;

function smoothPath(pts: { x: number; y: number }[], close: boolean, closeY: number): string {
  if (!pts.length) return '';
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const c = pts[i];
    const cpX = ((p.x + c.x) / 2).toFixed(1);
    d += ` C ${cpX} ${p.y.toFixed(1)} ${cpX} ${c.y.toFixed(1)} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`;
  }
  if (close) {
    d += ` L ${pts[pts.length - 1].x.toFixed(1)} ${closeY}`;
    d += ` L ${pts[0].x.toFixed(1)} ${closeY} Z`;
  }
  return d;
}

function niceMax(val: number): number {
  if (val <= 0) return 100;
  const exp = Math.pow(10, Math.floor(Math.log10(val)));
  return Math.ceil(val / exp) * exp * 1.2;
}

export default function TransactionOverviewChart({
  data,
  totalIncomeCount = 0,
  totalExpenseCount = 0,
  periodLabel = 'Past 30 Days',
  baseCurrency = 'USD',
  hideHeader = false,
  transparentBackground = false,
  height,
}: Props) {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];

  const CHART_H = height || DEFAULT_CHART_H;
  const MT = 28;  // Increased margin top for currency label
  const MR = 12;  // margin right
  const MB = 32;  // margin bottom (x-axis labels)
  const ML = 54;  // Reduced margin left since we'll remove the currency code from labels
  const PLOT_H = CHART_H - MT - MB;

  // Total card width = screen minus outer padding
  const cardWidth = SCREEN_WIDTH - spacing.lg * 2;
  const plotW = cardWidth - ML - MR;
  const closeY = MT + PLOT_H;

  const incomeVals = data.map((d) => d.income || 0);
  const expenseVals = data.map((d) => d.expenses || 0);
  const hasData = data.length > 0 && (incomeVals.some((v) => v > 0) || expenseVals.some((v) => v > 0));

  const maxVal = useMemo(() => {
    const rawMax = Math.max(...incomeVals, ...expenseVals, 1);
    return niceMax(rawMax);
  }, [incomeVals, expenseVals]);

  const sx = (i: number) => ML + (i / Math.max(data.length - 1, 1)) * plotW;
  const sy = (v: number) => MT + PLOT_H - (v / maxVal) * PLOT_H;

  const incomePts = incomeVals.map((v, i) => ({ x: sx(i), y: sy(v) }));
  const expensePts = expenseVals.map((v, i) => ({ x: sx(i), y: sy(v) }));

  // Y-axis: 3 grid levels, skip 0 to keep it clean
  const yLevels = [0.33, 0.66, 1].map((f) => ({
    val: maxVal * f,
    y: sy(maxVal * f),
  }));

  // X-axis: up to 5 evenly spaced labels
  const xIndices = useMemo(() => {
    if (data.length <= 5) return data.map((_, i) => i);
    const step = Math.ceil((data.length - 1) / 4);
    const idxs: number[] = [];
    for (let i = 0; i < data.length; i += step) idxs.push(i);
    if (idxs[idxs.length - 1] !== data.length - 1) idxs.push(data.length - 1);
    return idxs;
  }, [data.length]);

  // Stripe-inspired ultra-subtle grid lines
  const gridColor = activeTheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(23, 23, 23, 0.06)';
  const axisLabelColor = theme.mutedForeground;
  const incomeColor = theme.brandGreen;
  const expenseColor = theme.destructive;

  return (
    <View style={[
      !transparentBackground && styles.card, 
      !transparentBackground && { backgroundColor: theme.card, borderColor: theme.border }
    ]}>
      {/* Card header — title left, counts right */}
      {!hideHeader && (
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={styles.titleCol}>
            <Text style={[styles.title, { color: theme.foreground }]}>Transaction Overview</Text>
            <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
              Showing total transactions {periodLabel}
            </Text>
          </View>
          <View style={styles.countsRow}>
            <View style={[styles.countBox, { borderLeftColor: theme.border }]}>
              <Text style={[styles.countLabel, { color: theme.mutedForeground }]}>Income</Text>
              <View style={styles.countValueRow}>
                <TrendingUp size={13} color={incomeColor} strokeWidth={2.5} />
                <Text style={[styles.countValue, { color: theme.foreground }]}>{totalIncomeCount}</Text>
              </View>
            </View>
            <View style={[styles.countBox, { borderLeftColor: theme.border }]}>
              <Text style={[styles.countLabel, { color: theme.mutedForeground }]}>Expenses</Text>
              <View style={styles.countValueRow}>
                <TrendingDown size={13} color={expenseColor} strokeWidth={2.5} />
                <Text style={[styles.countValue, { color: theme.foreground }]}>{totalExpenseCount}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Chart area */}
      {!hasData ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconWrap, { backgroundColor: theme.muted }]}>
            <FileX size={26} color={theme.mutedForeground} strokeWidth={1.5} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.foreground }]}>No transaction data</Text>
          <Text style={[styles.emptyDesc, { color: theme.mutedForeground }]}>
            No transactions recorded for this period.
          </Text>
        </View>
      ) : (
        <View style={styles.chartWrap}>
          <Svg width={cardWidth} height={CHART_H}>
            <Defs>
              <LinearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={incomeColor} stopOpacity={activeTheme === 'dark' ? 0.20 : 0.12} />
                <Stop offset="100%" stopColor={incomeColor} stopOpacity={0.01} />
              </LinearGradient>
              <LinearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={expenseColor} stopOpacity={0.20} />
                <Stop offset="100%" stopColor={expenseColor} stopOpacity={0.01} />
              </LinearGradient>
            </Defs>

            {/* Currency Indicator at the top left of the axis */}
            <SvgText
              x={ML - 6}
              y={MT - 10}
              textAnchor="end"
              fontSize={10}
              fill={axisLabelColor}
              fontWeight="700"
              fontFamily={fontFamily.bold}
            >
              {baseCurrency}
            </SvgText>

            {/* Horizontal grid lines + Y labels */}
            {yLevels.map(({ val, y }) => (
              <G key={`grid-${val}`}>
                <Line
                  x1={ML}
                  y1={y}
                  x2={ML + plotW}
                  y2={y}
                  stroke={gridColor}
                  strokeWidth={1}
                />
                <SvgText
                  x={ML - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill={axisLabelColor}
                  fontWeight="500"
                  fontFamily={fontFamily.medium}
                >
                  {new Intl.NumberFormat('en-US', {
                    notation: 'compact',
                    maximumFractionDigits: 0,
                  }).format(val)}
                </SvgText>
              </G>
            ))}

            {/* X-axis baseline */}
            <Line
              x1={ML}
              y1={closeY}
              x2={ML + plotW}
              y2={closeY}
              stroke={gridColor}
              strokeWidth={1}
            />

            {/* Expense area fill */}
            <Path d={smoothPath(expensePts, true, closeY)} fill="url(#expenseGrad)" />
            {/* Income area fill */}
            <Path d={smoothPath(incomePts, true, closeY)} fill="url(#incomeGrad)" />

            {/* Expense line */}
            <Path
              d={smoothPath(expensePts, false, closeY)}
              fill="none"
              stroke={expenseColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Income line */}
            <Path
              d={smoothPath(incomePts, false, closeY)}
              fill="none"
              stroke={incomeColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Income dots — cleaner micro-markers */}
            {incomePts.map((pt, i) => (
              <G key={`idot-${i}`}>
                <Path
                  d={`M ${pt.x} ${pt.y} m -2.5 0 a 2.5 2.5 0 1 0 5 0 a 2.5 2.5 0 1 0 -5 0`}
                  fill={theme.card}
                  stroke={incomeColor}
                  strokeWidth={1.5}
                />
              </G>
            ))}
            {/* Expense dots — cleaner micro-markers */}
            {expensePts.map((pt, i) => (
              <G key={`edot-${i}`}>
                <Path
                  d={`M ${pt.x} ${pt.y} m -2.5 0 a 2.5 2.5 0 1 0 5 0 a 2.5 2.5 0 1 0 -5 0`}
                  fill={theme.card}
                  stroke={expenseColor}
                  strokeWidth={1.5}
                />
              </G>
            ))}

            {/* X-axis labels */}
            {xIndices.map((idx) => {
              const d = data[idx];
              if (!d) return null;
              const label = (() => {
                try { return format(new Date(d.date), 'MMM d'); } catch { return ''; }
              })();
              return (
                <SvgText
                  key={`xlabel-${idx}`}
                  x={sx(idx)}
                  y={closeY + 16}
                  textAnchor="middle"
                  fontSize={9}
                  fill={axisLabelColor}
                  fontWeight="600"
                >
                  {label}
                </SvgText>
              );
            })}
          </Svg>

          {/* Legend */}
          {!hideHeader && (
            <View style={[styles.legend, { borderTopColor: theme.border }]}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: incomeColor }]} />
                <Text style={[styles.legendLabel, { color: theme.foreground }]}>Income</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: expenseColor }]} />
                <Text style={[styles.legendLabel, { color: theme.foreground }]}>Expenses</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleCol: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  countsRow: {
    flexDirection: 'row',
  },
  countBox: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth,
    minWidth: 80,
  },
  countLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  countValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  chartWrap: {
    paddingTop: spacing.sm,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  emptyDesc: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});
