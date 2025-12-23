/**
 * Professional Spectral Noise Reduction
 * Implements industry-standard spectral subtraction and Wiener filtering
 * Based on techniques used in Krisp, RTX Voice, and professional audio software
 */

// Advanced parameters for professional noise reduction
const FFT_SIZE = 2048;
const OVERLAP = 0.75; // 75% overlap for smooth processing
const NOISE_LEARNING_FRAMES = 30; // Learn noise for ~1 second
const SPECTRAL_FLOOR = 0.002; // -54dB noise floor
const OVERSUBTRACTION_FACTOR = 2.0; // Aggressive noise removal
const SPECTRAL_SMOOTHING = 0.8; // Temporal smoothing

// Voice activity detection parameters
const VAD_THRESHOLD = 0.03;
const VAD_MIN_SPEECH_FRAMES = 5;
const VAD_MIN_NOISE_FRAMES = 3;

let audioContext: AudioContext | null = null;
let isProcessing = false;

/**
 * Professional spectral noise reduction using FFT-based processing
 */
class SpectralNoiseReducer {
    private fftSize: number;
    private hopSize: number;
    private windowSize: number;
    private sampleRate: number;
    
    // FFT and windowing
    private window: Float32Array;
    private inputBuffer: Float32Array;
    private outputBuffer: Float32Array;
    private overlapBuffer: Float32Array;
    private bufferIndex: number;
    
    // Noise estimation
    private noiseSpectrum: Float32Array;
    private smoothedSpectrum: Float32Array;
    private noiseFrameCount: number;
    private isLearningNoise: boolean;
    
    // Voice activity detection
    private vadHistory: boolean[];
    private speechFrames: number;
    private noiseFrames: number;
    
    constructor(sampleRate: number = 48000) {
        this.sampleRate = sampleRate;
        this.fftSize = FFT_SIZE;
        this.hopSize = Math.floor(this.fftSize * (1 - OVERLAP));
        this.windowSize = this.fftSize;
        
        // Initialize buffers
        this.window = this.createHannWindow(this.windowSize);
        this.inputBuffer = new Float32Array(this.fftSize);
        this.outputBuffer = new Float32Array(this.fftSize);
        this.overlapBuffer = new Float32Array(this.fftSize);
        this.bufferIndex = 0;
        
        // Initialize noise estimation
        this.noiseSpectrum = new Float32Array(this.fftSize / 2 + 1);
        this.smoothedSpectrum = new Float32Array(this.fftSize / 2 + 1);
        this.noiseFrameCount = 0;
        this.isLearningNoise = true;
        
        // Initialize VAD
        this.vadHistory = [];
        this.speechFrames = 0;
        this.noiseFrames = 0;
        
        console.log('[ProfessionalNoise] Spectral reducer initialized:', {
            fftSize: this.fftSize,
            hopSize: this.hopSize,
            sampleRate: this.sampleRate
        });
    }
    
    /**
     * Create Hann window for smooth FFT processing
     */
    private createHannWindow(size: number): Float32Array {
        const window = new Float32Array(size);
        for (let i = 0; i < size; i++) {
            window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
        }
        return window;
    }
    
    /**
     * Simple FFT implementation for spectral processing
     */
    private fft(real: Float32Array, imag: Float32Array): void {
        const n = real.length;
        
        // Bit-reversal permutation
        let j = 0;
        for (let i = 1; i < n; i++) {
            let bit = n >> 1;
            while (j & bit) {
                j ^= bit;
                bit >>= 1;
            }
            j ^= bit;
            
            if (i < j) {
                [real[i], real[j]] = [real[j], real[i]];
                [imag[i], imag[j]] = [imag[j], imag[i]];
            }
        }
        
        // Cooley-Tukey FFT
        for (let len = 2; len <= n; len <<= 1) {
            const wlen = Math.PI * 2 / len;
            for (let i = 0; i < n; i += len) {
                for (let j = 0; j < len / 2; j++) {
                    const u = real[i + j];
                    const v = imag[i + j];
                    const s = Math.cos(wlen * j);
                    const t = Math.sin(wlen * j);
                    const x = real[i + j + len / 2];
                    const y = imag[i + j + len / 2];
                    
                    real[i + j] = u + (x * s - y * t);
                    imag[i + j] = v + (x * t + y * s);
                    real[i + j + len / 2] = u - (x * s - y * t);
                    imag[i + j + len / 2] = v - (x * t + y * s);
                }
            }
        }
    }
    
