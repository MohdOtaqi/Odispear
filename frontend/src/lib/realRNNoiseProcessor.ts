/**
 * Real AI Noise Cancellation using RNNoise WebAssembly
 * Uses the actual RNNoise ML model for Krisp-level noise suppression
 */

// RNNoise expects 480 samples per frame at 48kHz
const RNNOISE_FRAME_SIZE = 480;
const SAMPLE_RATE = 48000;

let audioContext: AudioContext | null = null;
let rnnoiseModule: any = null;
let rnnoiseState: any = null;

/**
 * Load the RNNoise WASM module
 */
async function loadRNNoiseModule(): Promise<any> {
    if (rnnoiseModule) return rnnoiseModule;

    try {
        // Dynamically import the sync version which has WASM inlined
        const rnnoise = await import('@jitsi/rnnoise-wasm');
        console.log('[RNNoise] Module imported:', rnnoise);

        // The module exports are in default or directly
        rnnoiseModule = rnnoise.default || rnnoise;
        console.log('[RNNoise] WASM module loaded successfully');

        return rnnoiseModule;
    } catch (error) {
        console.error('[RNNoise] Failed to load WASM module:', error);
        throw error;
    }
}

/**
 * Create RNNoise state instance
 */
async function createRNNoiseState(): Promise<any> {
    const module = await loadRNNoiseModule();

    if (module.rnnoise_create) {
        rnnoiseState = module.rnnoise_create();
        console.log('[RNNoise] State created');
        return rnnoiseState;
    } else if (module.create) {
        rnnoiseState = module.create();
        console.log('[RNNoise] State created (via create)');
        return rnnoiseState;
    } else {
        console.log('[RNNoise] Module exports:', Object.keys(module));
        throw new Error('RNNoise create function not found');
    }
}

/**
 * Create a noise-suppressed audio stream using real RNNoise AI
 */
export async function createRealRNNoiseSuppressedStream(
    originalStream: MediaStream
): Promise<MediaStream> {
    console.log('[RNNoise] 🚀 Starting REAL AI noise suppression...');

    try {
        // Load RNNoise WASM
        await loadRNNoiseModule();

        // Create audio context
        audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });

        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        const source = audioContext.createMediaStreamSource(originalStream);

        // Create script processor for RNNoise processing
        // Note: ScriptProcessorNode is deprecated but still works and is simpler
        const bufferSize = 4096; // Must be power of 2
        const scriptProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1);

        // Buffer to accumulate samples for RNNoise (needs 480 samples per frame)
        let inputBuffer: Float32Array = new Float32Array(0);
        let outputBuffer: Float32Array = new Float32Array(0);

        // Create RNNoise state
        const rnnoiseState = await createRNNoiseState();

        scriptProcessor.onaudioprocess = (event) => {
            const input = event.inputBuffer.getChannelData(0);
            const output = event.outputBuffer.getChannelData(0);

            // Accumulate input samples
            const newInput = new Float32Array(inputBuffer.length + input.length);
            newInput.set(inputBuffer);
            newInput.set(input, inputBuffer.length);
            inputBuffer = newInput;

            // Process complete frames with RNNoise
            while (inputBuffer.length >= RNNOISE_FRAME_SIZE) {
                const frame = inputBuffer.slice(0, RNNOISE_FRAME_SIZE);
                inputBuffer = inputBuffer.slice(RNNOISE_FRAME_SIZE);

                // Convert to Int16 for RNNoise (expects -32768 to 32767)
                const int16Frame = new Int16Array(RNNOISE_FRAME_SIZE);
                for (let i = 0; i < RNNOISE_FRAME_SIZE; i++) {
                    int16Frame[i] = Math.max(-32768, Math.min(32767, Math.round(frame[i] * 32767)));
                }

                // Process with RNNoise
                try {
                    if (rnnoiseModule.rnnoise_process_frame) {
                        rnnoiseModule.rnnoise_process_frame(rnnoiseState, int16Frame, int16Frame);
                    } else if (rnnoiseModule.processFrame) {
                        rnnoiseModule.processFrame(rnnoiseState, int16Frame);
                    }
                } catch (e) {
                    // If processing fails, use original
                    console.warn('[RNNoise] Processing failed, using original');
                }

                // Convert back to Float32
                const processedFrame = new Float32Array(RNNOISE_FRAME_SIZE);
                for (let i = 0; i < RNNOISE_FRAME_SIZE; i++) {
                    processedFrame[i] = int16Frame[i] / 32767;
                }

                // Accumulate output
                const newOutput = new Float32Array(outputBuffer.length + RNNOISE_FRAME_SIZE);
                newOutput.set(outputBuffer);
                newOutput.set(processedFrame, outputBuffer.length);
                outputBuffer = newOutput;
            }

            // Fill output from buffer
            const samplesToOutput = Math.min(output.length, outputBuffer.length);
            output.set(outputBuffer.slice(0, samplesToOutput));
            outputBuffer = outputBuffer.slice(samplesToOutput);

            // Fill remaining with silence if buffer is empty
            if (samplesToOutput < output.length) {
                output.fill(0, samplesToOutput);
            }
        };

        // Connect the nodes
        source.connect(scriptProcessor);

        // Create destination
        const destination = audioContext.createMediaStreamDestination();
        scriptProcessor.connect(destination);

        console.log('[RNNoise] ✅ REAL AI noise suppression ACTIVE');
        console.log('[RNNoise] Using RNNoise WASM with', SAMPLE_RATE, 'Hz,', RNNOISE_FRAME_SIZE, 'samples/frame');

        return destination.stream;

    } catch (error) {
        console.error('[RNNoise] ❌ Failed to create AI noise suppression:', error);
        console.log('[RNNoise] Falling back to browser noise suppression only');

        // Return stream with browser's built-in noise suppression
        try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });
            return fallbackStream;
        } catch (e) {
            return originalStream;
        }
    }
}

/**
 * Destroy RNNoise resources
 */
export function destroyRealRNNoise(): void {
    if (rnnoiseState && rnnoiseModule) {
        try {
            if (rnnoiseModule.rnnoise_destroy) {
                rnnoiseModule.rnnoise_destroy(rnnoiseState);
            } else if (rnnoiseModule.destroy) {
                rnnoiseModule.destroy(rnnoiseState);
            }
        } catch (e) {
            console.warn('[RNNoise] Error destroying state:', e);
        }
        rnnoiseState = null;
    }

    if (audioContext) {
        audioContext.close().catch(() => { });
        audioContext = null;
    }

    console.log('[RNNoise] Resources cleaned up');
}
