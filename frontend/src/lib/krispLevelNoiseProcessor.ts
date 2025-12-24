/**
 * Enhanced RNNoise AI Noise Suppression with Transient Detection
 * Features:
 * - RNNoise neural network for continuous noise suppression
 * - Transient detection to suppress keyboard clicks even during speech
 * - Proper mute/unmute handling with buffer clearing
 * - State persists across mute/unmute cycles
 */

const RNNOISE_FRAME_SIZE = 480;
const SAMPLE_RATE = 48000;

// Persistent module state (survives mute/unmute)
let rnnoiseModule: any = null;
let denoiseState: number = 0;
let inputPtr: number = 0;
let outputPtr: number = 0;
let isModuleReady = false;

// Per-stream state (recreated each time)
let audioContext: AudioContext | null = null;
let scriptProcessor: ScriptProcessorNode | null = null;
let sourceNode: MediaStreamAudioSourceNode | null = null;

// Mute control state
let isMutedByControl = false;
let inputBuffer = new Float32Array(0);
let outputBuffer = new Float32Array(0);

// Transient detection state
const TRANSIENT_HISTORY_SIZE = 8; // ~8 frames of history for detection
const TRANSIENT_THRESHOLD_RATIO = 4.0; // Energy spike must be 4x the average to be a transient
const TRANSIENT_RECOVERY_FRAMES = 3; // How many frames to attenuate after transient
let energyHistory: number[] = [];
let transientRecoveryCounter = 0;

/**
 * Initialize RNNoise module (only once)
 */
async function ensureRNNoiseModule(): Promise<void> {
    if (isModuleReady && rnnoiseModule && denoiseState) {
        console.log('[RNNoiseAI] ✅ Reusing existing RNNoise module');
        return;
    }

    console.log('[RNNoiseAI] 🔄 Initializing RNNoise AI...');

    try {
        const { createRNNWasmModule } = await import('@jitsi/rnnoise-wasm');
        rnnoiseModule = await createRNNWasmModule();

        denoiseState = rnnoiseModule._rnnoise_create(null);
        if (!denoiseState) throw new Error('Failed to create denoise state');

        inputPtr = rnnoiseModule._malloc(RNNOISE_FRAME_SIZE * 4);
        outputPtr = rnnoiseModule._malloc(RNNOISE_FRAME_SIZE * 4);

        isModuleReady = true;
        console.log('[RNNoiseAI] ✅ RNNoise AI ready');
    } catch (error) {
        console.error('[RNNoiseAI] ❌ Init failed:', error);
        throw error;
    }
}

/**
 * Calculate frame energy (RMS)
 */
function calculateEnergy(frame: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < frame.length; i++) {
        sum += frame[i] * frame[i];
    }
    return Math.sqrt(sum / frame.length);
}

/**
 * Detect transient (keyboard click, mouse click, etc.)
 * Returns attenuation factor (1.0 = no attenuation, 0.0 = full mute)
 */
function detectTransientAndGetAttenuation(currentEnergy: number): number {
    // Update energy history
    energyHistory.push(currentEnergy);
    if (energyHistory.length > TRANSIENT_HISTORY_SIZE) {
        energyHistory.shift();
    }

    // Need enough history to detect transients
    if (energyHistory.length < 3) {
        return 1.0;
    }

    // Calculate average energy (excluding current frame)
    const historyWithoutCurrent = energyHistory.slice(0, -1);
    const avgEnergy = historyWithoutCurrent.reduce((a, b) => a + b, 0) / historyWithoutCurrent.length;

    // Detect transient: sudden spike in energy
    const isTransient = avgEnergy > 0.0001 && currentEnergy > avgEnergy * TRANSIENT_THRESHOLD_RATIO;

    if (isTransient) {
        transientRecoveryCounter = TRANSIENT_RECOVERY_FRAMES;
        console.log('[RNNoiseAI] 🎹 Transient detected - suppressing');
    }

    // Apply attenuation during recovery
    if (transientRecoveryCounter > 0) {
        transientRecoveryCounter--;
        // Gradual recovery: start at 0.1 and ramp up
        const recoveryProgress = 1 - (transientRecoveryCounter / TRANSIENT_RECOVERY_FRAMES);
        return 0.1 + (0.9 * recoveryProgress * recoveryProgress); // Quadratic ramp for smooth recovery
    }

    return 1.0;
}

/**
 * Process single frame through AI + transient detection
 */
function processFrame(inputFrame: Float32Array): Float32Array {
    if (!rnnoiseModule || !denoiseState) return inputFrame;

    try {
        const inOff = inputPtr / 4;
        const outOff = outputPtr / 4;

        // Scale to PCM16 range
        for (let i = 0; i < RNNOISE_FRAME_SIZE; i++) {
            rnnoiseModule.HEAPF32[inOff + i] = inputFrame[i] * 32767;
        }

        // AI denoise
        rnnoiseModule._rnnoise_process_frame(denoiseState, outputPtr, inputPtr);

        // Read processed audio
        const output = new Float32Array(RNNOISE_FRAME_SIZE);
        for (let i = 0; i < RNNOISE_FRAME_SIZE; i++) {
            output[i] = rnnoiseModule.HEAPF32[outOff + i] / 32767;
        }

        // Calculate energy of the PROCESSED frame and detect transients
        const energy = calculateEnergy(output);
        const transientAttenuation = detectTransientAndGetAttenuation(energy);

        // Apply transient attenuation if needed
        if (transientAttenuation < 1.0) {
            for (let i = 0; i < RNNOISE_FRAME_SIZE; i++) {
                output[i] *= transientAttenuation;
            }
        }

        return output;
    } catch (e) {
        return inputFrame;
    }
}