    /**
     * Inverse FFT for reconstruction
     */
    private ifft(real: Float32Array, imag: Float32Array): void {
        // Conjugate
        for (let i = 0; i < imag.length; i++) {
            imag[i] = -imag[i];
        }
        
        // Forward FFT
        this.fft(real, imag);
        
        // Conjugate and normalize
        const n = real.length;
        for (let i = 0; i < n; i++) {
            real[i] /= n;
            imag[i] = -imag[i] / n;
        }
    }
    
    /**
     * Voice Activity Detection using spectral features
     */
    private detectVoiceActivity(magnitude: Float32Array): boolean {
        // Calculate spectral centroid and energy in voice band
        let totalEnergy = 0;
        let voiceBandEnergy = 0;
        let spectralCentroid = 0;
        let weightedSum = 0;
        
        const voiceBandStart = Math.floor(300 * this.fftSize / this.sampleRate); // 300Hz
        const voiceBandEnd = Math.floor(3400 * this.fftSize / this.sampleRate);   // 3.4kHz
        
        for (let i = 1; i < magnitude.length; i++) {
            const energy = magnitude[i] * magnitude[i];
            totalEnergy += energy;
            
            if (i >= voiceBandStart && i <= voiceBandEnd) {
                voiceBandEnergy += energy;
            }
            
            weightedSum += i * energy;
        }
        
        if (totalEnergy > 0) {
            spectralCentroid = weightedSum / totalEnergy;
        }
        
        const voiceBandRatio = voiceBandEnergy / Math.max(totalEnergy, 1e-10);
        const isVoice = voiceBandRatio > 0.3 && totalEnergy > VAD_THRESHOLD;
        
        // Update VAD history
        this.vadHistory.push(isVoice);
        if (this.vadHistory.length > 10) {
            this.vadHistory.shift();
        }
        
        // Smooth VAD decision
        const recentVoice = this.vadHistory.filter(v => v).length;
        return recentVoice >= 3; // Require 3 out of last 10 frames
    }
    
    /**
     * Spectral subtraction with Wiener filtering
     */
    private spectralSubtraction(magnitude: Float32Array, isVoice: boolean): Float32Array {
        const reducedMagnitude = new Float32Array(magnitude.length);
        
        for (let i = 0; i < magnitude.length; i++) {
            if (this.isLearningNoise && !isVoice) {
                // Update noise estimate during non-speech periods
                this.noiseSpectrum[i] = this.noiseSpectrum[i] * 0.95 + magnitude[i] * 0.05;
            }
            
            // Wiener filtering
            const noiseLevel = Math.max(this.noiseSpectrum[i], SPECTRAL_FLOOR);
            const snr = magnitude[i] / noiseLevel;
            
            let gain: number;
            if (isVoice) {
                // Conservative suppression during speech
                gain = Math.max(0.1, Math.min(1.0, (snr - 1) / snr));
            } else {
                // Aggressive suppression during noise-only periods
                const alpha = OVERSUBTRACTION_FACTOR;
                const subtractedMag = magnitude[i] - alpha * noiseLevel;
                gain = Math.max(SPECTRAL_FLOOR, subtractedMag / magnitude[i]);
            }
            
            // Smooth gain changes
            if (i < this.smoothedSpectrum.length) {
                this.smoothedSpectrum[i] = this.smoothedSpectrum[i] * SPECTRAL_SMOOTHING + gain * (1 - SPECTRAL_SMOOTHING);
                reducedMagnitude[i] = magnitude[i] * this.smoothedSpectrum[i];
            } else {
                reducedMagnitude[i] = magnitude[i] * gain;
            }
        }
        
        return reducedMagnitude;
    }
    
