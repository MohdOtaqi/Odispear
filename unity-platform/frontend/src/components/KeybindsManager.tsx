import React, { useState, useEffect, useRef } from 'react';
import { Keyboard, Mic, MicOff, Volume2, VolumeX, Video, VideoOff, Settings, Search, Plus, Hash, Headphones, Monitor, Camera, Save, RotateCcw, Info, AlertCircle } from 'lucide-react';

interface Keybind {
  id: string;
  action: string;
  keys: string[];
  enabled: boolean;
  description: string;
  category: string;
  icon: React.ComponentType<any>;
  default: string[];
}

const DEFAULT_KEYBINDS: Keybind[] = [
  // Voice & Video
  { id: 'push_to_talk', action: 'Push to Talk', keys: ['Space'], enabled: true, description: 'Hold to transmit voice', category: 'Voice & Video', icon: Mic, default: ['Space'] },
  { id: 'push_to_mute', action: 'Push to Mute', keys: [], enabled: false, description: 'Hold to temporarily mute', category: 'Voice & Video', icon: MicOff, default: [] },
  { id: 'toggle_mute', action: 'Toggle Mute', keys: ['Ctrl', 'Shift', 'M'], enabled: true, description: 'Toggle microphone on/off', category: 'Voice & Video', icon: Mic, default: ['Ctrl', 'Shift', 'M'] },
  { id: 'toggle_deafen', action: 'Toggle Deafen', keys: ['Ctrl', 'Shift', 'D'], enabled: true, description: 'Toggle deafen on/off', category: 'Voice & Video', icon: Headphones, default: ['Ctrl', 'Shift', 'D'] },
  { id: 'toggle_video', action: 'Toggle Video', keys: ['Ctrl', 'Shift', 'V'], enabled: true, description: 'Toggle camera on/off', category: 'Voice & Video', icon: Video, default: ['Ctrl', 'Shift', 'V'] },
  { id: 'toggle_stream', action: 'Toggle Screen Share', keys: ['Ctrl', 'Shift', 'S'], enabled: true, description: 'Start/stop screen sharing', category: 'Voice & Video', icon: Monitor, default: ['Ctrl', 'Shift', 'S'] },
  
  // Navigation
  { id: 'navigate_up', action: 'Navigate Up', keys: ['Alt', 'Up'], enabled: true, description: 'Navigate to previous channel', category: 'Navigation', icon: Hash, default: ['Alt', 'Up'] },
  { id: 'navigate_down', action: 'Navigate Down', keys: ['Alt', 'Down'], enabled: true, description: 'Navigate to next channel', category: 'Navigation', icon: Hash, default: ['Alt', 'Down'] },
  { id: 'navigate_server_up', action: 'Previous Server', keys: ['Ctrl', 'Alt', 'Up'], enabled: true, description: 'Navigate to previous server', category: 'Navigation', icon: Hash, default: ['Ctrl', 'Alt', 'Up'] },
  { id: 'navigate_server_down', action: 'Next Server', keys: ['Ctrl', 'Alt', 'Down'], enabled: true, description: 'Navigate to next server', category: 'Navigation', icon: Hash, default: ['Ctrl', 'Alt', 'Down'] },
  { id: 'toggle_member_list', action: 'Toggle Member List', keys: ['Ctrl', 'U'], enabled: true, description: 'Show/hide member list', category: 'Navigation', icon: Settings, default: ['Ctrl', 'U'] },
  { id: 'quick_switcher', action: 'Quick Switcher', keys: ['Ctrl', 'K'], enabled: true, description: 'Open quick switcher', category: 'Navigation', icon: Search, default: ['Ctrl', 'K'] },
  { id: 'create_dm', action: 'Create DM', keys: ['Ctrl', 'Shift', 'N'], enabled: true, description: 'Start a new direct message', category: 'Navigation', icon: Plus, default: ['Ctrl', 'Shift', 'N'] },
  
  // Chat
  { id: 'mark_as_read', action: 'Mark as Read', keys: ['Shift', 'Esc'], enabled: true, description: 'Mark channel as read', category: 'Chat', icon: Settings, default: ['Shift', 'Esc'] },
  { id: 'mark_server_read', action: 'Mark Server as Read', keys: ['Ctrl', 'Shift', 'Esc'], enabled: true, description: 'Mark entire server as read', category: 'Chat', icon: Settings, default: ['Ctrl', 'Shift', 'Esc'] },
  { id: 'upload_file', action: 'Upload File', keys: ['Ctrl', 'Shift', 'U'], enabled: true, description: 'Open file upload dialog', category: 'Chat', icon: Plus, default: ['Ctrl', 'Shift', 'U'] },
  { id: 'search_messages', action: 'Search Messages', keys: ['Ctrl', 'F'], enabled: true, description: 'Search in current channel', category: 'Chat', icon: Search, default: ['Ctrl', 'F'] },
  { id: 'reply_last', action: 'Reply to Last Message', keys: ['Alt', 'R'], enabled: true, description: 'Reply to most recent message', category: 'Chat', icon: Settings, default: ['Alt', 'R'] },
  
  // UI
  { id: 'toggle_hotkeys', action: 'Show Hotkeys', keys: ['Ctrl', '/'], enabled: true, description: 'Display keyboard shortcuts', category: 'UI', icon: Keyboard, default: ['Ctrl', '/'] },
  { id: 'toggle_inbox', action: 'Toggle Inbox', keys: ['Ctrl', 'I'], enabled: true, description: 'Open inbox/mentions', category: 'UI', icon: Settings, default: ['Ctrl', 'I'] },
  { id: 'toggle_pins', action: 'Toggle Pins', keys: ['Ctrl', 'P'], enabled: true, description: 'Show pinned messages', category: 'UI', icon: Settings, default: ['Ctrl', 'P'] },
  { id: 'open_settings', action: 'Open Settings', keys: ['Ctrl', ','], enabled: true, description: 'Open user settings', category: 'UI', icon: Settings, default: ['Ctrl', ','] }
];

