import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react-native";
import {
  format as formatDate,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  isAfter,
  isBefore,
} from "date-fns";
import { useTheme } from "../../context/ThemeContext";
import {
  colors,
  spacing,
  borderRadius,
  fontFamily,
  cardRadius,
} from "../../theme/colors";

interface DateFieldProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  /** Sheet title. Defaults to the label. */
  title?: string;
  /** Display format for the trigger button (date-fns). */
  displayFormat?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * A themed calendar date picker that replaces the OS-native
 * `@react-native-community/datetimepicker` so date selection matches the app.
 */
export default function DateField({
  label,
  value,
  onChange,
  title,
  displayFormat = "MMMM do, yyyy",
  minimumDate,
  maximumDate,
  disabled = false,
}: DateFieldProps) {
  const { activeTheme } = useTheme();
  const theme = colors[activeTheme];
  const insets = useSafeAreaInsets();

  const [visible, setVisible] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(value || new Date());

  const open = () => {
    setViewDate(value || new Date());
    setVisible(true);
  };

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 0 });
    const gridEnd = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [viewDate]);

  const isDisabledDay = (day: Date) => {
    if (minimumDate && isBefore(day, stripTime(minimumDate))) return true;
    if (maximumDate && isAfter(day, stripTime(maximumDate))) return true;
    return false;
  };

  const handleSelect = (day: Date) => {
    if (isDisabledDay(day)) return;
    onChange(day);
    setVisible(false);
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        style={[styles.trigger, disabled && styles.triggerDisabled]}
        onPress={() => !disabled && open()}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <CalendarIcon size={16} color={theme.mutedForeground} />
        <Text style={styles.triggerText}>{formatDate(value, displayFormat)}</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.grabber} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{title || label || "Select date"}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setVisible(false)}
                activeOpacity={0.7}
              >
                <X size={18} color={theme.foreground} />
              </TouchableOpacity>
            </View>

            {/* Month navigation */}
            <View style={styles.monthNav}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => setViewDate((d) => subMonths(d, 1))}
                activeOpacity={0.7}
                hitSlop={8}
              >
                <ChevronLeft size={20} color={theme.foreground} />
              </TouchableOpacity>
              <Text style={styles.monthLabel}>
                {formatDate(viewDate, "MMMM yyyy")}
              </Text>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => setViewDate((d) => addMonths(d, 1))}
                activeOpacity={0.7}
                hitSlop={8}
              >
                <ChevronRight size={20} color={theme.foreground} />
              </TouchableOpacity>
            </View>

            {/* Weekday header */}
            <View style={styles.weekRow}>
              {WEEKDAYS.map((wd) => (
                <View key={wd} style={styles.weekCell}>
                  <Text style={styles.weekText}>{wd}</Text>
                </View>
              ))}
            </View>

            {/* Day grid */}
            <View style={styles.grid}>
              {days.map((day) => {
                const selected = isSameDay(day, value);
                const inMonth = isSameMonth(day, viewDate);
                const today = isToday(day);
                const dayDisabled = isDisabledDay(day);

                return (
                  <TouchableOpacity
                    key={day.toISOString()}
                    style={styles.dayCell}
                    onPress={() => handleSelect(day)}
                    disabled={dayDisabled}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.dayInner,
                        selected && { backgroundColor: theme.primary },
                        !selected && today && {
                          borderColor: theme.primary,
                          borderWidth: 1.5,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          { color: theme.foreground },
                          !inMonth && { color: theme.mutedForeground, opacity: 0.45 },
                          today && !selected && { color: theme.primary },
                          selected && {
                            color: theme.primaryForeground,
                            fontFamily: fontFamily.semibold,
                          },
                          dayDisabled && { opacity: 0.25 },
                        ]}
                      >
                        {formatDate(day, "d")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Today shortcut */}
            <TouchableOpacity
              style={styles.todayButton}
              onPress={() => {
                const now = new Date();
                if (!isDisabledDay(now)) {
                  setViewDate(now);
                  handleSelect(now);
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.todayText}>Today</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const stripTime = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

const createStyles = (theme: typeof colors.light) =>
  StyleSheet.create({
    container: {
      width: "100%",
    },
    label: {
      fontFamily: fontFamily.medium,
      fontSize: 13,
      color: theme.foreground,
      marginBottom: spacing.sm,
    },
    trigger: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.md,
      height: 50,
    },
    triggerDisabled: {
      opacity: 0.6,
    },
    triggerText: {
      fontFamily: fontFamily.regular,
      fontSize: 14,
      color: theme.foreground,
    },
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: theme.card,
      borderTopLeftRadius: cardRadius,
      borderTopRightRadius: cardRadius,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      paddingTop: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    grabber: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: borderRadius.full,
      backgroundColor: theme.border,
      marginBottom: spacing.sm,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.xs,
      paddingBottom: spacing.sm,
    },
    sheetTitle: {
      flex: 1,
      fontFamily: fontFamily.semibold,
      fontSize: 17,
      color: theme.foreground,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.muted,
    },
    monthNav: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.sm,
    },
    navButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.muted,
    },
    monthLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: 16,
      color: theme.foreground,
    },
    weekRow: {
      flexDirection: "row",
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    weekCell: {
      flexBasis: `${100 / 7}%`,
      alignItems: "center",
    },
    weekText: {
      fontFamily: fontFamily.medium,
      fontSize: 12,
      color: theme.mutedForeground,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    dayCell: {
      flexBasis: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 2,
    },
    dayInner: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      borderColor: "transparent",
    },
    dayText: {
      fontFamily: fontFamily.regular,
      fontSize: 14,
    },
    todayButton: {
      marginTop: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
    },
    todayText: {
      fontFamily: fontFamily.semibold,
      fontSize: 14,
      color: theme.foreground,
    },
  });