/**
 * Create noise-suppressed stream
 */
export async function createKrispLevelNoiseSuppressedStream(
    originalStream: MediaStream
): Promise<MediaStream> {
    try {
        await ensureRNNoiseModule();

        // Clean up any previous stream resources (but keep module)
        destroyKrispLevelNoise();

        // Reset state for new stream
        isMutedByControl = false;
        inputBuffer = new Float32Array(0);
        outputBuffer = new Float32Array(0);
        energyHistory = [];
        transientRecoveryCounter = 0;

        // Always create fresh AudioContext for the stream
        audioContext = new AudioContext({ sampleRate: SAMPLE_RATE, latencyHint: 'interactive' });
        if (audioContext.state === 'suspended') await audioContext.resume();

        sourceNode = audioContext.createMediaStreamSource(originalStream);
        scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

        scriptProcessor.onaudioprocess = (e) => {
            const input = e.inputBuffer.getChannelData(0);
            const output = e.outputBuffer.getChannelData(0);

            // If muted, output silence and clear buffers
            if (isMutedByControl) {
                output.fill(0);
                inputBuffer = new Float32Array(0);
                outputBuffer = new Float32Array(0);
                return;
            }

            // Append input
            const newIn = new Float32Array(inputBuffer.length + input.length);
            newIn.set(inputBuffer);
            newIn.set(input, inputBuffer.length);
            inputBuffer = newIn;

            // Process complete frames
            while (inputBuffer.length >= RNNOISE_FRAME_SIZE) {
                const frame = inputBuffer.slice(0, RNNOISE_FRAME_SIZE);
                inputBuffer = inputBuffer.slice(RNNOISE_FRAME_SIZE);
                const processed = processFrame(frame);

                const newOut = new Float32Array(outputBuffer.length + processed.length);
                newOut.set(outputBuffer);
                newOut.set(processed, outputBuffer.length);
                outputBuffer = newOut;
            }

            // Output
            if (outputBuffer.length >= output.length) {
                output.set(outputBuffer.slice(0, output.length));
                outputBuffer = outputBuffer.slice(output.length);
            } else {
                output.set(outputBuffer);
                output.fill(0, outputBuffer.length);
                outputBuffer = new Float32Array(0);
            }
        };

        sourceNode.connect(scriptProcessor);
        const destination = audioContext.createMediaStreamDestination();
        scriptProcessor.connect(destination);

        console.log('[RNNoiseAI] ✅ ENHANCED AI NOISE SUPPRESSION ACTIVE (with transient detection)');
        return destination.stream;
    } catch (error) {
        console.error('[RNNoiseAI] ❌ Failed:', error);
        return originalStream;
    }
}

/**
 * Set muted state (for use by LiveKitProvider)
 * This properly mutes without breaking the audio pipeline
 */
export function setKrispMuted(muted: boolean): void {
    const wasMuted = isMutedByControl;
    isMutedByControl = muted;

    if (wasMuted && !muted) {
        // Unmuting - clear buffers to prevent stale audio
        inputBuffer = new Float32Array(0);
        outputBuffer = new Float32Array(0);
        energyHistory = [];
        transientRecoveryCounter = 0;
        console.log('[RNNoiseAI] 🎤 Unmuted - buffers cleared');
    } else if (!wasMuted && muted) {
        console.log('[RNNoiseAI] 🔇 Muted');
    }
}

/**
 * Check if currently muted
 */
export function isKrispMuted(): boolean {
    return isMutedByControl;
}

/**
 * Disconnect current stream (for device switch)
 */
export function destroyKrispLevelNoise(): void {
    if (scriptProcessor) {
        scriptProcessor.disconnect();
        scriptProcessor = null;
    }
    if (sourceNode) {
        sourceNode.disconnect();
        sourceNode = null;
    }
    if (audioContext) {
        audioContext.close().catch(() => { });
        audioContext = null;
    }
    // Reset buffers
    inputBuffer = new Float32Array(0);
    outputBuffer = new Float32Array(0);
    console.log('[RNNoiseAI] 🔄 Stream disconnected (module preserved)');
}

/**
 * Full cleanup (when leaving channel)
 */
export function destroyKrispLevelNoiseFull(): void {
    destroyKrispLevelNoise();

    if (rnnoiseModule && denoiseState) {
        try {
            rnnoiseModule._free(inputPtr);
            rnnoiseModule._free(outputPtr);
            rnnoiseModule._rnnoise_destroy(denoiseState);
        } catch (e) { }
    }
    rnnoiseModule = null;
    denoiseState = 0;
    inputPtr = 0;
    outputPtr = 0;
    isModuleReady = false;
    isMutedByControl = false;
    energyHistory = [];
    transientRecoveryCounter = 0;
    console.log('[RNNoiseAI] 🧹 Full cleanup complete');
}
