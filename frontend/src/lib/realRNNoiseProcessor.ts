/**
 * Real AI Noise Cancellation using RNNoise WebAssembly
 * Uses the actual RNNoise ML model for Krisp-level noise suppression
 * @jitsi/rnnoise-wasm exports a function that creates the WASM module
 */

// RNNoise expects 480 samples per frame at 48kHz
const RNNOISE_FRAME_SIZE = 480;
const SAMPLE_RATE = 48000;

let audioContext: AudioContext | null = null;
let rnnoiseInstance: any = null;
let denoiseState: number = 0;

/**
 * Initialize RNNoise WASM module
 */
async function initRNNoise(): Promise<any> {
    if (rnnoiseInstance) return rnnoiseInstance;

    try {
        // @jitsi/rnnoise-wasm exports a factory function that creates the WASM module
        const createRNNoiseModule = (await import('@jitsi/rnnoise-wasm')).default;

        console.log('[RNNoise] Factory function loaded, initializing WASM...');

        // Initialize the WASM module
        rnnoiseInstance = await createRNNoiseModule();

        console.log('[RNNoise] WASM initialized');
        console.log('[RNNoise] Available functions:', Object.keys(rnnoiseInstance).filter((k: string) => typeof rnnoiseInstance[k] === 'function'));

        // Create denoise state - the WASM module exposes these C functions
        if (rnnoiseInstance._rnnoise_create) {
            denoiseState = rnnoiseInstance._rnnoise_create(rnnoiseInstance._rnnoise_get_frame_size() || 480);
            console.log('[RNNoise] Denoise state created:', denoiseState);
        } else if (rnnoiseInstance.rnnoise_create) {
            denoiseState = rnnoiseInstance.rnnoise_create();
            console.log('[RNNoise] Denoise state created (alt):', denoiseState);
        } else {
            // Try to find any create-like function
            const fnNames = Object.keys(rnnoiseInstance);
            const createFn = fnNames.find((name: string) => name.includes('create') && typeof rnnoiseInstance[name] === 'function');
            if (createFn) {
                denoiseState = rnnoiseInstance[createFn]();
                console.log('[RNNoise] Denoise state created via', createFn);
            } else {
                console.error('[RNNoise] No create function found. Functions:', fnNames);
                throw new Error('RNNoise create function not found');
            }
        }

        return rnnoiseInstance;
    } catch (error) {
        console.error('[RNNoise] Failed to initialize WASM:', error);
        throw error;
    }
}

/**
 * Process audio frame with RNNoise
 */
function processFrame(inputFrame: Float32Array): Float32Array {
    if (!rnnoiseInstance || !denoiseState) {
        return inputFrame;
    }

    try {
        // Allocate memory for input/output in WASM heap
        const inputPtr = rnnoiseInstance._malloc(RNNOISE_FRAME_SIZE * 4); // 4 bytes per float
        const outputPtr = rnnoiseInstance._malloc(RNNOISE_FRAME_SIZE * 4);

        // Copy input to WASM heap (convert to appropriate format)
        const inputHeap = new Float32Array(rnnoiseInstance.HEAPF32.buffer, inputPtr, RNNOISE_FRAME_SIZE);

        // RNNoise expects samples scaled differently - scale up
        for (let i = 0; i < RNNOISE_FRAME_SIZE; i++) {
            inputHeap[i] = inputFrame[i] * 32767; // Scale to int16 range
        }

        // Process the frame
        let vadProb = 0;
        if (rnnoiseInstance._rnnoise_process_frame) {
            vadProb = rnnoiseInstance._rnnoise_process_frame(denoiseState, outputPtr, inputPtr);
        } else if (rnnoiseInstance.rnnoise_process_frame) {
            vadProb = rnnoiseInstance.rnnoise_process_frame(denoiseState, outputPtr, inputPtr);
        }

        // Copy output back
        const outputHeap = new Float32Array(rnnoiseInstance.HEAPF32.buffer, outputPtr, RNNOISE_FRAME_SIZE);
        const outputFrame = new Float32Array(RNNOISE_FRAME_SIZE);

        for (let i = 0; i < RNNOISE_FRAME_SIZE; i++) {
            outputFrame[i] = outputHeap[i] / 32767; // Scale back
        }

        // Free memory
        rnnoiseInstance._free(inputPtr);
        rnnoiseInstance._free(outputPtr);

        return outputFrame;
    } catch (error) {
        console.warn('[RNNoise] Frame processing error:', error);
        return inputFrame;
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
        // Initialize RNNoise WASM
        await initRNNoise();

        // Create audio context
        audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });

        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        const source = audioContext.createMediaStreamSource(originalStream);

        // Create script processor for RNNoise processing
        const bufferSize = 4096;
        const scriptProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1);

        // Buffer to accumulate samples
        let inputBuffer: Float32Array = new Float32Array(0);
        let outputBuffer: Float32Array = new Float32Array(0);

        scriptProcessor.onaudioprocess = (event: AudioProcessingEvent) => {
            const input = event.inputBuffer.getChannelData(0);
            const output = event.outputBuffer.getChannelData(0);

            // Accumulate input
            const newInput = new Float32Array(inputBuffer.length + input.length);
            newInput.set(inputBuffer);
            newInput.set(input, inputBuffer.length);
            inputBuffer = newInput;

            // Process complete RNNoise frames
            while (inputBuffer.length >= RNNOISE_FRAME_SIZE) {
                const frame = inputBuffer.slice(0, RNNOISE_FRAME_SIZE);
                inputBuffer = inputBuffer.slice(RNNOISE_FRAME_SIZE);

                const processedFrame = processFrame(frame);

                // Accumulate output
                const newOutput = new Float32Array(outputBuffer.length + processedFrame.length);
                newOutput.set(outputBuffer);
                newOutput.set(processedFrame, outputBuffer.length);
                outputBuffer = newOutput;
            }

            // Fill output buffer
            const samplesToOutput = Math.min(output.length, outputBuffer.length);
            output.set(outputBuffer.slice(0, samplesToOutput));
            outputBuffer = outputBuffer.slice(samplesToOutput);

            // Fill remaining with zeros if needed
            if (samplesToOutput < output.length) {
                output.fill(0, samplesToOutput);
            }
        };

        // Connect nodes
        source.connect(scriptProcessor);

        const destination = audioContext.createMediaStreamDestination();
        scriptProcessor.connect(destination);

        console.log('[RNNoise] ✅ REAL AI noise suppression ACTIVE');

        return destination.stream;

    } catch (error) {
        console.error('[RNNoise] ❌ Failed to create AI noise suppression:', error);
        console.log('[RNNoise] Falling back to browser noise suppression only');

        // Fallback to browser's built-in
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
    if (rnnoiseInstance && denoiseState) {
        try {
            if (rnnoiseInstance._rnnoise_destroy) {
                rnnoiseInstance._rnnoise_destroy(denoiseState);
            } else if (rnnoiseInstance.rnnoise_destroy) {
                rnnoiseInstance.rnnoise_destroy(denoiseState);
            }
        } catch (e) {
            console.warn('[RNNoise] Error destroying state:', e);
        }
        denoiseState = 0;
    }

    if (audioContext) {
        audioContext.close().catch(() => { });
        audioContext = null;
    }

    console.log('[RNNoise] Resources cleaned up');
}
