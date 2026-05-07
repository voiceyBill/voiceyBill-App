import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import lamejs from 'lamejs';
import { Mic, Play, Pause, Square, ArrowUpRight, ArrowDownRight, Tag, Calendar, CreditCard, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../../theme/colors';
import { useProcessVoiceMutation } from '../../features/voice/voiceAPI';
import { format } from 'date-fns';
import { formatCurrency } from '../../lib/formatCurrency';

interface VoiceRecorderProps {
  loadingChange: boolean;
  onLoadingChange: (loading: boolean) => void;
  onVoiceComplete: (data: any) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  loadingChange,
  onLoadingChange,
  onVoiceComplete,
}) => {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];

  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<any | null>(null);

  const recording = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [processVoice] = useProcessVoiceMutation();

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Microphone permission is required');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recording.current = rec;
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration((p) => p + 1), 1000);
    } catch {
      alert('Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (recording.current && isRecording) {
        await recording.current.stopAndUnloadAsync();
        const uri = recording.current.getURI();
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        try { await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true }); } catch {}
        setIsRecording(false);
        recording.current = null;
        if (uri) setRecordedUri(uri);
      }
    } catch {
      setIsRecording(false);
      recording.current = null;
    }
  };

  const playAudio = async () => {
    try {
      if (!recordedUri) return;
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync({ uri: recordedUri });
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((s: any) => {
          if (s.didJustFinish || !s.isPlaying) setIsPlaying(false);
        });
      }
      await soundRef.current.playAsync();
      setIsPlaying(true);
    } catch {}
  };

  const pauseAudio = async () => {
    try {
      if (soundRef.current) { await soundRef.current.pauseAsync(); setIsPlaying(false); }
    } catch {}
  };

  const clearRecording = async () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (soundRef.current) {
      try { await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }
    setRecordedUri(null);
    setRecordingDuration(0);
    setIsPlaying(false);
    setTranscriptionResult(null);
  };

  const convertWavToMp3 = async (wavUri: string): Promise<string> => {
    const wavData = await FileSystem.readAsStringAsync(wavUri, { encoding: FileSystem.EncodingType.Base64 });
    const binaryString = atob(wavData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const dataView = new DataView(bytes.buffer);
    const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
    const wave = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (riff !== 'RIFF' && wave !== 'WAVE') throw new Error('Invalid WAV format');
    let dataStart = -1, dataSize = 0;
    for (let i = 12; i < bytes.length - 8; i++) {
      if (bytes[i] === 100 && bytes[i+1] === 97 && bytes[i+2] === 116 && bytes[i+3] === 97) {
        dataSize = dataView.getUint32(i + 4, true);
        dataStart = i + 8;
        break;
      }
    }
    if (dataStart === -1) throw new Error('Could not find data chunk in WAV file');
    const samples = new Int16Array(bytes.buffer, dataStart, Math.floor(dataSize / 2));
    const mp3Encoder = new lamejs.Mp3Encoder(1, 44100, 128);
    const mp3Data: Uint8Array[] = [];
    const blockSize = 1152;
    for (let i = 0; i < samples.length; i += blockSize) {
      const buf = mp3Encoder.encodeBuffer(samples.subarray(i, i + blockSize));
      if (buf.length > 0) mp3Data.push(new Uint8Array(buf));
    }
    const flush = mp3Encoder.flush();
    if (flush.length > 0) mp3Data.push(new Uint8Array(flush));
    let total = 0;
    mp3Data.forEach((c) => (total += c.length));
    const mp3Buffer = new Uint8Array(total);
    let offset = 0;
    mp3Data.forEach((c) => { mp3Buffer.set(c, offset); offset += c.length; });
    let bin = '';
    const chunk = 8192;
    for (let i = 0; i < mp3Buffer.length; i += chunk)
      bin += String.fromCharCode.apply(null, Array.from(mp3Buffer.subarray(i, Math.min(i + chunk, mp3Buffer.length))));
    const mp3Uri = FileSystem.cacheDirectory + 'recording_' + Date.now() + '.mp3';
    await FileSystem.writeAsStringAsync(mp3Uri, btoa(bin), { encoding: FileSystem.EncodingType.Base64 });
    return mp3Uri;
  };

  const processVoiceRecording = async () => {
    if (!recordedUri) { alert('No recording found'); return; }
    let uploadUri = recordedUri;
    try {
      onLoadingChange(true);
      const fileExt = recordedUri.split('.').pop()?.toLowerCase();
      if (fileExt === 'wav') {
        try { uploadUri = await convertWavToMp3(recordedUri); } catch {}
      }
      const form = new FormData();
      const ext = uploadUri.split('.').pop()?.toLowerCase();
      let name = 'recording.mp3', mime = 'audio/mpeg';
      if (ext === 'wav') { name = 'recording.wav'; mime = 'audio/wav'; }
      else if (ext === 'm4a' || ext === 'mp4' || ext === 'aac') { name = 'recording.wav'; mime = 'audio/wav'; }
      // @ts-ignore
      form.append('file', { uri: uploadUri, name, type: mime });
      const result = await processVoice(form as any).unwrap();
      if (result?.success && result?.data) {
        setTranscriptionResult(result.data);
        if (uploadUri !== recordedUri) {
          try { await FileSystem.deleteAsync(uploadUri, { idempotent: true }); } catch {}
        }
      } else {
        throw new Error('Failed to process voice');
      }
    } catch (error: any) {
      alert(error?.message || 'Failed to process voice recording. Please try again.');
    } finally {
      onLoadingChange(false);
    }
  };

  const handleApplyResult = () => {
    if (transcriptionResult) {
      onVoiceComplete(transcriptionResult);
      clearRecording();
    }
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const isIncome = transcriptionResult?.type === 'INCOME';

  const styles = createStyles(themeColors);

  return (
    <View style={styles.container}>
      {/* ── Transcription result card ── */}
      {transcriptionResult && !loadingChange ? (
        <View style={[
          styles.resultCard,
          {
            borderColor: isIncome ? themeColors.incomeBg : themeColors.expenseBg,
            backgroundColor: themeColors.card,
          },
        ]}>
          {/* Coloured top bar */}
          <View style={[
            styles.resultBar,
            { backgroundColor: isIncome ? themeColors.incomeBg : themeColors.expenseBg },
          ]}>
            <View style={styles.resultBarLeft}>
              {isIncome
                ? <ArrowUpRight size={15} color={themeColors.incomeText} strokeWidth={2.5} />
                : <ArrowDownRight size={15} color={themeColors.expenseText} strokeWidth={2.5} />}
              <Text style={[styles.resultType, { color: isIncome ? themeColors.incomeText : themeColors.expenseText }]}>
                {isIncome ? 'Income' : 'Expense'}
              </Text>
            </View>
            <View style={styles.successBadge}>
              <CheckCircle2 size={13} color={themeColors.mutedForeground} strokeWidth={2} />
              <Text style={[styles.successText, { color: themeColors.mutedForeground }]}>Transcribed</Text>
            </View>
          </View>

          {/* Body */}
          <View style={styles.resultBody}>
            {/* Title + Amount row */}
            <View style={styles.resultTitleRow}>
              <Text style={[styles.resultTitle, { color: themeColors.foreground }]} numberOfLines={2}>
                {transcriptionResult.title || '—'}
              </Text>
              <Text style={[
                styles.resultAmount,
                { color: isIncome ? themeColors.incomeText : themeColors.expenseText },
              ]}>
                {transcriptionResult.amount != null
                  ? formatCurrency(transcriptionResult.amount, { showSign: true, isExpense: !isIncome })
                  : '—'}
              </Text>
            </View>

            {/* Meta pills */}
            <View style={styles.resultMeta}>
              {transcriptionResult.category ? (
                <View style={[styles.metaPill, { backgroundColor: themeColors.muted }]}>
                  <Tag size={11} color={themeColors.mutedForeground} strokeWidth={2} />
                  <Text style={[styles.metaPillText, { color: themeColors.mutedForeground }]}>
                    {transcriptionResult.category}
                  </Text>
                </View>
              ) : null}
              {transcriptionResult.date ? (
                <View style={[styles.metaPill, { backgroundColor: themeColors.muted }]}>
                  <Calendar size={11} color={themeColors.mutedForeground} strokeWidth={2} />
                  <Text style={[styles.metaPillText, { color: themeColors.mutedForeground }]}>
                    {(() => { try { return format(new Date(transcriptionResult.date), 'MMM d, yyyy'); } catch { return transcriptionResult.date; } })()}
                  </Text>
                </View>
              ) : null}
              {transcriptionResult.paymentMethod ? (
                <View style={[styles.metaPill, { backgroundColor: themeColors.muted }]}>
                  <CreditCard size={11} color={themeColors.mutedForeground} strokeWidth={2} />
                  <Text style={[styles.metaPillText, { color: themeColors.mutedForeground }]}>
                    {transcriptionResult.paymentMethod.replace(/_/g, ' ').toLowerCase()}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Description */}
            {transcriptionResult.description ? (
              <Text style={[styles.resultDescription, { color: themeColors.mutedForeground }]} numberOfLines={2}>
                {transcriptionResult.description}
              </Text>
            ) : null}
          </View>

          {/* Actions */}
          <View style={[styles.resultActions, { borderTopColor: themeColors.border }]}>
            <TouchableOpacity
              style={[styles.reRecordBtn, { borderColor: themeColors.border }]}
              onPress={clearRecording}
              activeOpacity={0.7}
            >
              <RefreshCw size={14} color={themeColors.mutedForeground} strokeWidth={2} />
              <Text style={[styles.reRecordText, { color: themeColors.mutedForeground }]}>Re-record</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: themeColors.primary }]}
              onPress={handleApplyResult}
              activeOpacity={0.8}
            >
              <Text style={[styles.applyBtnText, { color: themeColors.primaryForeground }]}>Apply to Form</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* ── Recorder box ── */
        <View style={[styles.recordBox, { borderColor: themeColors.border, backgroundColor: themeColors.card }]}>
          {/* Idle */}
          {!isRecording && !recordedUri && !loadingChange && (
            <TouchableOpacity style={[styles.startButton, { borderColor: themeColors.border, backgroundColor: themeColors.background }]} onPress={startRecording} activeOpacity={0.7}>
              <View style={[styles.micCircle, { backgroundColor: themeColors.muted }]}>
                <Mic size={22} color={themeColors.foreground} strokeWidth={2} />
              </View>
              <Text style={[styles.startButtonText, { color: themeColors.foreground }]}>Tap to Start Recording</Text>
              <Text style={[styles.startButtonSub, { color: themeColors.mutedForeground }]}>
                Speak clearly about your transaction
              </Text>
            </TouchableOpacity>
          )}

          {/* Recording */}
          {isRecording && (
            <View style={styles.recordingState}>
              <View style={styles.recordingIndicator}>
                <Animated.View style={[styles.redDot, { transform: [{ scale: pulseAnim }] }]} />
                <Text style={[styles.recordingText, { color: themeColors.foreground }]}>Recording</Text>
                <Text style={[styles.recordingDuration, { color: themeColors.mutedForeground }]}>
                  {formatDuration(recordingDuration)}
                </Text>
              </View>
              <TouchableOpacity style={[styles.stopButton, { backgroundColor: themeColors.destructive }]} onPress={stopRecording} activeOpacity={0.8}>
                <Square size={15} color="#fff" fill="#fff" />
                <Text style={styles.stopButtonText}>Stop Recording</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Preview */}
          {recordedUri && !loadingChange && (
            <View style={styles.previewContainer}>
              <View style={[styles.waveformBar, { backgroundColor: themeColors.muted }]}>
                <TouchableOpacity style={[styles.playPauseBtn, { backgroundColor: themeColors.background, borderColor: themeColors.border }]} onPress={isPlaying ? pauseAudio : playAudio} activeOpacity={0.7}>
                  {isPlaying
                    ? <Pause size={16} color={themeColors.foreground} />
                    : <Play size={16} color={themeColors.foreground} />}
                </TouchableOpacity>
                <View style={styles.waveformFill}>
                  <View style={[styles.waveformProgress, { backgroundColor: themeColors.border }]} />
                </View>
                <Text style={[styles.durationText, { color: themeColors.mutedForeground }]}>
                  {formatDuration(recordingDuration)}
                </Text>
              </View>
              <View style={styles.previewActions}>
                <TouchableOpacity style={[styles.clearButton, { borderColor: themeColors.border }]} onPress={clearRecording} activeOpacity={0.7}>
                  <Text style={[styles.clearButtonText, { color: themeColors.mutedForeground }]}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.processButton, { backgroundColor: themeColors.primary }]} onPress={processVoiceRecording} activeOpacity={0.8}>
                  <Text style={[styles.processButtonText, { color: themeColors.primaryForeground }]}>Process Recording</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Processing */}
          {loadingChange && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColors.primary} />
              <Text style={[styles.loadingTitle, { color: themeColors.foreground }]}>Processing…</Text>
              <Text style={[styles.loadingText, { color: themeColors.mutedForeground }]}>
                Analysing your voice recording
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Tip */}
      {!transcriptionResult && (
        <Text style={[styles.helpText, { color: themeColors.mutedForeground }]}>
          Tip: "I spent $1500 at the supermarket for groceries today using my credit card"
        </Text>
      )}
    </View>
  );
};

