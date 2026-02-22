
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, Keyboard, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// WAV encoding helpers — converts Float32 PCM samples → 16-bit mono WAV blob
// Bhashini ASR only accepts wav/flac; browsers record webm/mp4, so we convert.
// ---------------------------------------------------------------------------
function writeString(view, offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

function encodePCMtoWAV(float32Samples, sampleRate) {
    const numSamples = float32Samples.length;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);          // PCM chunk size
    view.setUint16(20, 1, true);           // PCM format
    view.setUint16(22, 1, true);           // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true);           // block align
    view.setUint16(34, 16, true);          // bits per sample
    writeString(view, 36, 'data');
    view.setUint32(40, numSamples * 2, true);

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
        const s = Math.max(-1, Math.min(1, float32Samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
    }
    return buffer;
}

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}

/**
 * Decode any browser-recorded blob (webm/mp4/ogg) to 16 kHz mono WAV base64.
 * @param {Blob} blob  - recorded audio blob
 * @param {AudioContext|null} existingCtx - reuse the recording's AudioContext to
 *   avoid Chrome's context-limit issue when close() hasn't finished yet.
 */
async function blobToWavBase64(blob, existingCtx = null) {
    const TARGET_SAMPLE_RATE = 16000;
    const arrayBuffer = await blob.arrayBuffer();
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    // Reuse provided context (already running) or create a fresh one
    const decodeCtx = existingCtx ?? new AudioContextClass();
    const ownsCtx = !existingCtx;

    let audioBuffer;
    try {
        // Resume in case autoplay policy suspended it
        if (decodeCtx.state === 'suspended') await decodeCtx.resume().catch(() => {});
        audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer);
    } finally {
        // Only close if we created it ourselves
        if (ownsCtx) await decodeCtx.close().catch(() => {});
    }

    // Resample to 16 kHz mono using OfflineAudioContext
    const duration = audioBuffer.duration;
    // Guard: OfflineAudioContext requires length >= 1
    const numFrames = Math.ceil(TARGET_SAMPLE_RATE * duration) || 1;
    const offlineCtx = new OfflineAudioContext(1, numFrames, TARGET_SAMPLE_RATE);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);
    const resampled = await offlineCtx.startRendering();

    const wavBuffer = encodePCMtoWAV(resampled.getChannelData(0), TARGET_SAMPLE_RATE);
    return arrayBufferToBase64(wavBuffer);
}

// Audio Waveform Visualization
export function AudioWaveform({ isActive, audioLevel = 0 }) {
    const bars = 20;

    return (
        <div className="flex items-center justify-center gap-1 h-16" data-testid="audio-waveform">
            {Array.from({ length: bars }).map((_, i) => {
                // Create a deterministic but varied height for each bar based on the audioLevel
                const multiplier = 15 + (i % 5) * 5;
                const targetHeight = isActive ? 8 + (audioLevel * multiplier) : 4;

                return (
                    <motion.div
                        key={i}
                        className="w-1 bg-primary rounded-full origin-center"
                        animate={{
                            height: targetHeight,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                        }}
                    />
                );
            })}
        </div>
    );
}

