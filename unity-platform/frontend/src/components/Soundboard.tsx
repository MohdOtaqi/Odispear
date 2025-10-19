import React, { useState, useEffect } from 'react';
import { Volume2, Upload, Play, Pause, Trash2, Settings, Download, Search, Star } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

interface Sound {
  id: string;
  name: string;
  url: string;
  emoji: string;
  duration: number;
  userId: string;
  guildId?: string;
  volume: number;
  favorite: boolean;
  category: string;
}

interface SoundCategory {
  id: string;
  name: string;
  icon: string;
  sounds: Sound[];
}

export const Soundboard: React.FC = () => {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [categories, setCategories] = useState<SoundCategory[]>([
    { id: 'favorites', name: 'Favorites', icon: '⭐', sounds: [] },
    { id: 'memes', name: 'Memes', icon: '😂', sounds: [] },
    { id: 'effects', name: 'Sound Effects', icon: '🎵', sounds: [] },
    { id: 'custom', name: 'Custom', icon: '🎤', sounds: [] }
  ]);
  const [selectedCategory, setSelectedCategory] = useState('favorites');
  const [searchQuery, setSearchQuery] = useState('');
  const [globalVolume, setGlobalVolume] = useState(50);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadEmoji, setUploadEmoji] = useState('🔊');
  const { user } = useAuthStore();

  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadSounds();
  }, []);

  const loadSounds = async () => {
    try {
      const response = await fetch('/api/v1/soundboard/sounds', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSounds(data.sounds);
        organizeSoundsByCategory(data.sounds);
      }
    } catch (error) {
      console.error('Failed to load sounds:', error);
    }
  };

  const organizeSoundsByCategory = (soundList: Sound[]) => {
    const organized = categories.map(cat => ({
      ...cat,
      sounds: soundList.filter(s => 
        cat.id === 'favorites' ? s.favorite : s.category === cat.id
      )
    }));
    setCategories(organized);
  };

  const playSound = async (sound: Sound) => {
    if (playingSound === sound.id) {
      audioRef.current?.pause();
      setPlayingSound(null);
      return;
    }

    try {
      if (audioRef.current) {
        audioRef.current.src = sound.url;
        audioRef.current.volume = (sound.volume * globalVolume) / 10000;
        await audioRef.current.play();
        setPlayingSound(sound.id);

        // Broadcast to voice channel if connected
        if (window.voiceConnection) {
          window.voiceConnection.playSound(sound.url, sound.volume);
        }

        audioRef.current.onended = () => setPlayingSound(null);
      }
    } catch (error) {
      toast.error('Failed to play sound');
    }
  };

  const toggleFavorite = async (soundId: string) => {
    try {
      const response = await fetch(`/api/v1/soundboard/sounds/${soundId}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (response.ok) {
        const updatedSounds = sounds.map(s => 
          s.id === soundId ? { ...s, favorite: !s.favorite } : s
        );
        setSounds(updatedSounds);
        organizeSoundsByCategory(updatedSounds);
        toast.success('Updated favorites');
      }
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  const deleteSound = async (soundId: string) => {
    if (!confirm('Delete this sound?')) return;

    try {
      const response = await fetch(`/api/v1/soundboard/sounds/${soundId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (response.ok) {
        const updatedSounds = sounds.filter(s => s.id !== soundId);
        setSounds(updatedSounds);
        organizeSoundsByCategory(updatedSounds);
        toast.success('Sound deleted');
      }
    } catch (error) {
      toast.error('Failed to delete sound');
    }
  };

  const uploadSound = async () => {
    if (!uploadFile || !uploadName) {
      toast.error('Please provide a name and file');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('name', uploadName);
    formData.append('emoji', uploadEmoji);
    formData.append('category', selectedCategory);

    try {
      const response = await fetch('/api/v1/soundboard/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      if (response.ok) {
        const newSound = await response.json();
        setSounds([...sounds, newSound]);
        organizeSoundsByCategory([...sounds, newSound]);
        setShowUpload(false);
        setUploadFile(null);
        setUploadName('');
        toast.success('Sound uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to upload sound');
    }
  };

  const filteredSounds = categories
    .find(c => c.id === selectedCategory)
    ?.sounds.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-lg p-4">
      <audio ref={audioRef} />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Volume2 className="w-6 h-6 text-purple-400" />
          Soundboard
        </h2>
        <button
          onClick={() => setShowUpload(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 transition-all"
        >
          <Upload className="w-4 h-4" />
          Upload Sound
        </button>
      </div>

      {/* Search and Volume */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search sounds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/30 border border-purple-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-lg border border-purple-500/20">
          <Volume2 className="w-4 h-4 text-purple-400" />
          <input
            type="range"
            min="0"
            max="100"
            value={globalVolume}
            onChange={(e) => setGlobalVolume(parseInt(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-gray-300">{globalVolume}%</span>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-purple-600 text-white'
                : 'bg-black/30 text-gray-300 hover:bg-black/50'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
            <span className="text-xs bg-black/30 px-2 py-0.5 rounded-full">
              {cat.sounds.length}
            </span>
          </button>
        ))}
      </div>

      {/* Sounds Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-4 gap-3">
          {filteredSounds.map(sound => (
            <div
              key={sound.id}
              className="group relative bg-gradient-to-br from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 rounded-lg p-4 backdrop-blur-sm border border-purple-500/20 hover:border-purple-500/40 transition-all"
            >
              <button
                onClick={() => playSound(sound)}
                className="w-full flex flex-col items-center gap-2"
              >
                <div className="text-3xl mb-1">{sound.emoji}</div>
                <div className="text-sm font-medium text-white truncate w-full text-center">
                  {sound.name}
                </div>
                <div className="text-xs text-gray-400">
                  {Math.round(sound.duration)}s
                </div>
                {playingSound === sound.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-purple-600/20 rounded-lg">
                    <div className="animate-pulse text-purple-400">
                      <Pause className="w-8 h-8" />
                    </div>
                  </div>
                )}
              </button>

              {/* Actions */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(sound.id);
                  }}
                  className={`p-1 rounded hover:bg-black/30 ${
                    sound.favorite ? 'text-yellow-400' : 'text-gray-400'
                  }`}
                >
                  <Star className="w-3 h-3" fill={sound.favorite ? 'currentColor' : 'none'} />
                </button>
                {sound.userId === user?.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSound(sound.id);
                    }}
                    className="p-1 rounded hover:bg-black/30 text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-xl font-bold mb-4">Upload Sound</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="w-full px-3 py-2 bg-black/30 border border-purple-500/20 rounded-lg text-white"
                  placeholder="Sound name..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Emoji</label>
                <input
                  type="text"
                  value={uploadEmoji}
                  onChange={(e) => setUploadEmoji(e.target.value)}
                  className="w-full px-3 py-2 bg-black/30 border border-purple-500/20 rounded-lg text-white text-center text-2xl"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">File</label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 bg-black/30 border border-purple-500/20 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowUpload(false);
                  setUploadFile(null);
                  setUploadName('');
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={uploadSound}
                disabled={!uploadFile || !uploadName}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
