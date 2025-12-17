import React, { useState, useCallback, useEffect } from 'react';
import { 
  Keyboard, Mouse, Mic, MicOff, Headphones, HeadphonesOff,
  Volume2, Settings, Save, RotateCcw, AlertCircle, Zap
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import toast from 'react-hot-toast';

interface Keybind {
  id: string;
  action: string;
  key?: string;
  mouseButton?: number;
  modifiers: {
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    meta: boolean;
  };
  mode: 'toggle' | 'hold';
  enabled: boolean;
}

const DEFAULT_KEYBINDS: Keybind[] = [
  {
    id: 'ptt',
    action: 'Push to Talk',
    key: 'V',
    modifiers: { ctrl: false, alt: false, shift: false, meta: false },
    mode: 'hold',
    enabled: false
  },
  {
    id: 'mute',
    action: 'Toggle Mute',
    key: 'M',
    modifiers: { ctrl: true, alt: false, shift: false, meta: false },
    mode: 'toggle',
    enabled: true
  },
  {
    id: 'deafen',
    action: 'Toggle Deafen',
    key: 'D',
    modifiers: { ctrl: true, alt: false, shift: false, meta: false },
    mode: 'toggle',
    enabled: true
  },
  {
    id: 'mouse_ptt',
    action: 'Mouse PTT',
    mouseButton: 3, // Mouse button 4 (side button)
    modifiers: { ctrl: false, alt: false, shift: false, meta: false },
    mode: 'hold',
    enabled: false
  },
  {
    id: 'mouse_mute',
    action: 'Mouse Mute',
    mouseButton: 4, // Mouse button 5 (side button)
    modifiers: { ctrl: false, alt: false, shift: false, meta: false },
    mode: 'toggle',
    enabled: false
  }
];

export const KeybindSettings: React.FC = () => {
  const [keybinds, setKeybinds] = useState<Keybind[]>(() => {
    const saved = localStorage.getItem('voiceKeybinds');
    return saved ? JSON.parse(saved) : DEFAULT_KEYBINDS;
  });
  
  const [recording, setRecording] = useState<string | null>(null);
  const [recordedKeys, setRecordedKeys] = useState<Set<string>>(new Set());
  const [pushToTalkActive, setPushToTalkActive] = useState(false);

  // Save keybinds to localStorage
  useEffect(() => {
    localStorage.setItem('voiceKeybinds', JSON.stringify(keybinds));
  }, [keybinds]);

  // Handle key recording
  const startRecording = useCallback((keybindId: string) => {
    setRecording(keybindId);
    setRecordedKeys(new Set());
    toast('Press any key or mouse button...', { icon: '⌨️' });
  }, []);

  const stopRecording = useCallback(() => {
    setRecording(null);
    setRecordedKeys(new Set());
  }, []);

  // Key and mouse event handlers
  useEffect(() => {
    if (!recording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      
      if (e.key === 'Escape') {
        stopRecording();
        return;
      }

      const modifiers = {
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey
      };

      setKeybinds(prev => prev.map(kb => 
        kb.id === recording
          ? { ...kb, key: e.key.toUpperCase(), mouseButton: undefined, modifiers }
          : kb
      ));

      stopRecording();
      toast.success('Keybind set!');
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 1) return; // Ignore left and right click
      
      e.preventDefault();
      
      const modifiers = {
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey
      };

      setKeybinds(prev => prev.map(kb => 
        kb.id === recording
          ? { ...kb, mouseButton: e.button, key: undefined, modifiers }
          : kb
      ));

      stopRecording();
      toast.success(`Mouse button ${e.button} set!`);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [recording, stopRecording]);

  // Apply keybinds in real-time
  useEffect(() => {
    const activeKeybinds = keybinds.filter(kb => kb.enabled);
    
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      activeKeybinds.forEach(kb => {
        if (kb.key && 
            kb.key === e.key.toUpperCase() &&
            kb.modifiers.ctrl === e.ctrlKey &&
            kb.modifiers.alt === e.altKey &&
            kb.modifiers.shift === e.shiftKey &&
            kb.modifiers.meta === e.metaKey) {
          
          e.preventDefault();
          handleKeybindAction(kb, 'down');
        }
      });
    };

    const handleGlobalKeyUp = (e: KeyboardEvent) => {
      activeKeybinds.forEach(kb => {
        if (kb.key && 
            kb.key === e.key.toUpperCase() &&
            kb.mode === 'hold') {
          
          e.preventDefault();
          handleKeybindAction(kb, 'up');
        }
      });
    };

    const handleGlobalMouseDown = (e: MouseEvent) => {
      activeKeybinds.forEach(kb => {
        if (kb.mouseButton !== undefined && 
            kb.mouseButton === e.button &&
            kb.modifiers.ctrl === e.ctrlKey &&
            kb.modifiers.alt === e.altKey &&
            kb.modifiers.shift === e.shiftKey &&
            kb.modifiers.meta === e.metaKey) {
          
          e.preventDefault();
          handleKeybindAction(kb, 'down');
        }
      });
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      activeKeybinds.forEach(kb => {
        if (kb.mouseButton !== undefined && 
            kb.mouseButton === e.button &&
            kb.mode === 'hold') {
          
          e.preventDefault();
          handleKeybindAction(kb, 'up');
        }
      });
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    document.addEventListener('keyup', handleGlobalKeyUp);
    document.addEventListener('mousedown', handleGlobalMouseDown);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
      document.removeEventListener('keyup', handleGlobalKeyUp);
      document.removeEventListener('mousedown', handleGlobalMouseDown);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [keybinds]);

  const handleKeybindAction = useCallback((keybind: Keybind, event: 'down' | 'up') => {
    switch (keybind.id) {
      case 'ptt':
      case 'mouse_ptt':
        if (event === 'down') {
          setPushToTalkActive(true);
          // Enable microphone
          console.log('PTT activated');
        } else {
          setPushToTalkActive(false);
          // Disable microphone
          console.log('PTT deactivated');
        }
        break;
      
      case 'mute':
      case 'mouse_mute':
        if (event === 'down' && keybind.mode === 'toggle') {
          // Toggle mute
          console.log('Toggle mute');
        }
        break;
      
      case 'deafen':
        if (event === 'down' && keybind.mode === 'toggle') {
          // Toggle deafen
          console.log('Toggle deafen');
        }
        break;
    }
  }, []);

  const updateKeybind = useCallback((id: string, updates: Partial<Keybind>) => {
    setKeybinds(prev => prev.map(kb => 
      kb.id === id ? { ...kb, ...updates } : kb
    ));
  }, []);

  const resetKeybinds = useCallback(() => {
    setKeybinds(DEFAULT_KEYBINDS);
    toast.success('Keybinds reset to defaults');
  }, []);

  const formatKeybind = (kb: Keybind) => {
    const parts = [];
    if (kb.modifiers.ctrl) parts.push('Ctrl');
    if (kb.modifiers.alt) parts.push('Alt');
    if (kb.modifiers.shift) parts.push('Shift');
    if (kb.modifiers.meta) parts.push('Cmd');
    
    if (kb.key) {
      parts.push(kb.key);
    } else if (kb.mouseButton !== undefined) {
      parts.push(`Mouse ${kb.mouseButton}`);
    }
    
    return parts.join(' + ') || 'Not set';
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Keyboard className="w-6 h-6" />
          Keybinds & Mouse Settings
        </h2>
        <p className="text-gray-400">
          Configure keyboard shortcuts and mouse buttons for voice chat controls
        </p>
      </div>

      {/* PTT Status Indicator */}
      {pushToTalkActive && (
        <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg animate-pulse">
          <div className="flex items-center gap-3">
            <Mic className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">Push to Talk Active</span>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm text-blue-400 font-medium">Advanced Mouse Support</p>
            <p className="text-sm text-gray-400">
              This app supports mouse buttons 3-5 (side buttons). Make sure your mouse software isn't intercepting these buttons.
            </p>
          </div>
        </div>
      </div>

      {/* Keybinds List */}
      <div className="space-y-4">
        {keybinds.map((keybind) => (
          <div
            key={keybind.id}
            className={`p-4 bg-[#2b2d31] rounded-lg border ${
              keybind.enabled ? 'border-white/10' : 'border-white/5 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {keybind.id.includes('ptt') && <Mic className="w-5 h-5 text-green-400" />}
                {keybind.id.includes('mute') && <MicOff className="w-5 h-5 text-red-400" />}
                {keybind.id.includes('deafen') && <HeadphonesOff className="w-5 h-5 text-orange-400" />}
                <div>
                  <h3 className="font-semibold text-white">{keybind.action}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Mode: {keybind.mode === 'hold' ? 'Hold to activate' : 'Press to toggle'}
                  </p>
                </div>
              </div>
              <Switch
                checked={keybind.enabled}
                onChange={(checked) => updateKeybind(keybind.id, { enabled: checked })}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => startRecording(keybind.id)}
                disabled={!keybind.enabled}
                className={`
                  flex-1 h-10 px-4 rounded-lg font-mono text-sm transition-all
                  ${recording === keybind.id
                    ? 'bg-purple-600 text-white animate-pulse'
                    : 'bg-[#1e1f22] text-gray-300 hover:bg-white/5'
                  }
                  ${!keybind.enabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {recording === keybind.id ? 'Recording...' : formatKeybind(keybind)}
              </button>

              <select
                value={keybind.mode}
                onChange={(e) => updateKeybind(keybind.id, { mode: e.target.value as 'toggle' | 'hold' })}
                disabled={!keybind.enabled}
                className="h-10 px-3 bg-[#1e1f22] border border-white/10 rounded-lg text-white text-sm"
              >
                <option value="toggle">Toggle</option>
                <option value="hold">Hold</option>
              </select>

              {keybind.id.includes('mouse') && (
                <Mouse className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-6 border-t border-white/10">
        <Button
          variant="secondary"
          onClick={resetKeybinds}
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </Button>

        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Zap className="w-4 h-4" />
          <span>Keybinds are saved automatically</span>
        </div>
      </div>

      {/* Testing Area */}
      <div className="p-6 bg-[#1e1f22] rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Test Your Keybinds</h3>
        <p className="text-sm text-gray-400 mb-4">
          Try your keybinds here. They work globally when this window is focused.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-[#2b2d31] rounded-lg text-center">
            <Mic className={`w-8 h-8 mx-auto mb-2 ${pushToTalkActive ? 'text-green-400' : 'text-gray-500'}`} />
            <span className="text-sm text-gray-400">PTT Status</span>
          </div>
          <div className="p-4 bg-[#2b2d31] rounded-lg text-center">
            <MicOff className="w-8 h-8 mx-auto mb-2 text-gray-500" />
            <span className="text-sm text-gray-400">Mute Status</span>
          </div>
          <div className="p-4 bg-[#2b2d31] rounded-lg text-center">
            <HeadphonesOff className="w-8 h-8 mx-auto mb-2 text-gray-500" />
            <span className="text-sm text-gray-400">Deafen Status</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeybindSettings;
