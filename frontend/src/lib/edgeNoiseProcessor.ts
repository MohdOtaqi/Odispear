/**
 * Edge Browser Noise Processor
 * Lightweight Web Audio API-based noise reduction for Microsoft Edge
 * Since Edge doesn't support Daily.co Krisp processor
 */

// Simple noise gate parameters
const NOISE_THRESHOLD = 0.02; // Audio below this is considered noise
const GATE_ATTACK = 0.005; // 5ms attack
const GATE_RELEASE = 0.1; // 100ms release

let gateLevel = 0;
let lastRMS = 0;

/**
 * Apply simple noise gate to reduce background noise
 */
function applyNoiseGate(samples: Float32Array): Float32Array {
  const output = new Float32Array(samples.length);
  
  // Calculate RMS (volume level)
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  const rms = Math.sqrt(sum / samples.length);
  
  // Smooth RMS to avoid rapid changes
  const smoothedRMS = lastRMS * 0.7 + rms * 0.3;
  lastRMS = smoothedRMS;
  
  // Calculate target gate level (0 = closed, 1 = open)
  const targetGate = smoothedRMS > NOISE_THRESHOLD ? 1 : 0;
  
  // Apply attack/release envelope
  if (targetGate > gateLevel) {
    // Attack (opening gate)
    gateLevel += (targetGate - gateLevel) * GATE_ATTACK * 100;
  } else {
    // Release (closing gate)
    gateLevel += (targetGate - gateLevel) * GATE_RELEASE;
  }
  
  // Clamp gate level
  gateLevel = Math.max(0, Math.min(1, gateLevel));
  
  // Apply gate to samples
  for (let i = 0; i < samples.length; i++) {
    output[i] = samples[i] * gateLevel;
  }
  
  return output;
}

/**
 * Create noise-reduced audio stream for Edge browser
 * Uses Web Audio API: High-pass filter + Compressor + Noise gate
 */
export async function createEdgeNoiseReducedStream(
  originalStream: MediaStream
): Promise<MediaStream> {
  try {
    // Get enhanced stream with browser noise suppression
    const enhancedStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: originalStream.getAudioTracks()[0]?.getSettings().deviceId,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    });

    const audioContext = new AudioContext({ sampleRate: 48000 });
    const source = audioContext.createMediaStreamSource(enhancedStream);
    
    // 1. High-pass filter - Remove low-frequency rumble (< 100Hz)
    const highPassFilter = audioContext.createBiquadFilter();
    highPassFilter.type = 'highpass';
    highPassFilter.frequency.value = 100;
    highPassFilter.Q.value = 0.7;
    
    // 2. Compressor - Smooth out volume peaks and reduce sudden noises
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -24; // Start compressing at -24dB
    compressor.knee.value = 12;
    compressor.ratio.value = 4; // 4:1 compression
    compressor.attack.value = 0.003; // 3ms attack
    compressor.release.value = 0.1; // 100ms release
    
    // 3. Script processor for noise gate
    const bufferSize = 2048;
    const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
    
    processor.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);
      const outputData = event.outputBuffer.getChannelData(0);
      
      // Apply noise gate
      const processed = applyNoiseGate(inputData);
      outputData.set(processed);
    };

    // Connect audio chain
    source.connect(highPassFilter);
    highPassFilter.connect(compressor);
    compressor.connect(processor);
    
    // Create output stream
    const destination = audioContext.createMediaStreamDestination();
    processor.connect(destination);
    
    console.log('[EdgeNoise] ✅ Edge noise reduction active (HP@100Hz + Compressor + Gate)');
    return destination.stream;
  } catch (error) {
    console.error('[EdgeNoise] Failed to create noise-reduced stream:', error);
    return originalStream;
  }
}

/**
 * Detect if browser is Microsoft Edge
 */
export function isEdgeBrowser(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.indexOf('edg/') > -1;
}
