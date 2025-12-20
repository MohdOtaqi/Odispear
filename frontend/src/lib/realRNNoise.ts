/**
 * Real RNNoise WebAssembly-based noise suppression
 * Uses rnnoise-wasm - free, AI-powered, Krisp-level quality
 * This is the same RNNoise algorithm that powers Krisp and Discord
 */

import RNNoiseNode from 'rnnoise-wasm';

let audioContext: AudioContext | null = null;
let rnnoiseNode: any = null;

/**
 * Create a noise-suppressed audio stream using real RNNoise AI
 * This is the same algorithm that powers Krisp and other commercial solutions
 */
export async function createRealRNNoiseSuppressedStream(
    originalStream: MediaStream
): Promise<MediaStream> {
    try {
        console.log('[RealRNNoise] Initializing RNNoise WebAssembly module...');

        // Create audio context
        audioContext = new AudioContext({ sampleRate: 48000 });
        
        // Create RNNoise node
        await audioContext.audioWorklet.addModule(
            new URL('rnnoise-wasm/dist/rnnoise/worklet/rnnoise-processor.js', import.meta.url).href
        );

        // Create the source from the original stream
        const source = audioContext.createMediaStreamSource(originalStream);
        
        // Create RNNoise processor node
        rnnoiseNode = new RNNoiseNode(audioContext);
        await rnnoiseNode.init();

        console.log('[RealRNNoise] ✅ RNNoise module loaded');

        // Connect: source -> RNNoise -> destination
        source.connect(rnnoiseNode);
        const destination = audioContext.createMediaStreamDestination();
        rnnoiseNode.connect(destination);

        console.log('[RealRNNoise] ✅ AI noise suppression ACTIVE');
        console.log('[RealRNNoise] Algorithm: RNNoise (same as Krisp/Discord)');
        console.log('[RealRNNoise] Processing: Real-time AI inference @ 48kHz');

        return destination.stream;
    } catch (error) {
        console.error('[RealRNNoise] Failed to initialize RNNoise:', error);
        console.log('[RealRNNoise] Falling back to original stream');
        
        // Cleanup on error
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
        
        return originalStream;
    }
}

/**
 * Destroy RNNoise resources
 */
export function destroyRealRNNoise(): void {
    try {
        if (rnnoiseNode) {
            rnnoiseNode.disconnect();
            rnnoiseNode = null;
        }
        
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
        
        console.log('[RealRNNoise] Resources cleaned up');
    } catch (error) {
        console.warn('[RealRNNoise] Error during cleanup:', error);
    }
}
