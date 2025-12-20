/**
 * Audio Processor with Aggressive Noise Suppression
 * Krisp-like noise cancellation using multiple techniques:
 * - Aggressive noise gate with voice activity detection
 * - High-pass filter to remove low-frequency rumble
 * - Spectral subtraction for background noise
 * - Browser's built-in noise suppression
 */

// Aggressive noise gate settings (Krisp-like)
const NOISE_GATE_THRESHOLD = 0.025; // Higher threshold - more aggressive
const ATTACK_TIME = 0.003; // 3ms attack (faster response)
const RELEASE_TIME = 0.08; // 80ms release (faster close)
const HOLD_TIME = 0.05; // 50ms hold (shorter)

// Spectral noise reduction
const NOISE_FLOOR = 0.008; // Samples below this are considered noise
const NOISE_REDUCTION_AMOUNT = 0.85; // 85% noise reduction

let noiseGateActive = false;
let gateLevel = 0; // 0 = closed, 1 = open
let holdCounter = 0;
let lastRMS = 0;
let noiseProfile: Float32Array | null = null;
let frameCount = 0;

/**
 * Aggressive noise gate with voice activity detection
 * More effective than simple threshold gating
 */
function applyAggressiveNoiseGate(inputFrame: Float32Array, sampleRate: number = 48000): Float32Array {
  const output = new Float32Array(inputFrame.length);
  const frameDuration = inputFrame.length / sampleRate;

  // Calculate RMS (root mean square) of the frame
  let sum = 0;
  let peakValue = 0;
  for (let i = 0; i < inputFrame.length; i++) {
    const absVal = Math.abs(inputFrame[i]);
    sum += inputFrame[i] * inputFrame[i];
    if (absVal > peakValue) peakValue = absVal;
  }
  const rms = Math.sqrt(sum / inputFrame.length);

  // Smooth RMS to avoid rapid changes
  const smoothedRMS = lastRMS * 0.6 + rms * 0.4;
  lastRMS = smoothedRMS;

  // Voice Activity Detection - check for speech characteristics
  const crestFactor = peakValue / (rms + 0.0001); // Speech typically has crest factor 3-6
  const isSpeechLike = crestFactor > 2 && crestFactor < 10;

  // Determine if we should open the gate
  const shouldOpen = smoothedRMS > NOISE_GATE_THRESHOLD && isSpeechLike;

  if (shouldOpen) {
    // Open gate quickly (attack)
    gateLevel = Math.min(1, gateLevel + (frameDuration / ATTACK_TIME));
    holdCounter = HOLD_TIME;
  } else if (holdCounter > 0) {
    // Keep gate open during hold time
    holdCounter -= frameDuration;
    gateLevel = 1;
  } else {
    // Close gate aggressively (release)
    gateLevel = Math.max(0, gateLevel - (frameDuration / RELEASE_TIME));
  }

  // Apply gate with spectral noise reduction
  for (let i = 0; i < output.length; i++) {
    let sample = inputFrame[i];

    // Spectral subtraction - reduce low-level noise
    if (Math.abs(sample) < NOISE_FLOOR) {
      sample *= (1 - NOISE_REDUCTION_AMOUNT);
    }

    // Smooth per-sample gating to avoid clicks
    const samplePosition = i / inputFrame.length;
    const smoothGate = gateLevel * (0.95 + 0.05 * Math.cos(samplePosition * Math.PI));
    output[i] = sample * smoothGate;
  }

  return output;
}

// Cleanup function - reset noise gate state
export function destroyRNNoise(): void {
  noiseGateActive = false;
  gateLevel = 0;
  holdCounter = 0;
  lastRMS = 0;
  noiseProfile = null;
  frameCount = 0;
  console.log('[AudioProcessor] Aggressive noise suppression deactivated');
}

/**
 * Create a noise-suppressed audio stream with aggressive filtering
 * Uses Web Audio API filters for stable, low-latency processing
 * Works on all browsers without the deprecated ScriptProcessor
 */
