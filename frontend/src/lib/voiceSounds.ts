// Voice channel sound effects
// Using Web Audio API for synthesized sounds

let audioContext: AudioContext | null = null;

// Get or create AudioContext (lazy initialization to avoid browser autoplay policy)
const getAudioContext = (): AudioContext | null => {
    if (!audioContext && typeof window !== 'undefined') {
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.warn('[VoiceSounds] Could not create AudioContext:', e);
            return null;
        }
    }
    return audioContext;
};

// Play a synthesized beep/tone
const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume audio context if suspended (browser policy)
    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Fade in
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);

    // Fade out
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
};

// Play a chord (multiple tones)
const playChord = (frequencies: number[], duration: number, type: OscillatorType = 'sine', volume = 0.15) => {
    frequencies.forEach(freq => playTone(freq, duration, type, volume));
};

// Sound when someone joins voice channel - ascending chime
export const playJoinSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Pleasant ascending chime
    setTimeout(() => playTone(523.25, 0.15, 'sine', 0.25), 0);    // C5
    setTimeout(() => playTone(659.25, 0.15, 'sine', 0.25), 80);   // E5
    setTimeout(() => playTone(783.99, 0.2, 'sine', 0.25), 160);   // G5
};

// Sound when someone leaves voice channel - descending tone
export const playLeaveSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Soft descending tone
    setTimeout(() => playTone(659.25, 0.12, 'sine', 0.2), 0);    // E5
    setTimeout(() => playTone(523.25, 0.15, 'sine', 0.2), 80);   // C5
    setTimeout(() => playTone(392.00, 0.18, 'sine', 0.15), 160); // G4
};

// Sound when you mute yourself - quick downward blip
export const playMuteSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Quick low blip
    playTone(350, 0.12, 'sine', 0.25);
    setTimeout(() => playTone(280, 0.1, 'sine', 0.2), 40);
};

// Sound when you unmute yourself - quick upward blip
export const playUnmuteSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Quick high blip
    playTone(440, 0.08, 'sine', 0.25);
    setTimeout(() => playTone(550, 0.12, 'sine', 0.25), 40);
};

// Sound when you deafen - deeper descending tone
export const playDeafenSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Deeper descending sweep
    playTone(400, 0.15, 'triangle', 0.3);
    setTimeout(() => playTone(300, 0.15, 'triangle', 0.25), 60);
    setTimeout(() => playTone(200, 0.2, 'triangle', 0.2), 120);
};

// Sound when you undeafen - ascending chime with warmth
export const playUndeafenSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Warm ascending
    playTone(300, 0.1, 'triangle', 0.25);
    setTimeout(() => playTone(400, 0.12, 'triangle', 0.25), 50);
    setTimeout(() => playTone(500, 0.15, 'triangle', 0.3), 100);
    setTimeout(() => playTone(600, 0.2, 'sine', 0.25), 160);
};

// Sound when you disconnect - quick fade out
export const playDisconnectSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Quick descending disconnect
    playTone(500, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(350, 0.15, 'sine', 0.15), 50);
    setTimeout(() => playTone(200, 0.2, 'sine', 0.1), 120);
};

// Sound when you connect - welcoming chime
export const playConnectSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Welcoming ascending chord
    setTimeout(() => playChord([523.25, 659.25, 783.99], 0.25, 'sine', 0.12), 0); // C major
    setTimeout(() => playTone(1046.50, 0.3, 'sine', 0.2), 150); // C6 accent
};
