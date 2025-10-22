import React, { useState, useEffect } from 'react';
import { Keyboard, Mouse, Mic, MicOff, Volume2, VolumeX, Trash2, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface Keybind {
  id: string;
  action: string;
  key: string;
  mouseButton?: number;
  modifiers: string[];
}

const DEFAULT_KEYBINDS: Keybind[] = [
  { id: '1', action: 'Push to Talk', key: 'V', mouseButton: undefined, modifiers: [] },
  { id: '2', action: 'Toggle Mute', key: 'M', mouseButton: undefined, modifiers: ['ctrl'] },
  { id: '3', action: 'Toggle Deafen', key: 'D', mouseButton: undefined, modifiers: ['ctrl'] },
  { id: '4', action: 'Toggle Voice Mode', key: 'T', mouseButton: undefined, modifiers: ['ctrl'] },
];

const MOUSE_BUTTON_NAMES: Record<number, string> = {
  0: 'Left Click',
  1: 'Middle Click',
  2: 'Right Click',
  3: 'Mouse Button 4',
  4: 'Mouse Button 5',
  5: 'Mouse Button 6',
  6: 'Mouse Button 7',
  7: 'Mouse Button 8',
};

const AVAILABLE_ACTIONS = [
  { id: 'push_to_talk', name: 'Push to Talk', icon: Mic },
  { id: 'toggle_mute', name: 'Toggle Mute', icon: MicOff },
  { id: 'toggle_deafen', name: 'Toggle Deafen', icon: VolumeX },
  { id: 'toggle_voice_mode', name: 'Toggle Voice Mode', icon: Volume2 },
  { id: 'unmute', name: 'Unmute', icon: Mic },
  { id: 'undeafen', name: 'Undeafen', icon: Volume2 },
  { id: 'mute', name: 'Mute', icon: MicOff },
  { id: 'deafen', name: 'Deafen', icon: VolumeX },
];

export const KeybindsSettings: React.FC = () => {
  const [keybinds, setKeybinds] = useState<Keybind[]>([]);
  const [recording, setRecording] = useState<string | null>(null);
  const [tempKey, setTempKey] = useState<string>('');
  const [tempModifiers, setTempModifiers] = useState<string[]>([]);
  const [tempMouseButton, setTempMouseButton] = useState<number | undefined>(undefined);

  useEffect(() => {
    // Load keybinds from localStorage
    const saved = localStorage.getItem('keybinds');
    if (saved) {
      try {
        setKeybinds(JSON.parse(saved));
      } catch (e) {
        setKeybinds(DEFAULT_KEYBINDS);
      }
    } else {
      setKeybinds(DEFAULT_KEYBINDS);
    }
  }, []);

  useEffect(() => {
    // Save keybinds to localStorage
    if (keybinds.length > 0) {
      localStorage.setItem('keybinds', JSON.stringify(keybinds));
    }
  }, [keybinds]);

  const handleKeyDown = (e: KeyboardEvent, bindId: string) => {
    if (!recording || recording !== bindId) return;

    e.preventDefault();
    e.stopPropagation();

    const modifiers: string[] = [];
    if (e.ctrlKey) modifiers.push('ctrl');
    if (e.shiftKey) modifiers.push('shift');
    if (e.altKey) modifiers.push('alt');
    if (e.metaKey) modifiers.push('meta');

    const key = e.key.toUpperCase();
    
    // Ignore modifier keys alone
    if (['CONTROL', 'SHIFT', 'ALT', 'META'].includes(key)) return;

    setTempKey(key);
    setTempModifiers(modifiers);
  };

  const handleMouseDown = (e: MouseEvent, bindId: string) => {
    if (!recording || recording !== bindId) return;
    if (e.button < 3) return; // Ignore left, middle, right clicks for now

    e.preventDefault();
    e.stopPropagation();

    setTempMouseButton(e.button);
    setTempKey('');
    setTempModifiers([]);
  };

  const startRecording = (bindId: string) => {
    setRecording(bindId);
    setTempKey('');
    setTempModifiers([]);
    setTempMouseButton(undefined);

    const keyHandler = (e: KeyboardEvent) => handleKeyDown(e, bindId);
    const mouseHandler = (e: MouseEvent) => handleMouseDown(e, bindId);

    window.addEventListener('keydown', keyHandler);
    window.addEventListener('mousedown', mouseHandler);

    // Auto-save after 5 seconds
    setTimeout(() => {
      window.removeEventListener('keydown', keyHandler);
      window.removeEventListener('mousedown', mouseHandler);
      
      if (recording === bindId) {
        saveKeybind(bindId);
      }
    }, 5000);
  };

  const saveKeybind = (bindId: string) => {
    if (tempKey || tempMouseButton !== undefined) {
      setKeybinds(prev => prev.map(kb => 
        kb.id === bindId 
          ? { ...kb, key: tempKey, modifiers: tempModifiers, mouseButton: tempMouseButton }
          : kb
      ));
      toast.success('Keybind saved!');
    }
    
    setRecording(null);
    setTempKey('');
    setTempModifiers([]);
    setTempMouseButton(undefined);
  };

  const deleteKeybind = (bindId: string) => {
    setKeybinds(prev => prev.filter(kb => kb.id !== bindId));
    toast.success('Keybind removed');
  };

  const addKeybind = () => {
    const newBind: Keybind = {
      id: Date.now().toString(),
      action: 'New Action',
      key: '',
      mouseButton: undefined,
      modifiers: [],
    };
    setKeybinds(prev => [...prev, newBind]);
  };

  const resetToDefaults = () => {
    setKeybinds(DEFAULT_KEYBINDS);
    localStorage.setItem('keybinds', JSON.stringify(DEFAULT_KEYBINDS));
    toast.success('Reset to defaults');
  };

  const formatBinding = (kb: Keybind) => {
    if (kb.mouseButton !== undefined) {
      const mods = kb.modifiers.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' + ');
      const mouse = MOUSE_BUTTON_NAMES[kb.mouseButton] || `Mouse ${kb.mouseButton}`;
      return mods ? `${mods} + ${mouse}` : mouse;
    }
    
    if (kb.key) {
      const mods = kb.modifiers.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' + ');
      return mods ? `${mods} + ${kb.key}` : kb.key;
    }
    
    return 'Not set';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Keybinds & Mouse Buttons</h3>
          <p className="text-sm text-gray-400">
            Configure keyboard shortcuts and mouse button controls for voice chat
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={resetToDefaults}>
          Reset to Defaults
        </Button>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-blue-400 flex items-start gap-2">
          <Mouse className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Click "Record" and press any key combination or mouse button (4+) to set a keybind.
            Mouse buttons 4-8 are supported for advanced mice.
          </span>
        </p>
      </div>

      {/* Keybinds List */}
      <div className="space-y-3">
        {keybinds.map((kb) => {
          const actionData = AVAILABLE_ACTIONS.find(a => a.name === kb.action);
          const Icon = actionData?.icon || Keyboard;
          const isRecording = recording === kb.id;
          const currentBinding = isRecording
            ? tempMouseButton !== undefined
              ? MOUSE_BUTTON_NAMES[tempMouseButton] || `Mouse ${tempMouseButton}`
              : tempKey
              ? `${tempModifiers.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' + ')}${tempModifiers.length > 0 ? ' + ' : ''}${tempKey}`
              : 'Waiting...'
            : formatBinding(kb);

          return (
            <div
              key={kb.id}
              className={`p-4 rounded-lg border transition-all ${
                isRecording
                  ? 'bg-purple-500/20 border-purple-500/50 shadow-lg'
                  : 'bg-[#2b2d31] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <Icon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={kb.action}
                      onChange={(e) => {
                        setKeybinds(prev =>
                          prev.map(k => k.id === kb.id ? { ...k, action: e.target.value } : k)
                        );
                      }}
                      className="w-full bg-transparent text-white font-medium focus:outline-none"
                      placeholder="Action name"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`px-4 py-2 rounded-lg font-mono text-sm ${
                    isRecording 
                      ? 'bg-purple-500/30 text-purple-300 animate-pulse' 
                      : 'bg-[#1e1f22] text-gray-300'
                  }`}>
                    {currentBinding}
                  </div>

                  {isRecording ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => saveKeybind(kb.id)}
                    >
                      Save
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => startRecording(kb.id)}
                      >
                        Record
                      </Button>
                      <button
                        onClick={() => deleteKeybind(kb.id)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Remove keybind"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Keybind */}
      <Button
        variant="secondary"
        size="md"
        onClick={addKeybind}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add New Keybind
      </Button>

      {/* Tips */}
      <div className="p-4 bg-gray-800/50 border border-white/10 rounded-lg">
        <h4 className="text-sm font-semibold text-white mb-2">Tips:</h4>
        <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
          <li>Use Ctrl, Shift, Alt, or Meta keys as modifiers</li>
          <li>Mouse buttons 4+ are typically side buttons on gaming mice</li>
          <li>Push to Talk requires holding the key/button down</li>
          <li>Toggle actions switch state with a single press</li>
        </ul>
      </div>
    </div>
  );
};