const createStyles = (theme: typeof colors.light) =>
  StyleSheet.create({
    container: {
      marginBottom: spacing.lg,
    },
    /* ── Recorder box ── */
    recordBox: {
      borderWidth: 1,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      ...shadows.sm,
    },
    startButton: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    micCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    startButtonText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
    startButtonSub: {
      fontSize: fontSize.xs,
      textAlign: 'center',
    },
    recordingState: {
      gap: spacing.md,
      padding: spacing.lg,
    },
    recordingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    redDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#ef4444',
    },
    recordingText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
    recordingDuration: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
    },
    stopButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
    },
    stopButtonText: {
      color: '#ffffff',
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
    previewContainer: {
      gap: spacing.sm,
      padding: spacing.md,
    },
    waveformBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
    },
    playPauseBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    waveformFill: {
      flex: 1,
      height: 28,
      justifyContent: 'center',
    },
    waveformProgress: {
      height: 3,
      borderRadius: 2,
      width: '100%',
    },
    durationText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.medium,
      flexShrink: 0,
    },
    previewActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    clearButton: {
      flex: 1,
      borderWidth: 1,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm + 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearButtonText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
    },
    processButton: {
      flex: 2,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm + 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    processButtonText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      gap: spacing.sm,
    },
    loadingTitle: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.semibold,
    },
    loadingText: {
      fontSize: fontSize.sm,
    },
    /* ── Result card ── */
    resultCard: {
      borderWidth: 1.5,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      ...shadows.sm,
    },
    resultBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    resultBarLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    resultType: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
    successBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    successText: {
      fontSize: 10,
      fontWeight: fontWeight.medium,
    },
    resultBody: {
      padding: spacing.md,
      gap: spacing.sm,
    },
    resultTitleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    resultTitle: {
      flex: 1,
      fontSize: fontSize.base,
      fontWeight: fontWeight.semibold,
      lineHeight: 22,
    },
    resultAmount: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      flexShrink: 0,
    },
    resultMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    metaPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
    },
    metaPillText: {
      fontSize: 11,
      fontWeight: fontWeight.medium,
      textTransform: 'capitalize',
    },
    resultDescription: {
      fontSize: fontSize.xs,
      lineHeight: 18,
    },
    resultActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      padding: spacing.md,
      borderTopWidth: 1,
    },
    reRecordBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      borderWidth: 1,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm + 2,
    },
    reRecordText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
    },
    applyBtn: {
      flex: 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm + 2,
    },
    applyBtnText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
    helpText: {
      fontSize: fontSize.xs,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.xs,
      lineHeight: 18,
    },
  });

export default VoiceRecorder;
