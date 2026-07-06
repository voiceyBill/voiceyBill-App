import { useRef, useState } from "react";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import lamejs from "lamejs";
import { useProcessVoiceMutation } from "./voiceAPI";

const MIN_RECORD_SECONDS = 0.7;

// iOS records WAV; convert to MP3 before upload. (Android records m4a which the
// server accepts as-is.) Ported from the in-form VoiceRecorder.
async function convertWavToMp3(wavUri: string): Promise<string> {
  const wavData = await FileSystem.readAsStringAsync(wavUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const binaryString = atob(wavData);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++)
    bytes[i] = binaryString.charCodeAt(i);
  const dataView = new DataView(bytes.buffer);
  const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  const wave = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (riff !== "RIFF" && wave !== "WAVE") throw new Error("Invalid WAV format");
  let dataStart = -1,
    dataSize = 0;
  for (let i = 12; i < bytes.length - 8; i++) {
    if (
      bytes[i] === 100 &&
      bytes[i + 1] === 97 &&
      bytes[i + 2] === 116 &&
      bytes[i + 3] === 97
    ) {
      dataSize = dataView.getUint32(i + 4, true);
      dataStart = i + 8;
      break;
    }
  }
  if (dataStart === -1) throw new Error("Could not find data chunk in WAV file");
  const samples = new Int16Array(
    bytes.buffer,
    dataStart,
    Math.floor(dataSize / 2),
  );
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
  mp3Data.forEach((c) => {
    mp3Buffer.set(c, offset);
    offset += c.length;
  });
  let bin = "";
  const chunk = 8192;
  for (let i = 0; i < mp3Buffer.length; i += chunk)
    bin += String.fromCharCode.apply(
      null,
      Array.from(mp3Buffer.subarray(i, Math.min(i + chunk, mp3Buffer.length))),
    );
  const mp3Uri = FileSystem.cacheDirectory + "recording_" + Date.now() + ".mp3";
  await FileSystem.writeAsStringAsync(mp3Uri, btoa(bin), {
    encoding: FileSystem.EncodingType.Base64,
  });
  return mp3Uri;
}

/**
 * Shared voice capture: hold to record, release to process. Owns the expo-av
 * recording + upload so the menu-bar mic can record while held and the popup
 * only shows processing / result.
 */
export function useVoiceCapture() {
  const [processVoice] = useProcessVoiceMutation();
  const recordingRef = useRef<Audio.Recording | null>(null);
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startingRef = useRef(false);

  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    if (startingRef.current || isRecording) return;
    startingRef.current = true;
    setError(null);
    setResult(null);
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        setError("Microphone permission is required.");
        return;
      }
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch {}
        recordingRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((p) => p + 1), 1000);
    } catch {
      recordingRef.current = null;
      setIsRecording(false);
      setError("Couldn't start recording. Please try again.");
    } finally {
      startingRef.current = false;
    }
  };

  const stopInternal = async (): Promise<string | null> => {
    const rec = recordingRef.current;
    if (!rec) return null;
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
      } catch {}
      setIsRecording(false);
      recordingRef.current = null;
      return uri ?? null;
    } catch {
      setIsRecording(false);
      recordingRef.current = null;
      return null;
    }
  };

  const processUri = async (uri: string) => {
    setIsProcessing(true);
    setError(null);
    let uploadUri = uri;
    try {
      const fileExt = uri.split(".").pop()?.toLowerCase();
      if (fileExt === "wav") {
        try {
          uploadUri = await convertWavToMp3(uri);
        } catch {}
      }
      const form = new FormData();
      const ext = uploadUri.split(".").pop()?.toLowerCase();
      let name = "recording.mp3",
        mime = "audio/mpeg";
      if (ext === "wav" || ext === "m4a" || ext === "mp4" || ext === "aac") {
        name = "recording.wav";
        mime = "audio/wav";
      }
      // @ts-ignore React Native FormData file
      form.append("file", { uri: uploadUri, name, type: mime });
      const res = await processVoice(form as any).unwrap();
      if (res?.success && res?.data && !res.data.error) {
        setResult(res.data);
        if (uploadUri !== uri) {
          try {
            await FileSystem.deleteAsync(uploadUri, { idempotent: true });
          } catch {}
        }
      } else {
        setError(res?.data?.error || "Couldn't understand the recording.");
      }
    } catch {
      setError("Failed to process the recording. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Stop recording; report the uri and whether it was too short to keep.
  const stop = async (): Promise<{ uri: string | null; tooShort: boolean }> => {
    const uri = await stopInternal();
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    return { uri, tooShort: !uri || elapsed < MIN_RECORD_SECONDS };
  };

  const cancel = async () => {
    await stopInternal();
    setResult(null);
    setIsProcessing(false);
    setError(null);
    setDuration(0);
  };

  const reset = () => {
    setResult(null);
    setIsProcessing(false);
    setError(null);
    setDuration(0);
  };

  return {
    isRecording,
    duration,
    isProcessing,
    result,
    error,
    start,
    stop,
    process: processUri,
    cancel,
    reset,
  };
}