    /**
     * Process audio block with spectral noise reduction
     */
    processBlock(inputData: Float32Array): Float32Array {
        const outputData = new Float32Array(this.hopSize);
        
        // Add input to buffer
        for (let i = 0; i < inputData.length && this.bufferIndex < this.fftSize; i++) {
            this.inputBuffer[this.bufferIndex++] = inputData[i];
        }
        
        if (this.bufferIndex >= this.fftSize) {
            // Apply window
            const windowedInput = new Float32Array(this.fftSize);
            for (let i = 0; i < this.fftSize; i++) {
                windowedInput[i] = this.inputBuffer[i] * this.window[i];
            }
            
            // FFT
            const real = new Float32Array(windowedInput);
            const imag = new Float32Array(this.fftSize);
            this.fft(real, imag);
            
            // Calculate magnitude spectrum
            const magnitude = new Float32Array(this.fftSize / 2 + 1);
            for (let i = 0; i < magnitude.length; i++) {
                magnitude[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
            }
            
            // Voice activity detection
            const isVoice = this.detectVoiceActivity(magnitude);
            
            // Update learning state
            if (this.isLearningNoise) {
                this.noiseFrameCount++;
                if (this.noiseFrameCount >= NOISE_LEARNING_FRAMES) {
                    this.isLearningNoise = false;
                    console.log('[ProfessionalNoise] ✅ Noise learning complete - spectral suppression active');
                }
            }
            
            // Apply spectral subtraction
            const reducedMagnitude = this.spectralSubtraction(magnitude, isVoice);
            
            // Reconstruct complex spectrum
            for (let i = 0; i < magnitude.length; i++) {
                const scale = magnitude[i] > 0 ? reducedMagnitude[i] / magnitude[i] : 0;
                real[i] *= scale;
                imag[i] *= scale;
            }
            
            // Mirror for full FFT
            for (let i = 1; i < this.fftSize / 2; i++) {
                real[this.fftSize - i] = real[i];
                imag[this.fftSize - i] = -imag[i];
            }
            
            // IFFT
            this.ifft(real, imag);
            
            // Apply window and overlap-add
            for (let i = 0; i < this.fftSize; i++) {
                this.outputBuffer[i] = real[i] * this.window[i] + this.overlapBuffer[i];
            }
            
            // Copy output
            for (let i = 0; i < this.hopSize; i++) {
                outputData[i] = this.outputBuffer[i];
            }
            
            // Shift overlap buffer
            for (let i = 0; i < this.fftSize - this.hopSize; i++) {
                this.overlapBuffer[i] = this.outputBuffer[i + this.hopSize];
            }
            for (let i = this.fftSize - this.hopSize; i < this.fftSize; i++) {
                this.overlapBuffer[i] = 0;
            }
            
            // Shift input buffer
            for (let i = 0; i < this.fftSize - this.hopSize; i++) {
                this.inputBuffer[i] = this.inputBuffer[i + this.hopSize];
            }
            this.bufferIndex -= this.hopSize;
        }
        
        return outputData;
    }
}

/**
 * Create professional noise-suppressed stream
 */
export async function createProfessionalNoiseSuppressedStream(
    originalStream: MediaStream
): Promise<MediaStream> {
    try {
        console.log('[ProfessionalNoise] 🎯 Initializing professional spectral noise reduction...');
        
        if (audioContext) {
            await audioContext.close();
        }
        
        // Get enhanced stream
        const originalTrack = originalStream.getAudioTracks()[0];
        const settings = originalTrack?.getSettings();
        
        const enhancedStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: settings?.deviceId ? { exact: settings.deviceId } : undefined,
                echoCancellation: true,
                noiseSuppression: false, // Disable browser NS to avoid conflicts
                autoGainControl: true,
                channelCount: 1,
                sampleRate: 48000,
            }
        });
        
        // Create audio context
        audioContext = new AudioContext({ sampleRate: 48000 });
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        const source = audioContext.createMediaStreamSource(enhancedStream);
        const processor = audioContext.createScriptProcessor(1024, 1, 1);
        const destination = audioContext.createMediaStreamDestination();
        
        // Initialize spectral noise reducer
        const noiseReducer = new SpectralNoiseReducer(48000);
        isProcessing = true;
        
        processor.onaudioprocess = (event) => {
            if (!isProcessing) return;
            
            const inputData = event.inputBuffer.getChannelData(0);
            const outputData = event.outputBuffer.getChannelData(0);
            
            try {
                const processed = noiseReducer.processBlock(inputData);
                
                // Copy processed data to output
                for (let i = 0; i < Math.min(outputData.length, processed.length); i++) {
                    outputData[i] = processed[i];
                }
                
                // Fill remaining samples if needed
                for (let i = processed.length; i < outputData.length; i++) {
                    outputData[i] = 0;
                }
            } catch (error) {
                console.error('[ProfessionalNoise] Processing error:', error);
                // Fallback to passthrough
                for (let i = 0; i < outputData.length; i++) {
                    outputData[i] = inputData[i];
                }
            }
        };
        
        // Connect processing chain
        source.connect(processor);
        processor.connect(destination);
        
        console.log('[ProfessionalNoise] ✅ Professional spectral noise reduction active');
        console.log('[ProfessionalNoise] Using: FFT-based spectral subtraction + Wiener filtering + VAD');
        
        return destination.stream;
        
    } catch (error: any) {
        console.error('[ProfessionalNoise] ❌ Failed to create professional noise suppression:', error);
        return originalStream;
    }
}

/**
 * Cleanup resources
 */
export function destroyProfessionalNoise(): void {
    isProcessing = false;
    if (audioContext) {
        audioContext.close().catch(() => {});
        audioContext = null;
    }
    console.log('[ProfessionalNoise] Resources cleaned up');
}
