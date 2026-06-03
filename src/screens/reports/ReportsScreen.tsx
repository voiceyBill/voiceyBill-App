import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, FileText, Mail, Send, X, CheckCircle, Clock, AlertCircle, MinusCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../theme/colors';
import {
  useGetAllReportsQuery,
  useUpdateReportSettingMutation,
  useResendReportMutation,
  ReportStatus,
} from '../../features/report/reportAPI';
import { useAppDispatch, useTypedSelector } from '../../store/hooks';
import { updateCredentials } from '../../features/auth/authSlice';
import { format } from 'date-fns';

export default function ReportsScreen() {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const dispatch = useAppDispatch();
  const user = useTypedSelector((s) => s.auth.user);
  const reportSetting = useTypedSelector((s) => s.auth.reportSetting);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(reportSetting?.isEnabled ?? false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const { data, isLoading, isFetching, refetch } = useGetAllReportsQuery({ pageNumber: page, pageSize });
  const [updateReportSetting] = useUpdateReportSettingMutation();
  const [resendReport] = useResendReportMutation();
  const [resendingReportId, setResendingReportId] = useState<string | null>(null);

  const reports = data?.reports || [];
  const pagination = data?.pagination;

  useEffect(() => {
    if (showScheduleModal) {
      setScheduleEnabled(reportSetting?.isEnabled ?? false);
    }
  }, [showScheduleModal, reportSetting?.isEnabled]);

  const handleSaveSchedule = async () => {
    setIsSavingSchedule(true);
    try {
      await updateReportSetting({ isEnabled: scheduleEnabled }).unwrap();
      dispatch(updateCredentials({ reportSetting: { isEnabled: scheduleEnabled } }));
      setShowScheduleModal(false);
      Alert.alert('Saved', 'Report schedule updated successfully');
    } catch (error) {
      console.warn('[ReportSettings] save failed:', error);
      const message =
        (error as { data?: { message?: string }; error?: string; status?: number | string })?.data?.message ||
        (error as { error?: string })?.error ||
        `Failed to update report schedule (status ${(error as { status?: number | string })?.status ?? 'unknown'})`;
      Alert.alert('Error', message);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleResend = async (reportId: string) => {
    if (resendingReportId) return;
    setResendingReportId(reportId);
    try {
      await resendReport(reportId).unwrap();
      Alert.alert('Sent', 'Report re-sent to your email');
    } catch (error) {
      const message =
        (error as { data?: { message?: string }; message?: string })?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to resend report';
      Alert.alert('Error', message);
    } finally {
      setResendingReportId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const getStatusConfig = (status: ReportStatus) => {
    switch (status) {
      case 'SENT':
        return { color: themeColors.incomeText, bgColor: themeColors.incomeBg, icon: CheckCircle, label: 'Sent' };
      case 'PENDING':
        return { color: themeColors.mutedForeground, bgColor: themeColors.muted, icon: Clock, label: 'Pending' };
      case 'FAILED':
        return { color: themeColors.destructive, bgColor: themeColors.expenseBg, icon: AlertCircle, label: 'Failed' };
      case 'NO_ACTIVITY':
        return { color: themeColors.mutedForeground, bgColor: themeColors.muted, icon: MinusCircle, label: 'No Activity' };
      default:
        return { color: themeColors.mutedForeground, bgColor: themeColors.muted, icon: Clock, label: status };
    }
  };

  const styles = createStyles(themeColors);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      >
        {/* Header */}
        <View style={styles.navbar}>
          <View style={styles.navbarTop}>
            <View style={styles.navbarTextWrap}>
              <Text style={styles.navbarTitle} numberOfLines={1}>Report History</Text>
              <Text style={styles.navbarSubtitle} numberOfLines={2}>View and manage your financial reports</Text>
            </View>
            <TouchableOpacity
              style={styles.scheduleButton}
              onPress={() => setShowScheduleModal(true)}
            >
              <Calendar size={16} color={themeColors.navbarForeground} />
              <Text style={styles.scheduleButtonText} numberOfLines={1}>Report Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {/* Loading */}
          {isLoading && (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={themeColors.primary} />
              <Text style={[styles.stateText, { color: themeColors.mutedForeground }]}>Loading reports...</Text>
            </View>
          )}

          {/* Empty state */}
          {!isLoading && reports.length === 0 && (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: themeColors.muted }]}>
                <FileText size={32} color={themeColors.mutedForeground} strokeWidth={1.5} />
              </View>
              <Text style={[styles.emptyTitle, { color: themeColors.foreground }]}>No Reports Yet</Text>
              <Text style={[styles.emptyText, { color: themeColors.mutedForeground }]}>
                Your monthly financial reports will appear here once generated.
              </Text>
              <TouchableOpacity
                style={[styles.scheduleHintBtn, { borderColor: themeColors.border }]}
                onPress={() => setShowScheduleModal(true)}
              >
                <Mail size={14} color={themeColors.mutedForeground} />
                <Text style={[styles.scheduleHintText, { color: themeColors.mutedForeground }]}>
                  Configure report schedule
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Reports list */}
          {!isLoading && reports.length > 0 && (
            <View style={styles.list}>
              {reports.map((report) => {
                const status = getStatusConfig(report.status);
                const StatusIcon = status.icon;
                const isResending = resendingReportId === report._id;
                const isResendDisabled =
                  report.status === 'NO_ACTIVITY' ||
                  (resendingReportId !== null && !isResending);
                return (
                  <View
                    key={report._id}
                    style={[styles.reportCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                  >
                    <View style={styles.reportTop}>
                      <View style={[styles.reportIconWrap, { backgroundColor: themeColors.muted }]}>
                        <FileText size={20} color={themeColors.foreground} strokeWidth={1.5} />
                      </View>
                      <View style={styles.reportInfo}>
                        <Text style={[styles.reportTitle, { color: themeColors.foreground }]}>
                          {report.period || 'Financial Report'}
                        </Text>
                        <View style={styles.dateRow}>
                          <Calendar size={12} color={themeColors.mutedForeground} />
                          <Text style={[styles.reportDate, { color: themeColors.mutedForeground }]}>
                            {report.sentDate ? `Sent ${formatDate(report.sentDate)}` : formatDate(report.createdAt)}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
                        <StatusIcon size={12} color={status.color} strokeWidth={2} />
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                      </View>
                    </View>
                    <View style={[styles.reportFooter, { borderTopColor: themeColors.border }]}>
                      <TouchableOpacity
                        style={[
                          styles.resendBtn,
                          { borderColor: themeColors.border, backgroundColor: themeColors.muted },
                          (isResendDisabled || isResending) && styles.resendBtnDisabled,
                        ]}
                        onPress={() => handleResend(report._id)}
                        disabled={isResendDisabled || isResending}
                      >
                        {isResending ? (
                          <ActivityIndicator size="small" color={themeColors.foreground} />
                        ) : (
                          <Send
                            size={14}
                            color={isResendDisabled ? themeColors.mutedForeground : themeColors.foreground}
                          />
                        )}
                        <Text
                          style={[
                            styles.resendBtnText,
                            { color: isResendDisabled ? themeColors.mutedForeground : themeColors.foreground },
                          ]}
                        >
                          {isResending ? 'Sending…' : 'Resend'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <View style={[styles.pagination, { borderTopColor: themeColors.border }]}>
              <TouchableOpacity
                style={[
                  styles.pageBtn,
                  { borderColor: themeColors.border, backgroundColor: themeColors.card },
                  page === 1 && styles.pageBtnDisabled,
                ]}
                onPress={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <Text style={[styles.pageBtnText, { color: page === 1 ? themeColors.mutedForeground : themeColors.foreground }]}>
                  Previous
                </Text>
              </TouchableOpacity>
              <Text style={[styles.pageInfo, { color: themeColors.mutedForeground }]}>
                {pagination.pageNumber} / {pagination.totalPages}
              </Text>
              <TouchableOpacity
                style={[
                  styles.pageBtn,
                  { borderColor: themeColors.border, backgroundColor: themeColors.card },
                  page === pagination.totalPages && styles.pageBtnDisabled,
                ]}
                onPress={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
              >
                <Text style={[styles.pageBtnText, { color: page === pagination.totalPages ? themeColors.mutedForeground : themeColors.foreground }]}>
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Report Settings Modal */}
      <Modal
        visible={showScheduleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: themeColors.foreground }]}>Report Settings</Text>
                <Text style={[styles.modalSubtitle, { color: themeColors.mutedForeground }]}>
                  Enable or disable monthly financial report emails
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowScheduleModal(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={20} color={themeColors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {/* Enable toggle */}
              <View style={[styles.settingRow, { borderColor: themeColors.border }]}>
                <View style={styles.settingRowLeft}>
                  <Text style={[styles.settingLabel, { color: themeColors.foreground }]}>Monthly Reports</Text>
                  <Text style={[styles.settingDesc, { color: themeColors.mutedForeground }]}>
                    {scheduleEnabled ? 'Reports activated' : 'Reports deactivated'}
                  </Text>
                </View>
                <Switch
                  value={scheduleEnabled}
                  onValueChange={setScheduleEnabled}
                  trackColor={{ false: themeColors.muted, true: themeColors.primary }}
                  thumbColor={themeColors.primaryForeground}
                />
              </View>

              {/* Form fields */}
              <View style={{ position: 'relative' }}>
                <View style={styles.formField}>
                  <Text style={[styles.fieldLabel, { color: themeColors.foreground }]}>Email</Text>
                  <View style={[styles.fieldInput, { borderColor: themeColors.border, backgroundColor: themeColors.muted }]}>
                    <Mail size={14} color={themeColors.mutedForeground} />
                    <Text style={[styles.fieldValue, { color: themeColors.mutedForeground }]}>
                      {user?.email || '—'}
                    </Text>
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={[styles.fieldLabel, { color: themeColors.foreground }]}>Repeat On</Text>
                  <View style={[styles.fieldInput, { borderColor: themeColors.border, backgroundColor: themeColors.muted }]}>
                    <Text style={[styles.fieldValue, { color: themeColors.mutedForeground }]}>Monthly</Text>
                  </View>
                </View>

                {!scheduleEnabled && (
                  <View style={styles.disabledOverlay} pointerEvents="none" />
                )}
              </View>

              {/* Summary */}
              <View style={[styles.summaryBox, { backgroundColor: themeColors.muted }]}>
                <Text style={[styles.summaryTitle, { color: themeColors.foreground }]}>Schedule Summary</Text>
                <Text style={[styles.summaryText, { color: themeColors.mutedForeground }]}>
                  {scheduleEnabled
                    ? 'Report will be sent once a month on the 1st day of the next month'
                    : 'Reports are currently deactivated'}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: themeColors.primary }, isSavingSchedule && { opacity: 0.7 }]}
                onPress={handleSaveSchedule}
                disabled={isSavingSchedule}
              >
                {isSavingSchedule ? (
                  <ActivityIndicator color={themeColors.primaryForeground} />
                ) : (
                  <Text style={[styles.saveBtnText, { color: themeColors.primaryForeground }]}>Save changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: typeof colors.light) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    navbar: {
      backgroundColor: theme.navbar,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
    },
    navbarTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.md,
    },
    navbarTextWrap: { flex: 1, minWidth: 0 },
    navbarTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: theme.navbarForeground },
    navbarSubtitle: { fontSize: fontSize.sm, color: theme.navbarForeground, opacity: 0.8, marginTop: spacing.xs },
    scheduleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
      backgroundColor: 'rgba(255,255,255,0.1)',
      flexShrink: 0,
    },
    scheduleButtonText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: theme.navbarForeground },
    content: { padding: spacing.lg },
    centerState: { paddingVertical: spacing.xxxl, alignItems: 'center', gap: spacing.md },
    stateText: { fontSize: fontSize.md },
    emptyState: { paddingVertical: spacing.xxxl, alignItems: 'center', gap: spacing.md },
    emptyIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
    emptyText: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 22, paddingHorizontal: spacing.xl },
    scheduleHintBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
    },
    scheduleHintText: { fontSize: fontSize.sm },
    list: { gap: spacing.md },
    reportCard: {
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      overflow: 'hidden',
    },
    reportTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: spacing.md,
      gap: spacing.md,
    },
    reportIconWrap: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    reportInfo: { flex: 1 },
    reportTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, marginBottom: spacing.xs },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    reportDate: { fontSize: fontSize.xs },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.sm,
      flexShrink: 0,
    },
    statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
    reportFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
    },
    resendBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
    },
    resendBtnDisabled: {
      opacity: 0.5,
    },
    resendBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.xl,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
    },
    pageBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
    },
    pageBtnDisabled: { opacity: 0.4 },
    pageBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
    pageInfo: { fontSize: fontSize.sm },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      borderTopLeftRadius: borderRadius['2xl'],
      borderTopRightRadius: borderRadius['2xl'],
      borderWidth: 1,
      borderBottomWidth: 0,
      maxHeight: '85%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.lg,
      borderBottomWidth: 1,
    },
    modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
    modalSubtitle: { fontSize: fontSize.sm, marginTop: 2 },
    modalContent: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
    },
    settingRowLeft: { flex: 1, gap: 4 },
    settingLabel: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
    settingDesc: { fontSize: fontSize.sm },
    formField: { gap: spacing.xs },
    fieldLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
    fieldInput: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderWidth: 1,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    fieldValue: { fontSize: fontSize.md, flex: 1 },
    disabledOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255,255,255,0.5)',
      borderRadius: borderRadius.md,
    },
    summaryBox: {
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      gap: spacing.xs,
    },
    summaryTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
    summaryText: { fontSize: fontSize.sm, lineHeight: 20 },
    saveBtn: {
      padding: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    saveBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  });