// Voice Recorder Component
export function VoiceRecorder({ onRecordingComplete, onRecordingStateChange, isDisabled = false }) {
    const { t, language } = useLanguage();
    const [isRecording, setIsRecording] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [showTextInput, setShowTextInput] = useState(false);
    const [textInput, setTextInput] = useState('');

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);
    const streamRef = useRef(null);
    const audioContextRef = useRef(null);

    const cleanupAudioResources = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
        }
        audioContextRef.current = null;
        analyserRef.current = null;
    }, []);

    const startRecording = async () => {
        if (isDisabled || isRecording) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: { ideal: 1 },
                    sampleRate: { ideal: 48000 },
                    sampleSize: { ideal: 16 },
                }
            });
            streamRef.current = stream;

            // Set up audio analysis
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContextClass();
            audioContextRef.current = audioContext;
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            // Update audio level
            const updateLevel = () => {
                if (analyserRef.current) {
                    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                    analyserRef.current.getByteFrequencyData(dataArray);
                    const sum = dataArray.reduce((acc, curr) => acc + curr, 0);
                    const average = dataArray.length > 0 ? sum / dataArray.length : 0;
                    setAudioLevel(Number.isFinite(average) ? Math.min(average / 128, 1) : 0);
                    animationFrameRef.current = requestAnimationFrame(updateLevel);
                }
            };
            updateLevel();

            // Set up MediaRecorder
            const preferredMimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
            const mimeType = preferredMimeTypes.find(type => MediaRecorder.isTypeSupported(type));
            const mediaRecorder = mimeType
                ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 })
                : new MediaRecorder(stream, { audioBitsPerSecond: 128000 });

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };            mediaRecorder.onstop = async () => {
                // Stop visual feedback & mic tracks, but do NOT close audioContext yet —
                // we need to reuse it for decodeAudioData to avoid Chrome's context-limit
                // error that appears when close() hasn't finished before a new context is opened.
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                    animationFrameRef.current = null;
                }
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
                analyserRef.current = null;
                onRecordingStateChange?.(false);

                const blobType = mimeType || 'audio/webm';

                // Guard: if no chunks were recorded (too-short tap), bail out cleanly
                if (audioChunksRef.current.length === 0) {
                    console.warn('No audio chunks captured — recording too short?');
                    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                        audioContextRef.current.close().catch(() => {});
                    }
                    audioContextRef.current = null;
                    return;
                }

                const audioBlob = new Blob(audioChunksRef.current, { type: blobType });

                // Steal the recording context so we can pass it to blobToWavBase64
                // and close it ourselves after the async decode finishes.
                const recordingCtx = audioContextRef.current;
                audioContextRef.current = null;

                try {
                    const wavBase64 = await blobToWavBase64(audioBlob, recordingCtx);
                    onRecordingComplete(wavBase64, language, null, 'audio/wav');
                } catch (convErr) {
                    console.error('WAV conversion failed, falling back to raw audio:', convErr);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64Audio = reader.result?.split(',')[1];
                        if (base64Audio) {
                            onRecordingComplete(base64Audio, language, null, blobType);
                        }
                    };
                    reader.readAsDataURL(audioBlob);
                } finally {
                    // Now it's safe to close the recording context
                    if (recordingCtx && recordingCtx.state !== 'closed') {
                        recordingCtx.close().catch(() => {});
                    }
                }
            };

            mediaRecorder.start(150);
            setIsRecording(true);
            onRecordingStateChange?.(true);
        } catch (error) {
            cleanupAudioResources();
            setIsRecording(false);
            setAudioLevel(0);
            onRecordingStateChange?.(false);
            console.error('Error starting recording:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setAudioLevel(0);
        onRecordingStateChange?.(false);
    };

    const handleTextSubmit = () => {
        if (textInput.trim()) {
            onRecordingComplete(null, language, textInput.trim());
            setTextInput('');
        }
    };

    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            cleanupAudioResources();
        };
    }, [cleanupAudioResources]);

    return (
        <div className="space-y-4" data-testid="voice-recorder">
            {/* Waveform */}
            <AnimatePresence>
                {isRecording && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-primary/5 rounded-2xl p-4"
                    >
                        <AudioWaveform isActive={isRecording} audioLevel={audioLevel} />
                        <p className="text-center text-sm text-primary mt-2">{t('listening')}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
                {/* Text Input Toggle */}
                <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full w-12 h-12"
                    onClick={() => setShowTextInput(!showTextInput)}
                    disabled={isDisabled || isRecording}
                    data-testid="toggle-text-input"
                >
                    <Keyboard className="w-5 h-5" />
                </Button>

                {/* Main Mic Button */}
                <motion.div className="relative" whileTap={{ scale: 0.95 }}>
                    {/* Pulse Ring */}
                    {isRecording && (
                        <>
                            <motion.div
                                className="absolute inset-0 bg-red-500 rounded-full"
                                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <motion.div
                                className="absolute inset-0 bg-red-500 rounded-full"
                                animate={{ scale: [1, 1.3], opacity: [0.3, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                            />
                        </>
                    )}                    <Button
                        size="lg"
                        className={cn(
                            "relative z-10 rounded-full w-20 h-20 shadow-2xl transition-all duration-300",
                            isRecording
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-primary hover:bg-primary/90"
                        )}
                        onClick={() => isRecording ? stopRecording() : startRecording()}
                        disabled={isDisabled}
                        data-testid="mic-button"
                    >
                        {isRecording ? (
                            <MicOff className="w-8 h-8 text-white" />
                        ) : (
                            <Mic className="w-8 h-8 text-white" />
                        )}
                    </Button>
                </motion.div>

                {/* Spacer for symmetry */}
                <div className="w-12 h-12" />
            </div>

            {/* Instruction Text */}
            <p className="text-center text-sm text-muted-foreground">
                {isRecording ? t('releaseToSend') : t('pressToRecord')}
            </p>

            {/* Text Input */}
            <AnimatePresence>
                {showTextInput && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-2"
                    >
                        <Input
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder={t('typeMessage')}
                            className="flex-1"
                            onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                            disabled={isDisabled}
                            data-testid="text-input"
                        />
                        <Button
                            onClick={handleTextSubmit}
                            disabled={!textInput.trim() || isDisabled}
                            data-testid="send-text-button"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Audio Player with Waveform
export function AudioPlayer({ audioBase64, onPlayStateChange }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    const playAudio = useCallback(() => {
        if (audioBase64 && !isPlaying) {
            const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
            audioRef.current = audio;

            audio.onplay = () => {
                setIsPlaying(true);
                onPlayStateChange?.(true);
            };

            audio.onended = () => {
                setIsPlaying(false);
                onPlayStateChange?.(false);
            };

            audio.play().catch(console.error);
        }
    }, [audioBase64, isPlaying, onPlayStateChange]);

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
            onPlayStateChange?.(false);
        }
    };

    useEffect(() => {
        // Auto-play when audioBase64 changes
        if (audioBase64) {
            playAudio();
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, [audioBase64, playAudio]);

    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn(
                "rounded-full",
                isPlaying && "text-primary animate-pulse"
            )}
            onClick={isPlaying ? stopAudio : playAudio}
            data-testid="audio-player"
        >
            <Volume2 className="w-5 h-5" />
        </Button>
    );
}
