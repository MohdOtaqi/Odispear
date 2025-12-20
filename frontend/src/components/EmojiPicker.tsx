import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Search, Clock, Heart, ThumbsUp, Star, Zap, Pizza, X } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = {
  recent: ['😀', '❤️', '👍', '😂', '🎉', '🔥', '⭐', '💯'],
  smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩'],
  gestures: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'],
  objects: ['🎮', '🕹️', '🎯', '🎲', '🎰', '🧩', '♟️', '🎨', '🖼️', '🎭', '🎪', '🎫', '🎟️', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🎻', '🎹', '📱', '💻', '🖥️', '⌨️', '🖱️', '🖨️', '📷', '📹', '📼', '💿', '📀', '💾', '💽', '🕰️', '⏰', '⏱️', '⏲️', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'],
  activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚴', '🚵', '🎖️', '🏆', '🥇', '🥈', '🥉'],
  food: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🥔', '🍠', '🥐', '🥖', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🍤', '🍙', '🍚', '🍘'],
  flags: ['🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇺🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇩🇪', '🇫🇷', '🇪🇸', '🇮🇹', '🇯🇵', '🇰🇷', '🇨🇳', '🇮🇳', '🇧🇷', '🇲🇽', '🇷🇺', '🇳🇱', '🇸🇪', '🇳🇴', '🇩🇰', '🇫🇮', '🇵🇱', '🇺🇦', '🇨🇿', '🇭🇺', '🇷🇴', '🇧🇬', '🇬🇷', '🇹🇷', '🇪🇬', '🇿🇦', '🇳🇬', '🇰🇪', '🇦🇷', '🇨🇱', '🇨🇴', '🇵🇪', '🇻🇪']
};

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentEmojis, setRecentEmojis] = useState<string[]>(
    JSON.parse(localStorage.getItem('recentEmojis') || '[]')
  );
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);

    const updatedRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 16);
    setRecentEmojis(updatedRecent);
    localStorage.setItem('recentEmojis', JSON.stringify(updatedRecent));
  };

  const getCategoryIcon = (category: keyof typeof EMOJI_CATEGORIES) => {
    switch (category) {
      case 'recent': return <Clock className="w-4 h-4" />;
      case 'smileys': return <Smile className="w-4 h-4" />;
      case 'gestures': return <ThumbsUp className="w-4 h-4" />;
      case 'hearts': return <Heart className="w-4 h-4" />;
      case 'objects': return <Star className="w-4 h-4" />;
      case 'activities': return <Zap className="w-4 h-4" />;
      case 'food': return <Pizza className="w-4 h-4" />;
      case 'flags': return <span className="text-sm">🏁</span>;
      default: return <Smile className="w-4 h-4" />;
    }
  };

  const filteredEmojis = searchQuery
    ? Object.values(EMOJI_CATEGORIES).flat().filter(emoji =>
      emoji.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : selectedCategory === 'recent'
      ? recentEmojis
      : EMOJI_CATEGORIES[selectedCategory];

  return (
    <motion.div
      ref={pickerRef}
      className="absolute bottom-full mb-2 right-0 w-80 h-96 bg-mot-surface-subtle/95 backdrop-blur-xl border border-mot-border rounded-2xl shadow-2xl overflow-hidden"
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Header */}
      <div className="p-3 border-b border-mot-border flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emojis..."
            className="w-full pl-10 pr-3 py-2 bg-mot-surface border border-mot-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-mot-gold/50 transition-colors"
          />
        </div>
        <motion.button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-mot-gold/10 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-4 h-4 text-gray-400" />
        </motion.button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 px-2 py-2 border-b border-mot-border overflow-x-auto">
        {Object.keys(EMOJI_CATEGORIES).map((category) => {
          const isActive = selectedCategory === category;
          return (
            <motion.button
              key={category}
              onClick={() => setSelectedCategory(category as keyof typeof EMOJI_CATEGORIES)}
              className={`relative p-2 rounded-lg transition-colors ${isActive
                  ? 'text-mot-black'
                  : 'text-gray-400 hover:text-white'
                }`}
              title={category.charAt(0).toUpperCase() + category.slice(1)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeCategoryBg"
                  className="absolute inset-0 bg-mot-gold rounded-lg"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10">
                {getCategoryIcon(category as keyof typeof EMOJI_CATEGORIES)}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Emoji Grid */}
      <div className="p-2 h-[calc(100%-7.5rem)] overflow-y-auto custom-scrollbar">
        <motion.div
          className="grid grid-cols-8 gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {filteredEmojis.map((emoji, index) => (
            <motion.button
              key={`${emoji}-${index}`}
              onClick={() => handleEmojiClick(emoji)}
              className="p-2 text-2xl hover:bg-mot-gold/10 rounded-lg"
              title={emoji}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: Math.min(index * 0.01, 0.3),
                type: "spring",
                stiffness: 500,
                damping: 25
              }}
              whileHover={{ scale: 1.3, zIndex: 10 }}
              whileTap={{ scale: 0.9 }}
            >
              {emoji}
            </motion.button>
          ))}
        </motion.div>
        <AnimatePresence>
          {filteredEmojis.length === 0 && (
            <motion.div
              className="text-center text-gray-500 py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              No emojis found
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default EmojiPicker;