export const KeybindsManager: React.FC = () => {
  const [keybinds, setKeybinds] = useState<Keybind[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Voice & Video');
  const [recording, setRecording] = useState<string | null>(null);
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConflicts, setShowConflicts] = useState(false);
  const recordingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadKeybinds();
    return () => {
      if (recording) {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
      }
    };
  }, [recording]);

  const loadKeybinds = () => {
    const saved = localStorage.getItem('keybinds');
    if (saved) {
      setKeybinds(JSON.parse(saved));
    } else {
      setKeybinds(DEFAULT_KEYBINDS);
    }
  };

  const saveKeybinds = (newKeybinds: Keybind[]) => {
    setKeybinds(newKeybinds);
    localStorage.setItem('keybinds', JSON.stringify(newKeybinds));
    
    // Apply keybinds to the application
    applyKeybinds(newKeybinds);
  };

  const applyKeybinds = (keybindList: Keybind[]) => {
    // Create a global keybind event system
    const keybindMap = new Map<string, Keybind>();
    
    keybindList.forEach(kb => {
      if (kb.enabled && kb.keys.length > 0) {
        const keyCombo = kb.keys.join('+');
        keybindMap.set(keyCombo, kb);
      }
    });

    // Store in global window object for access throughout the app
    (window as any).__keybinds = keybindMap;
    
    // Dispatch custom event to notify app of keybind changes
    window.dispatchEvent(new CustomEvent('keybinds-updated', { detail: keybindMap }));
  };

  const startRecording = (keybindId: string) => {
    setRecording(keybindId);
    setRecordedKeys([]);
    recordingRef.current.clear();
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
  };

  const stopRecording = () => {
    if (recording) {
      const updatedKeybinds = keybinds.map(kb => 
        kb.id === recording ? { ...kb, keys: recordedKeys } : kb
      );
      saveKeybinds(updatedKeybinds);
    }
    
    setRecording(null);
    setRecordedKeys([]);
    recordingRef.current.clear();
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    e.preventDefault();
    
    const key = getKeyName(e);
    if (!recordingRef.current.has(key)) {
      recordingRef.current.add(key);
      setRecordedKeys(Array.from(recordingRef.current));
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    e.preventDefault();
    
    if (recordingRef.current.size > 0) {
      // Finished recording this combination
      setTimeout(stopRecording, 100);
    }
  };

  const getKeyName = (e: KeyboardEvent): string => {
    const specialKeys: { [key: string]: string } = {
      ' ': 'Space',
      'Control': 'Ctrl',
      'Meta': 'Cmd',
      'ArrowUp': 'Up',
      'ArrowDown': 'Down',
      'ArrowLeft': 'Left',
      'ArrowRight': 'Right',
      'Escape': 'Esc',
      'Enter': 'Enter',
      'Backspace': 'Backspace',
      'Delete': 'Delete',
      'Tab': 'Tab'
    };

    if (e.ctrlKey && e.key !== 'Control') return 'Ctrl';
    if (e.shiftKey && e.key !== 'Shift') return 'Shift';
    if (e.altKey && e.key !== 'Alt') return 'Alt';
    if (e.metaKey && e.key !== 'Meta') return 'Cmd';

    return specialKeys[e.key] || e.key.toUpperCase();
  };

  const resetKeybind = (keybindId: string) => {
    const defaultKb = DEFAULT_KEYBINDS.find(kb => kb.id === keybindId);
    if (defaultKb) {
      const updatedKeybinds = keybinds.map(kb => 
        kb.id === keybindId ? { ...kb, keys: defaultKb.default } : kb
      );
      saveKeybinds(updatedKeybinds);
    }
  };

  const toggleKeybind = (keybindId: string) => {
    const updatedKeybinds = keybinds.map(kb => 
      kb.id === keybindId ? { ...kb, enabled: !kb.enabled } : kb
    );
    saveKeybinds(updatedKeybinds);
  };

  const clearKeybind = (keybindId: string) => {
    const updatedKeybinds = keybinds.map(kb => 
      kb.id === keybindId ? { ...kb, keys: [] } : kb
    );
    saveKeybinds(updatedKeybinds);
  };

  const resetAllKeybinds = () => {
    if (window.confirm('Are you sure you want to reset all keybinds to default?')) {
      saveKeybinds(DEFAULT_KEYBINDS);
    }
  };

  const findConflicts = (): Map<string, Keybind[]> => {
    const conflicts = new Map<string, Keybind[]>();
    
    keybinds.forEach(kb => {
      if (kb.keys.length > 0 && kb.enabled) {
        const keyCombo = kb.keys.join('+');
        if (!conflicts.has(keyCombo)) {
          conflicts.set(keyCombo, []);
        }
        conflicts.get(keyCombo)!.push(kb);
      }
    });

    // Remove non-conflicts
    conflicts.forEach((kbs, key) => {
      if (kbs.length <= 1) {
        conflicts.delete(key);
      }
    });

    return conflicts;
  };

  const categories = Array.from(new Set(keybinds.map(kb => kb.category)));
  const conflicts = findConflicts();
  
  const filteredKeybinds = keybinds.filter(kb => {
    const matchesCategory = kb.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      kb.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kb.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-full bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-800 p-4">
        <h2 className="text-xl font-bold text-white mb-4">Keybinds</h2>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keybinds..."
            className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Categories */}
        <div className="space-y-1">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 pt-6 border-t border-gray-800">
          <button
            onClick={resetAllKeybinds}
            className="w-full px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset All
          </button>
          
          {conflicts.size > 0 && (
            <button
              onClick={() => setShowConflicts(!showConflicts)}
              className="w-full mt-2 px-3 py-2 bg-yellow-900/20 text-yellow-400 rounded-lg hover:bg-yellow-900/30 transition-colors flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              {conflicts.size} Conflicts
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white">{selectedCategory}</h3>
              <p className="text-gray-400 text-sm mt-1">Configure keyboard shortcuts for {selectedCategory.toLowerCase()}</p>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Info className="w-4 h-4" />
              <span className="text-sm">Click on a keybind to record new keys</span>
            </div>
          </div>

          {/* Conflicts Warning */}
          {showConflicts && conflicts.size > 0 && (
            <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
              <h4 className="text-yellow-400 font-semibold mb-2">Keybind Conflicts Detected</h4>
              {Array.from(conflicts.entries()).map(([keys, kbs]) => (
                <div key={keys} className="text-sm text-yellow-300">
                  <span className="font-mono">{keys}</span> is used by: {kbs.map(kb => kb.action).join(', ')}
                </div>
              ))}
            </div>
          )}

          {/* Keybinds List */}
          <div className="space-y-3">
            {filteredKeybinds.map(keybind => {
              const Icon = keybind.icon;
              const isRecording = recording === keybind.id;
              const hasConflict = keybind.keys.length > 0 && conflicts.has(keybind.keys.join('+'));

              return (
                <div
                  key={keybind.id}
                  className={`p-4 bg-gray-800 rounded-lg border ${
                    isRecording ? 'border-purple-500' : 
                    hasConflict ? 'border-yellow-600' : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-medium">{keybind.action}</h4>
                          <input
                            type="checkbox"
                            checked={keybind.enabled}
                            onChange={() => toggleKeybind(keybind.id)}
                            className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                          />
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{keybind.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => isRecording ? stopRecording() : startRecording(keybind.id)}
                        className={`px-4 py-2 rounded-lg font-mono text-sm transition-colors ${
                          isRecording
                            ? 'bg-purple-600 text-white animate-pulse'
                            : keybind.keys.length > 0
                              ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                              : 'bg-gray-700 text-gray-500 hover:bg-gray-600'
                        }`}
                      >
                        {isRecording ? recordedKeys.join(' + ') || 'Press keys...' : 
                         keybind.keys.length > 0 ? keybind.keys.join(' + ') : 'Not set'}
                      </button>

                      {keybind.keys.length > 0 && !isRecording && (
                        <>
                          <button
                            onClick={() => clearKeybind(keybind.id)}
                            className="p-2 bg-gray-700 text-gray-400 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
                            title="Clear"
                          >
                            ×
                          </button>
                          {keybind.default.length > 0 && JSON.stringify(keybind.keys) !== JSON.stringify(keybind.default) && (
                            <button
                              onClick={() => resetKeybind(keybind.id)}
                              className="p-2 bg-gray-700 text-gray-400 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
                              title="Reset to default"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeybindsManager;
