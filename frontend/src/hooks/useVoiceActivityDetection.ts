import { useEffect, useRef, useState, useCallback } from 'react';

interface UseVoiceActivityDetectionOptions {
    enabled: boolean;
    sensitivity: number; // 0-100, higher = more sensitive (lower threshold)
    stream: MediaStream | null;
    onSpeechStart: () => void;
    onSpeechEnd: () => void;
    holdTime?: number; // ms to keep active after speech ends
}

interface UseVoiceActivityDetectionReturn {
    isSpeaking: boolean;
    currentLevel: number; // 0-100 audio level for visualization
}

/**
 * Voice Activity Detection hook
 * Uses Web Audio API to detect when user is speaking
 * Auto-mutes/unmutes based on sound level threshold
 */
export function useVoiceActivityDetection({
    enabled,
    sensitivity,
    stream,
    onSpeechStart,
    onSpeechEnd,
    holdTime = 300,
}: UseVoiceActivityDetectionOptions): UseVoiceActivityDetectionReturn {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [currentLevel, setCurrentLevel] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isSpeakingRef = useRef(false);

    // Convert sensitivity (0-100) to threshold (0-255)
    // Higher sensitivity = lower threshold
    const getThreshold = useCallback((sens: number) => {
        // Sensitivity 0 = threshold 50 (need loud sound)
        // Sensitivity 50 = threshold 25 (moderate)
        // Sensitivity 100 = threshold 5 (very sensitive)
        const maxThreshold = 50;
        const minThreshold = 5;
        return maxThreshold - (sens / 100) * (maxThreshold - minThreshold);
    }, []);

    // Process audio and detect speech
    const processAudio = useCallback(() => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);

        // Calculate average volume from frequency data
        const sum = dataArrayRef.current.reduce((a, b) => a + b, 0);
        const average = sum / dataArrayRef.current.length;

        // Normalize to 0-100 for UI
        const normalizedLevel = Math.min(100, (average / 128) * 100);
        setCurrentLevel(normalizedLevel);

        const threshold = getThreshold(sensitivity);
        const isAboveThreshold = average > threshold;

        if (isAboveThreshold) {
            // Clear any pending hold timeout
            if (holdTimeoutRef.current) {
                clearTimeout(holdTimeoutRef.current);
                holdTimeoutRef.current = null;
            }

            if (!isSpeakingRef.current) {
                isSpeakingRef.current = true;
                setIsSpeaking(true);
                onSpeechStart();
                console.log('[VAD] Speech started - level:', average.toFixed(1));
            }
        } else {
            // Below threshold - start hold timer if currently speaking
            if (isSpeakingRef.current && !holdTimeoutRef.current) {
                holdTimeoutRef.current = setTimeout(() => {
                    isSpeakingRef.current = false;
                    setIsSpeaking(false);
                    onSpeechEnd();
                    console.log('[VAD] Speech ended - level dropped below threshold');
                    holdTimeoutRef.current = null;
                }, holdTime);
            }
        }

        // Continue monitoring
        animationFrameRef.current = requestAnimationFrame(processAudio);
    }, [sensitivity, holdTime, onSpeechStart, onSpeechEnd, getThreshold]);

    // Set up audio analysis
    useEffect(() => {
        if (!enabled || !stream) {
            // Cleanup when disabled
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            if (holdTimeoutRef.current) {
                clearTimeout(holdTimeoutRef.current);
                holdTimeoutRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            setCurrentLevel(0);
            return;
        }

        // Create audio context and analyser
        audioContextRef.current = new AudioContext();
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.3;
        analyserRef.current = analyser;

        // Create data array for frequency analysis
        const bufferLength = analyser.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);

        // Connect stream to analyser
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyser);

        // Start processing
        animationFrameRef.current = requestAnimationFrame(processAudio);

        console.log('[VAD] Started voice activity detection');

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (holdTimeoutRef.current) {
                clearTimeout(holdTimeoutRef.current);
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
            console.log('[VAD] Stopped voice activity detection');
        };
    }, [enabled, stream, processAudio]);

    return {
        isSpeaking,
        currentLevel,
    };
}

// Sensitivity preset options for UI
export const VAD_SENSITIVITY_PRESETS = [
    { value: 20, label: 'Low (Quiet environment)' },
    { value: 50, label: 'Medium (Normal)' },
    { value: 75, label: 'High (Noisy environment)' },
    { value: 100, label: 'Max (Very sensitive)' },
];

/**
 * Auto-detect optimal sensitivity based on ambient noise
 * Returns recommended sensitivity value (0-100)
 */
export async function autoDetectSensitivity(stream: MediaStream): Promise<number> {
    return new Promise((resolve) => {
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const samples: number[] = [];

        // Sample for 2 seconds
        const sampleInterval = setInterval(() => {
            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            samples.push(avg);
        }, 100);

        setTimeout(() => {
            clearInterval(sampleInterval);
            audioContext.close();

            if (samples.length === 0) {
                resolve(50); // Default
                return;
            }

            // Calculate average ambient level
            const avgAmbient = samples.reduce((a, b) => a + b, 0) / samples.length;

            // Set sensitivity so threshold is above ambient noise
            // Higher ambient = need lower sensitivity to avoid false triggers
            let recommendedSensitivity = 50;

            if (avgAmbient < 5) {
                recommendedSensitivity = 75; // Very quiet - can be more sensitive
            } else if (avgAmbient < 10) {
                recommendedSensitivity = 60;
            } else if (avgAmbient < 20) {
                recommendedSensitivity = 45;
            } else {
                recommendedSensitivity = 30; // Noisy - need lower sensitivity
            }

            console.log('[VAD] Auto-detected sensitivity:', recommendedSensitivity, 'ambient level:', avgAmbient.toFixed(1));
            resolve(recommendedSensitivity);
        }, 2000);
    });
}