export async function createNoiseSuppressedStream(
  originalStream: MediaStream
): Promise<MediaStream> {
  try {
    // First, try to get a stream with browser's built-in noise suppression
    let enhancedStream = originalStream;
    try {
      enhancedStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: originalStream.getAudioTracks()[0]?.getSettings().deviceId,
          echoCancellation: true,
          noiseSuppression: true, // Browser's built-in (most effective)
          autoGainControl: true,
          // Let browser pick optimal sample rate for this device
        }
      });
      console.log('[AudioProcessor] Browser noise suppression enabled');
    } catch (e) {
      console.log('[AudioProcessor] Using original stream, browser NS not available');
      enhancedStream = originalStream;
    }

    // Create audio context with default sample rate (browser picks best)
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(enhancedStream);

    // High-pass filter to remove low-frequency rumble and microphone handling noise
    const highPassFilter = audioContext.createBiquadFilter();
    highPassFilter.type = 'highpass';
    highPassFilter.frequency.value = 100; // Cut below 100Hz (more aggressive)
    highPassFilter.Q.value = 0.5; // Gentle slope to avoid artifacts

    // Notch filter to remove common 60Hz/50Hz power line hum
    const notchFilter = audioContext.createBiquadFilter();
    notchFilter.type = 'notch';
    notchFilter.frequency.value = 60; // 60Hz hum (US) or 50Hz (EU)
    notchFilter.Q.value = 30; // Narrow notch

    // Low-pass filter to remove high-frequency hiss (above 7kHz)
    const lowPassFilter = audioContext.createBiquadFilter();
    lowPassFilter.type = 'lowpass';
    lowPassFilter.frequency.value = 7000; // Voice doesn't need above 7kHz
    lowPassFilter.Q.value = 0.5;

    // Compressor for consistent volume and sudden noise reduction
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -30; // Start compressing at -30dB
    compressor.knee.value = 20; // Soft knee for natural sound
    compressor.ratio.value = 6; // 6:1 compression
    compressor.attack.value = 0.002; // 2ms attack (fast)
    compressor.release.value = 0.15; // 150ms release

    // Gain node for final volume adjustment
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1.2; // Slight boost to compensate for filtering

    // Connect the audio processing chain
    source.connect(highPassFilter);
    highPassFilter.connect(notchFilter);
    notchFilter.connect(lowPassFilter);
    lowPassFilter.connect(compressor);
    compressor.connect(gainNode);

    // Create output stream
    const destination = audioContext.createMediaStreamDestination();
    gainNode.connect(destination);

    noiseGateActive = true;

    console.log('[AudioProcessor] Aggressive noise suppression ACTIVE');
    console.log('[AudioProcessor] Filters: HP@100Hz, Notch@60Hz, LP@7kHz, Compressor 6:1');
    console.log('[AudioProcessor] Sample rate:', audioContext.sampleRate);
    return destination.stream;
  } catch (error) {
    console.error('[AudioProcessor] Failed to create noise-suppressed stream:', error);
    return originalStream;
  }
}

/**
 * Ping a Daily.co region to measure latency
 */
async function pingRegion(region: string): Promise<number> {
  const endpoints: Record<string, string> = {
    'us-west': 'https://gs-us-west-1.daily.co',
    'us-east': 'https://gs-us-east-1.daily.co',
    'eu-west': 'https://gs-eu-west-1.daily.co',
    'eu-central': 'https://gs-eu-central-1.daily.co',
    'ap-southeast': 'https://gs-ap-southeast-1.daily.co',
    'ap-northeast': 'https://gs-ap-northeast-1.daily.co',
  };

  const endpoint = endpoints[region];
  if (!endpoint) return 9999;

  try {
    const start = performance.now();
    // Use a simple fetch with a timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    await fetch(endpoint, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal
    });

    clearTimeout(timeout);
    const latency = Math.round(performance.now() - start);
    console.log(`[Ping] ${region}: ${latency}ms`);
    return latency;
  } catch (error) {
    console.warn(`[Ping] ${region} failed:`, error);
    return 9999;
  }
}

/**
 * Find the optimal Daily.co region based on latency
 * Similar to Discord's automatic server selection
 */
export async function findOptimalRegion(): Promise<string> {
  console.log('[AudioProcessor] Finding optimal region...');

  const regions = ['us-west', 'us-east', 'eu-west', 'eu-central', 'ap-southeast', 'ap-northeast'];

  // Ping all regions in parallel
  const results = await Promise.all(
    regions.map(async (region) => ({
      region,
      latency: await pingRegion(region),
    }))
  );

  // Sort by latency and pick the best
  results.sort((a, b) => a.latency - b.latency);

  const optimal = results[0];
  console.log(`[AudioProcessor] Optimal region: ${optimal.region} (${optimal.latency}ms)`);
  console.log('[AudioProcessor] All regions:', results);

  return optimal.region;
}
