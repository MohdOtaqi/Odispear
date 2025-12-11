/**
 * Audio Processor with Advanced Noise Gate
 * Provides effective noise suppression for keyboard clicks and background noise
 */

// Noise gate state
const NOISE_GATE_THRESHOLD = 0.015; // Threshold for detecting speech vs noise
const ATTACK_TIME = 0.005; // 5ms attack (how fast gate opens)
const RELEASE_TIME = 0.15; // 150ms release (how fast gate closes)
const HOLD_TIME = 0.1; // 100ms hold (minimum time gate stays open)

let noiseGateActive = false;
let gateLevel = 0; // 0 = closed, 1 = open
let holdCounter = 0;
let lastRMS = 0;

/**
 * Advanced noise gate with attack/release/hold
 * More effective than simple threshold gating
 */
function applyNoiseGate(inputFrame: Float32Array, sampleRate: number = 48000): Float32Array {
  const output = new Float32Array(inputFrame.length);
  const frameDuration = inputFrame.length / sampleRate;
  
  // Calculate RMS (root mean square) of the frame
  let sum = 0;
  for (let i = 0; i < inputFrame.length; i++) {
    sum += inputFrame[i] * inputFrame[i];
  }
  const rms = Math.sqrt(sum / inputFrame.length);
  
  // Smooth RMS to avoid rapid changes
  const smoothedRMS = lastRMS * 0.7 + rms * 0.3;
  lastRMS = smoothedRMS;
  
  // Determine if we should open or close the gate
  const shouldOpen = smoothedRMS > NOISE_GATE_THRESHOLD;
  
  if (shouldOpen) {
    // Open gate quickly (attack)
    gateLevel = Math.min(1, gateLevel + (frameDuration / ATTACK_TIME));
    holdCounter = HOLD_TIME;
  } else if (holdCounter > 0) {
    // Keep gate open during hold time
    holdCounter -= frameDuration;
    gateLevel = 1;
  } else {
    // Close gate slowly (release)
    gateLevel = Math.max(0, gateLevel - (frameDuration / RELEASE_TIME));
  }
  
  // Apply gate level to audio
  for (let i = 0; i < output.length; i++) {
    // Smooth per-sample to avoid clicks
    const samplePosition = i / inputFrame.length;
    const smoothGate = gateLevel * (0.9 + 0.1 * Math.cos(samplePosition * Math.PI));
    output[i] = inputFrame[i] * smoothGate;
  }
  
  return output;
}

// Cleanup function - reset noise gate state
export function destroyRNNoise(): void {
  noiseGateActive = false;
  gateLevel = 0;
  holdCounter = 0;
  lastRMS = 0;
  console.log('[AudioProcessor] Noise gate deactivated');
}

/**
 * Create a noise-suppressed audio stream using Web Audio API with noise gate
 */
export async function createNoiseSuppressedStream(
  originalStream: MediaStream
): Promise<MediaStream> {
  try {
    const audioContext = new AudioContext({ sampleRate: 48000 });
    const source = audioContext.createMediaStreamSource(originalStream);
    
    // Create a ScriptProcessor for real-time noise gate
    const bufferSize = 2048; // Smaller buffer for lower latency
    const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
    
    noiseGateActive = true;
    
    processor.onaudioprocess = (event) => {
      if (!noiseGateActive) return;
      
      const inputData = event.inputBuffer.getChannelData(0);
      const outputData = event.outputBuffer.getChannelData(0);
      
      // Apply noise gate
      const processed = applyNoiseGate(inputData);
      outputData.set(processed);
    };

    // Connect the audio graph
    source.connect(processor);
    
    // Create output stream
    const destination = audioContext.createMediaStreamDestination();
    processor.connect(destination);
    
    console.log('[AudioProcessor] Noise gate stream created');
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
