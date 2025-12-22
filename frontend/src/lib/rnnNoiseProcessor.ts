/**
 * Professional-Grade Noise Suppression for Voice Chat
 * Implements real noise gate with expander, DC blocking, and aggressive filtering
 * Uses setInterval for reliable execution (requestAnimationFrame pauses in background)
 */

// State for cleanup
let audioContext: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;
let gateGainNode: GainNode | null = null;
let gateIntervalId: ReturnType<typeof setInterval> | null = null;

// Noise gate settings - MORE AGGRESSIVE for maximum noise removal
const GATE_THRESHOLD = -35; // dB - signals below this are gated (was -50, more aggressive now)
const GATE_OPEN_THRESHOLD = -28; // dB - signals above this fully open the gate (was -40)
const GATE_ATTACK = 0.005; // 5ms - how fast the gate opens (fast for voice)
const GATE_RELEASE = 0.25; // 250ms - how fast the gate closes (longer to avoid chopping)
const GATE_FLOOR = 0.02; // Minimum gain when gate is closed (2% - nearly silent)

// Debug flag
const DEBUG_NOISE_GATE = true;

/**
 * Get RMS level in dB from audio data
 */
function getRMSdB(dataArray: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);
    // Convert to dB, with floor to prevent -Infinity
    return 20 * Math.log10(Math.max(rms, 1e-10));
}

/**
 * Noise gate processing function - called via setInterval
 */
function processNoiseGate() {
    if (!analyserNode || !gateGainNode || !audioContext) {
        return;
    }

    const dataArray = new Float32Array(analyserNode.fftSize);
    analyserNode.getFloatTimeDomainData(dataArray);

    const currentDB = getRMSdB(dataArray);
    const currentGain = gateGainNode.gain.value;
    const now = audioContext.currentTime;

    let targetGain: number;

    if (currentDB > GATE_OPEN_THRESHOLD) {
        // Signal is strong - fully open the gate
        targetGain = 1.0;
    } else if (currentDB > GATE_THRESHOLD) {
        // Signal is in transition zone - partial opening (smooth ramp)
        const ratio = (currentDB - GATE_THRESHOLD) / (GATE_OPEN_THRESHOLD - GATE_THRESHOLD);
        // Use exponential curve for more natural sound
        targetGain = GATE_FLOOR + (1.0 - GATE_FLOOR) * (ratio * ratio);
    } else {
        // Signal is below threshold - close the gate
        targetGain = GATE_FLOOR;
    }

    // Apply attack/release timing
    if (targetGain > currentGain) {
        // Opening - use attack time
        gateGainNode.gain.setTargetAtTime(targetGain, now, GATE_ATTACK);
    } else {
        // Closing - use release time
        gateGainNode.gain.setTargetAtTime(targetGain, now, GATE_RELEASE);
    }

    // Debug logging (throttled)
    if (DEBUG_NOISE_GATE && Math.random() < 0.02) {
        console.log(`[NoiseGate] Level: ${currentDB.toFixed(1)}dB, Gain: ${(currentGain * 100).toFixed(0)}%, Target: ${(targetGain * 100).toFixed(0)}%`);
    }
}

/**
 * Create a noise-suppressed audio stream with proper noise gate
 */
