import { useEffect, useCallback, useRef, useState } from 'react';

export type VoiceMode = 'voice_activity' | 'push_to_talk';

interface UsePushToTalkOptions {
    voiceMode: VoiceMode;
    pttKeybind: string; // e.g., 'Space', 'KeyV', 'ControlLeft'
    releaseDelay: number; // ms before muting after key release
    onActivate: () => void;
    onDeactivate: () => void;
}

interface UsePushToTalkReturn {
    isPTTActive: boolean;
    isKeyPressed: boolean;
}

/**
 * Push-to-Talk hook
 * Listens for keyboard events and triggers mute/unmute callbacks
 */
export function usePushToTalk({
    voiceMode,
    pttKeybind,
    releaseDelay,
    onActivate,
    onDeactivate,
}: UsePushToTalkOptions): UsePushToTalkReturn {
    const [isKeyPressed, setIsKeyPressed] = useState(false);
    const [isPTTActive, setIsPTTActive] = useState(false);
    const releaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isActiveRef = useRef(false);

    // Clear any pending release timeout
    const clearReleaseTimeout = useCallback(() => {
        if (releaseTimeoutRef.current) {
            clearTimeout(releaseTimeoutRef.current);
            releaseTimeoutRef.current = null;
        }
    }, []);

    // Handle key down - activate PTT
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Only handle in PTT mode
        if (voiceMode !== 'push_to_talk') return;

        // Check if the pressed key matches the keybind
        if (e.code !== pttKeybind) return;

        // Prevent repeat events when holding key
        if (e.repeat) return;

        // Don't trigger if typing in an input field
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        // Prevent default browser behavior (e.g., space scrolling page)
        e.preventDefault();

        // Clear any pending release
        clearReleaseTimeout();

        // Activate PTT
        if (!isActiveRef.current) {
            isActiveRef.current = true;
            setIsKeyPressed(true);
            setIsPTTActive(true);
            onActivate();
            console.log('[PTT] Activated - key pressed:', pttKeybind);
        }
    }, [voiceMode, pttKeybind, onActivate, clearReleaseTimeout]);

    // Handle key up - deactivate PTT (with optional delay)
    const handleKeyUp = useCallback((e: KeyboardEvent) => {
        // Only handle in PTT mode
        if (voiceMode !== 'push_to_talk') return;

        // Check if the released key matches the keybind
        if (e.code !== pttKeybind) return;

        setIsKeyPressed(false);

        // Apply release delay before deactivating
        clearReleaseTimeout();
        releaseTimeoutRef.current = setTimeout(() => {
            if (isActiveRef.current) {
                isActiveRef.current = false;
                setIsPTTActive(false);
                onDeactivate();
                console.log('[PTT] Deactivated - key released:', pttKeybind);
            }
        }, releaseDelay);
    }, [voiceMode, pttKeybind, releaseDelay, onDeactivate, clearReleaseTimeout]);

    // Handle window blur - deactivate PTT when window loses focus
    const handleBlur = useCallback(() => {
        if (isActiveRef.current) {
            clearReleaseTimeout();
            isActiveRef.current = false;
            setIsKeyPressed(false);
            setIsPTTActive(false);
            onDeactivate();
            console.log('[PTT] Deactivated - window lost focus');
        }
    }, [onDeactivate, clearReleaseTimeout]);

    // Set up event listeners
    useEffect(() => {
        // Only set up listeners in PTT mode
        if (voiceMode !== 'push_to_talk') {
            // Ensure we're not active when switching away from PTT mode
            if (isActiveRef.current) {
                isActiveRef.current = false;
                setIsKeyPressed(false);
                setIsPTTActive(false);
            }
            return;
        }

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleBlur);
            clearReleaseTimeout();
        };
    }, [voiceMode, handleKeyDown, handleKeyUp, handleBlur, clearReleaseTimeout]);

    return {
        isPTTActive,
        isKeyPressed,
    };
}

// Common keybind options for UI
export const PTT_KEYBIND_OPTIONS = [
    { value: 'Space', label: 'Space' },
    { value: 'KeyV', label: 'V' },
    { value: 'KeyT', label: 'T' },
    { value: 'KeyG', label: 'G' },
    { value: 'ControlLeft', label: 'Left Ctrl' },
    { value: 'ControlRight', label: 'Right Ctrl' },
    { value: 'ShiftLeft', label: 'Left Shift' },
    { value: 'Backquote', label: '`' },
    { value: 'CapsLock', label: 'Caps Lock' },
];

// Release delay options
export const PTT_RELEASE_DELAY_OPTIONS = [
    { value: 0, label: 'Instant' },
    { value: 50, label: '50ms' },
    { value: 100, label: '100ms' },
    { value: 200, label: '200ms' },
    { value: 300, label: '300ms' },
];
