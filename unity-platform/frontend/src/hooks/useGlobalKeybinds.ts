import { useEffect, useCallback } from 'react';

interface KeybindAction {
  id: string;
  action: string;
  keys: string[];
  enabled: boolean;
}

// Custom events for voice actions
export const VOICE_EVENTS = {
  TOGGLE_MUTE: 'voice:toggle-mute',
  TOGGLE_DEAFEN: 'voice:toggle-deafen',
  PUSH_TO_TALK_START: 'voice:ptt-start',
  PUSH_TO_TALK_END: 'voice:ptt-end',
} as const;

export const useGlobalKeybinds = () => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger keybinds when typing in inputs
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Build the key combo string
    const keys: string[] = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.shiftKey) keys.push('Shift');
    if (e.altKey) keys.push('Alt');
    if (e.metaKey) keys.push('Cmd');
    
    const key = e.key === ' ' ? 'Space' : e.key.toUpperCase();
    if (!['CONTROL', 'SHIFT', 'ALT', 'META'].includes(key)) {
      keys.push(key);
    }

    const keyCombo = keys.join('+');

    // Get keybinds from localStorage
    const savedKeybinds = localStorage.getItem('keybinds');
    const keybinds: KeybindAction[] = savedKeybinds ? JSON.parse(savedKeybinds) : [];

    // Find matching keybind
    const matchedKeybind = keybinds.find(kb => 
      kb.enabled && kb.keys.join('+') === keyCombo
    );

    if (matchedKeybind) {
      e.preventDefault();
      
      switch (matchedKeybind.id) {
        case 'toggle_mute':
          window.dispatchEvent(new CustomEvent(VOICE_EVENTS.TOGGLE_MUTE));
          break;
        case 'toggle_deafen':
          window.dispatchEvent(new CustomEvent(VOICE_EVENTS.TOGGLE_DEAFEN));
          break;
        case 'push_to_talk':
          window.dispatchEvent(new CustomEvent(VOICE_EVENTS.PUSH_TO_TALK_START));
          break;
        default:
          console.log('Keybind triggered:', matchedKeybind.action);
      }
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Handle push-to-talk release
    const savedKeybinds = localStorage.getItem('keybinds');
    const keybinds: KeybindAction[] = savedKeybinds ? JSON.parse(savedKeybinds) : [];
    
    const pttKeybind = keybinds.find(kb => kb.id === 'push_to_talk' && kb.enabled);
    if (pttKeybind) {
      const key = e.key === ' ' ? 'Space' : e.key.toUpperCase();
      if (pttKeybind.keys.includes(key)) {
        window.dispatchEvent(new CustomEvent(VOICE_EVENTS.PUSH_TO_TALK_END));
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
};