export async function createRNNoiseSuppressedStream(
    originalStream: MediaStream
): Promise<MediaStream> {
    try {
        // Clean up any existing context
        destroyRNNoise();

        // Get original track settings
        const originalTrack = originalStream.getAudioTracks()[0];
        const settings = originalTrack?.getSettings();

        // Request new stream with browser noise suppression
        let enhancedStream = originalStream;
        try {
            enhancedStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: settings?.deviceId ? { exact: settings.deviceId } : undefined,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1,
                    sampleRate: 48000,
                }
            });
            console.log('[NoiseProcessor] Browser noise suppression enabled');
        } catch (e) {
            console.log('[NoiseProcessor] Using original stream');
            enhancedStream = originalStream;
        }

        // Create audio context at 48kHz for consistency
        audioContext = new AudioContext({ sampleRate: 48000 });

        // Resume context if suspended (browser autoplay policy)
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        const source = audioContext.createMediaStreamSource(enhancedStream);

        // === DC BLOCKER (removes the "tnnnnn" constant tone) ===
        const dcBlocker = audioContext.createBiquadFilter();
        dcBlocker.type = 'highpass';
        dcBlocker.frequency.value = 20; // 20Hz - removes DC and sub-bass rumble
        dcBlocker.Q.value = 0.7;

        // === HIGH-PASS FILTER - Remove low-frequency rumble ===
        const highPassFilter = audioContext.createBiquadFilter();
        highPassFilter.type = 'highpass';
        highPassFilter.frequency.value = 85; // 85Hz cutoff for natural voice
        highPassFilter.Q.value = 0.7;

        // === NOTCH FILTERS - Remove power line hum (VERY narrow) ===
        const notchFilter60 = audioContext.createBiquadFilter();
        notchFilter60.type = 'notch';
        notchFilter60.frequency.value = 60; // 60Hz (US)
        notchFilter60.Q.value = 35; // Very narrow Q

        const notchFilter50 = audioContext.createBiquadFilter();
        notchFilter50.type = 'notch';
        notchFilter50.frequency.value = 50; // 50Hz (EU)
        notchFilter50.Q.value = 35;

        // === HARMONIC NOTCHES ===
        const notchFilter120 = audioContext.createBiquadFilter();
        notchFilter120.type = 'notch';
        notchFilter120.frequency.value = 120; // 2nd harmonic of 60Hz
        notchFilter120.Q.value = 30;

        const notchFilter100 = audioContext.createBiquadFilter();
        notchFilter100.type = 'notch';
        notchFilter100.frequency.value = 100; // 2nd harmonic of 50Hz
        notchFilter100.Q.value = 30;

        // === LOW-PASS FILTER - Remove high-frequency hiss ===
        const lowPassFilter = audioContext.createBiquadFilter();
        lowPassFilter.type = 'lowpass';
        lowPassFilter.frequency.value = 7500; // 7.5kHz - preserves voice clarity
        lowPassFilter.Q.value = 0.7;

        // === VOICE PRESENCE BOOST ===
        const voicePresence = audioContext.createBiquadFilter();
        voicePresence.type = 'peaking';
        voicePresence.frequency.value = 2800; // Mid presence frequency
        voicePresence.Q.value = 1.0;
        voicePresence.gain.value = 2; // +2dB subtle boost

        // === COMPRESSOR - Dynamic range control ===
        const compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.value = -24; // Start compressing at -24dB
        compressor.knee.value = 6;
        compressor.ratio.value = 4; // 4:1 ratio
        compressor.attack.value = 0.003;
        compressor.release.value = 0.15;

        // === ANALYSER for noise gate (placed before gate) ===
        analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 1024; // Smaller for faster response
        analyserNode.smoothingTimeConstant = 0.5;

        // === NOISE GATE (gain node controlled by analyser readings) ===
        gateGainNode = audioContext.createGain();
        gateGainNode.gain.value = 1.0;

        // === MAKEUP GAIN ===
        const makeupGain = audioContext.createGain();
        makeupGain.gain.value = 1.4; // Compensate for compression

        // === Connect the processing chain ===
        source.connect(dcBlocker);
        dcBlocker.connect(highPassFilter);
        highPassFilter.connect(notchFilter60);
        notchFilter60.connect(notchFilter50);
        notchFilter50.connect(notchFilter120);
        notchFilter120.connect(notchFilter100);
        notchFilter100.connect(lowPassFilter);
        lowPassFilter.connect(voicePresence);
        voicePresence.connect(compressor);
        compressor.connect(analyserNode);
        analyserNode.connect(gateGainNode);
        gateGainNode.connect(makeupGain);

        // === Create output stream ===
        const destination = audioContext.createMediaStreamDestination();
        makeupGain.connect(destination);

        // Start the noise gate processing loop using setInterval (more reliable than requestAnimationFrame)
        // 60 updates per second = ~16ms interval
        gateIntervalId = setInterval(processNoiseGate, 16);

        console.log('[NoiseProcessor] ✅ PROFESSIONAL noise suppression ACTIVE');
        console.log('[NoiseProcessor] Chain: DC Block -> HP@85Hz -> Notch@50/60/100/120Hz -> LP@7.5kHz -> Presence@2.8kHz -> Compressor -> Gate -> Output');
        console.log('[NoiseProcessor] Gate: Threshold=' + GATE_THRESHOLD + 'dB, Open=' + GATE_OPEN_THRESHOLD + 'dB, Floor=' + (GATE_FLOOR * 100) + '%');
        console.log('[NoiseProcessor] Sample rate:', audioContext.sampleRate);

        return destination.stream;
    } catch (error) {
        console.error('[NoiseProcessor] Failed to create noise-suppressed stream:', error);
        return originalStream;
    }
}

/**
 * Destroy NoiseProcessor resources
 */
export function destroyRNNoise(): void {
    // Stop the processing interval
    if (gateIntervalId !== null) {
        clearInterval(gateIntervalId);
        gateIntervalId = null;
    }

    // Clean up nodes
    analyserNode = null;
    gateGainNode = null;

    // Close audio context
    if (audioContext) {
        audioContext.close().catch(() => { });
        audioContext = null;
    }

    console.log('[NoiseProcessor] Resources cleaned up');
}
