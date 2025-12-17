import React, { useState, useEffect } from 'react';
import { Play, Upload, Trash2, Star, StarOff, Volume2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Sound {
  id: string;
  name: string;
  url: string;
  emoji: string;
  duration: number;
  is_favorite: boolean;
  category: string;
}

interface SoundboardProps {
  guildId?: string;
  channelId?: string;
}

export const Soundboard: React.FC<SoundboardProps> = ({ guildId, channelId }) => {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  useEffect(() => {
    fetchSounds();
  }, [guildId]);

  const fetchSounds = async () => {
    setIsLoading(true);
    try {
      const params = guildId ? `?guildId=${guildId}` : '';
      const response = await axios.get(`/api/v1/soundboard/sounds${params}`);
      setSounds(response.data);
    } catch (error) {
      console.error('Failed to fetch sounds:', error);
      toast.error('Failed to load sounds');
    } finally {
      setIsLoading(false);
    }
  };

  const playSound = async (soundId: string) => {
    if (!channelId) {
      toast.error('Join a voice channel first');
      return;
    }

    try {
      await axios.post('/api/v1/soundboard/play', {
        soundId,
        channelId,
      });
      toast.success('Sound played');
    } catch (error) {
      console.error('Failed to play sound:', error);
      toast.error('Failed to play sound');
    }
  };

  const toggleFavorite = async (soundId: string) => {
    try {
      await axios.post(`/api/v1/soundboard/sounds/${soundId}/favorite`);
      fetchSounds();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('Failed to update favorite');
    }
  };

  const deleteSound = async (soundId: string) => {
    if (!confirm('Are you sure you want to delete this sound?')) return;

    try {
      await axios.delete(`/api/v1/soundboard/sounds/${soundId}`);
      toast.success('Sound deleted');
      fetchSounds();
    } catch (error) {
      console.error('Failed to delete sound:', error);
      toast.error('Failed to delete sound');
    }
  };

  const categories = ['all', 'default', 'custom', 'memes', 'effects'];
  const filteredSounds = selectedCategory === 'all' 
    ? sounds 
    : sounds.filter(s => s.category === selectedCategory);

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      {/* Header */}
      <div className="p-4 border-b border-neutral-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">Soundboard</h2>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Sounds Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-center py-8 text-neutral-400">Loading sounds...</div>
        ) : filteredSounds.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">
            No sounds available. Upload one to get started!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredSounds.map((sound) => (
              <div
                key={sound.id}
                className="bg-neutral-800 rounded-lg p-3 hover:bg-neutral-700 transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{sound.emoji}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleFavorite(sound.id)}
                      className="p-1 hover:bg-neutral-600 rounded"
                    >
                      {sound.is_favorite ? (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="w-4 h-4 text-neutral-400" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteSound(sound.id)}
                      className="p-1 hover:bg-neutral-600 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="text-sm font-medium text-white truncate">
                    {sound.name}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {sound.duration}s
                  </div>
                </div>
                <button
                  onClick={() => playSound(sound.id)}
                  className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-3 h-3" />
                  Play
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Upload Sound</h3>
            <p className="text-neutral-400 text-sm mb-4">
              Upload an audio file (MP3, WAV, OGG) up to 10MB
            </p>
            <input
              type="file"
              accept="audio/*"
              className="w-full mb-4 text-white"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setUploadModalOpen(false)}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};