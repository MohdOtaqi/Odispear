import React, { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, Clock, Heart, Laugh, Star, X, Image, Sticker, Gift, Sparkles } from 'lucide-react';
import api from '../lib/api';

interface GIF {
  id: string;
  url: string;
  preview_url: string;
  title: string;
  width: number;
  height: number;
}

interface Sticker {
  id: string;
  name: string;
  url: string;
  pack_id: string;
  pack_name: string;
  tags: string[];
}

interface GifStickerPickerProps {
  onSelect: (item: { type: 'gif' | 'sticker'; url: string; name?: string }) => void;
  onClose: () => void;
}

export const GifStickerPicker: React.FC<GifStickerPickerProps> = ({ onSelect, onClose }) => {
  const [activeTab, setActiveTab] = useState<'gif' | 'sticker'>('gif');
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<GIF[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [trending, setTrending] = useState<GIF[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentGifs, setRecentGifs] = useState<GIF[]>([]);
  const [recentStickers, setRecentStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string>('trending');
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const pickerRef = useRef<HTMLDivElement>(null);

  const GIF_CATEGORIES = [
    { id: 'trending', name: 'Trending', icon: TrendingUp },
    { id: 'recent', name: 'Recent', icon: Clock },
    { id: 'favorite', name: 'Favorites', icon: Heart },
    { id: 'happy', name: 'Happy', icon: Laugh },
    { id: 'sad', name: 'Sad', icon: Heart },
    { id: 'angry', name: 'Angry', icon: Star },
    { id: 'love', name: 'Love', icon: Heart },
    { id: 'party', name: 'Party', icon: Sparkles }
  ];

  const STICKER_PACKS = [
    { id: 'wumpus', name: 'Wumpus', preview: '🎮' },
    { id: 'anime', name: 'Anime', preview: '✨' },
    { id: 'gaming', name: 'Gaming', preview: '🎯' },
    { id: 'memes', name: 'Memes', preview: '😂' }
  ];

  useEffect(() => {
    loadFavorites();
    loadRecent();
    if (activeTab === 'gif') {
      fetchTrending();
    } else {
      fetchStickers();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (searchQuery) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        if (activeTab === 'gif') {
          searchGifs(searchQuery);
        } else {
          searchStickers(searchQuery);
        }
      }, 300);
    } else {
      if (activeTab === 'gif') {
        fetchTrending();
      }
    }
  }, [searchQuery, activeTab]);

  const loadFavorites = () => {
    const saved = localStorage.getItem('gif_favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  };

  const loadRecent = () => {
    const recentGifsData = localStorage.getItem('recent_gifs');
    const recentStickersData = localStorage.getItem('recent_stickers');
    
    if (recentGifsData) {
      setRecentGifs(JSON.parse(recentGifsData));
    }
    if (recentStickersData) {
      setRecentStickers(JSON.parse(recentStickersData));
    }
  };

  const fetchTrending = async () => {
    setLoading(true);
    try {
      // Would normally fetch from Giphy/Tenor API
      const mockGifs: GIF[] = [
        { id: '1', url: 'https://media.giphy.com/media/26tPoyDhjiJ2g7rEs/giphy.gif', preview_url: 'https://media.giphy.com/media/26tPoyDhjiJ2g7rEs/200w.gif', title: 'Happy Dance', width: 480, height: 270 },
        { id: '2', url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', preview_url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/200w.gif', title: 'Thumbs Up', width: 480, height: 360 },
        { id: '3', url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', preview_url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/200w.gif', title: 'Laughing', width: 480, height: 270 },
        { id: '4', url: 'https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif', preview_url: 'https://media.giphy.com/media/l0HlvtIPzPdt2usKs/200w.gif', title: 'Mind Blown', width: 480, height: 270 },
        { id: '5', url: 'https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif', preview_url: 'https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/200w.gif', title: 'Celebration', width: 480, height: 270 },
        { id: '6', url: 'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif', preview_url: 'https://media.giphy.com/media/l3q2K5jinAlChoCLS/200w.gif', title: 'Shocked', width: 480, height: 270 }
      ];
      setTrending(mockGifs);
      setGifs(mockGifs);
    } catch (error) {
      console.error('Failed to fetch trending GIFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchGifs = async (query: string) => {
    setLoading(true);
    try {
      // Would normally search Giphy/Tenor API
      const mockResults: GIF[] = [
        { id: '7', url: `https://media.giphy.com/media/search-${query}/giphy.gif`, preview_url: `https://media.giphy.com/media/search-${query}/200w.gif`, title: query, width: 480, height: 270 }
      ];
      setGifs(mockResults);
    } catch (error) {
      console.error('Failed to search GIFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStickers = async () => {
    setLoading(true);
    try {
      const mockStickers: Sticker[] = [
        { id: 's1', name: 'Wumpus Wave', url: 'https://cdn.discordapp.com/stickers/wumpus-wave.png', pack_id: 'wumpus', pack_name: 'Wumpus', tags: ['wave', 'hello'] },
        { id: 's2', name: 'Wumpus Love', url: 'https://cdn.discordapp.com/stickers/wumpus-love.png', pack_id: 'wumpus', pack_name: 'Wumpus', tags: ['love', 'heart'] },
        { id: 's3', name: 'Wumpus Sad', url: 'https://cdn.discordapp.com/stickers/wumpus-sad.png', pack_id: 'wumpus', pack_name: 'Wumpus', tags: ['sad', 'cry'] },
        { id: 's4', name: 'Wumpus Party', url: 'https://cdn.discordapp.com/stickers/wumpus-party.png', pack_id: 'wumpus', pack_name: 'Wumpus', tags: ['party', 'celebrate'] }
      ];
      setStickers(mockStickers);
    } catch (error) {
      console.error('Failed to fetch stickers:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchStickers = async (query: string) => {
    const filtered = stickers.filter(s => 
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    setStickers(filtered);
  };

  const handleGifSelect = (gif: GIF) => {
    onSelect({ type: 'gif', url: gif.url });
    
    // Add to recent
    const recent = [gif, ...recentGifs.filter(g => g.id !== gif.id)].slice(0, 20);
    setRecentGifs(recent);
    localStorage.setItem('recent_gifs', JSON.stringify(recent));
    
    onClose();
  };

  const handleStickerSelect = (sticker: Sticker) => {
    onSelect({ type: 'sticker', url: sticker.url, name: sticker.name });
    
    // Add to recent
    const recent = [sticker, ...recentStickers.filter(s => s.id !== sticker.id)].slice(0, 20);
    setRecentStickers(recent);
    localStorage.setItem('recent_stickers', JSON.stringify(recent));
    
    onClose();
  };

  const toggleFavorite = (gifId: string) => {
    const newFavorites = favorites.includes(gifId)
      ? favorites.filter(id => id !== gifId)
      : [...favorites, gifId];
    
    setFavorites(newFavorites);
    localStorage.setItem('gif_favorites', JSON.stringify(newFavorites));
  };

  const getDisplayItems = () => {
    if (activeTab === 'gif') {
      if (category === 'recent') return recentGifs;
      if (category === 'favorite') return gifs.filter(g => favorites.includes(g.id));
      if (searchQuery) return gifs;
      return trending;
    }
    return stickers;
  };

  return (
    <div ref={pickerRef} className="absolute bottom-full mb-2 left-0 w-96 h-[500px] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col animate-slide-up">
      {/* Header */}
      <div className="p-3 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('gif')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'gif'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                GIFs
              </div>
            </button>
            <button
              onClick={() => setActiveTab('sticker')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'sticker'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sticker className="w-4 h-4" />
                Stickers
              </div>
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab === 'gif' ? 'GIFs' : 'stickers'}...`}
            className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Categories/Packs */}
      {activeTab === 'gif' && !searchQuery && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800 overflow-x-auto">
          {GIF_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  category === cat.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span className="text-xs font-medium">{cat.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {activeTab === 'sticker' && !searchQuery && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800 overflow-x-auto">
          {STICKER_PACKS.map(pack => (
            <button
              key={pack.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <span className="text-lg">{pack.preview}</span>
              <span className="text-xs font-medium">{pack.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : activeTab === 'gif' ? (
          <div className="grid grid-cols-2 gap-2">
            {getDisplayItems().map((gif: any) => (
              <div
                key={gif.id}
                className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-800 hover:ring-2 hover:ring-purple-500 transition-all"
                onClick={() => handleGifSelect(gif)}
              >
                <img
                  src={gif.preview_url}
                  alt={gif.title}
                  className="w-full h-32 object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(gif.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      favorites.includes(gif.id) ? 'fill-red-500 text-red-500' : 'text-white'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {stickers.map(sticker => (
              <button
                key={sticker.id}
                onClick={() => handleStickerSelect(sticker)}
                className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors group"
              >
                <div className="w-20 h-20 mx-auto mb-2 bg-gray-700 rounded-lg flex items-center justify-center">
                  <Sticker className="w-10 h-10 text-gray-500" />
                </div>
                <div className="text-xs text-gray-400 truncate">{sticker.name}</div>
              </button>
            ))}
          </div>
        )}

        {!loading && getDisplayItems().length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Gift className="w-12 h-12 mb-3" />
            <p className="text-sm">No {activeTab === 'gif' ? 'GIFs' : 'stickers'} found</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-800 text-center">
        <span className="text-xs text-gray-500">
          {activeTab === 'gif' ? 'Powered by GIPHY' : `${stickers.length} stickers available`}
        </span>
      </div>
    </div>
  );
};

export default GifStickerPicker;
