import { useEffect, useCallback, useRef } from 'react';

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

// Default keybinds if none saved
const DEFAULT_KEYBINDS: KeybindAction[] = [
  { id: 'toggle_mute', action: 'Toggle Mute', keys: ['Ctrl', 'Shift', 'M'], enabled: true },
  { id: 'toggle_deafen', action: 'Toggle Deafen', keys: ['Ctrl', 'Shift', 'D'], enabled: true },
  { id: 'push_to_talk', action: 'Push to Talk', keys: ['Space'], enabled: true },
  { id: 'toggle_video', action: 'Toggle Video', keys: ['Ctrl', 'Shift', 'V'], enabled: true },
  { id: 'toggle_stream', action: 'Toggle Screen Share', keys: ['Ctrl', 'Shift', 'S'], enabled: true },
];

export const useGlobalKeybinds = () => {
  const pttActiveRef = useRef(false);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger keybinds when typing in inputs
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Build the key combo string - order matters: Ctrl, Shift, Alt, then key
    const keys: string[] = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.shiftKey) keys.push('Shift');
    if (e.altKey) keys.push('Alt');
    if (e.metaKey) keys.push('Cmd');
    
    // Get the actual key pressed
    let key = e.key;
    if (key === ' ') key = 'Space';
    else if (key.length === 1) key = key.toUpperCase();
    else if (key === 'Control' || key === 'Shift' || key === 'Alt' || key === 'Meta') {
      return; // Don't process modifier keys alone
    }
    
    keys.push(key);
    const keyCombo = keys.join('+');

    // Get keybinds from localStorage or use defaults
    let keybinds: KeybindAction[] = DEFAULT_KEYBINDS;
    try {
      const savedKeybinds = localStorage.getItem('keybinds');
      if (savedKeybinds) {
        const parsed = JSON.parse(savedKeybinds);
        if (Array.isArray(parsed) && parsed.length > 0) {
          keybinds = parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to parse keybinds:', err);
    }

    // Find matching keybind
    const matchedKeybind = keybinds.find(kb => 
      kb.enabled && kb.keys.join('+') === keyCombo
    );

    if (matchedKeybind) {
      e.preventDefault();
      console.log('[Keybind] Triggered:', matchedKeybind.id, keyCombo);
      
      switch (matchedKeybind.id) {
        case 'toggle_mute':
          window.dispatchEvent(new CustomEvent(VOICE_EVENTS.TOGGLE_MUTE));
          break;
        case 'toggle_deafen':
          window.dispatchEvent(new CustomEvent(VOICE_EVENTS.TOGGLE_DEAFEN));
          break;
        case 'push_to_talk':
          if (!pttActiveRef.current) {
            pttActiveRef.current = true;
            window.dispatchEvent(new CustomEvent(VOICE_EVENTS.PUSH_TO_TALK_START));
          }
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
    if (pttActiveRef.current) {
      let keybinds: KeybindAction[] = DEFAULT_KEYBINDS;
      try {
        const savedKeybinds = localStorage.getItem('keybinds');
        if (savedKeybinds) {
          const parsed = JSON.parse(savedKeybinds);
          if (Array.isArray(parsed) && parsed.length > 0) {
            keybinds = parsed;
          }
        }
      } catch (err) {
        // Use defaults
      }
      
      const pttKeybind = keybinds.find(kb => kb.id === 'push_to_talk' && kb.enabled);
      if (pttKeybind) {
        let key = e.key;
        if (key === ' ') key = 'Space';
        else if (key.length === 1) key = key.toUpperCase();
        
        if (pttKeybind.keys.includes(key)) {
          pttActiveRef.current = false;
          window.dispatchEvent(new CustomEvent(VOICE_EVENTS.PUSH_TO_TALK_END));
        }
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
