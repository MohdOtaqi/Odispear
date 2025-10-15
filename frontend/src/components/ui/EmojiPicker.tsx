import React, { useState } from 'react';
import { Search } from 'lucide-react';

const emojiCategories = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳'],
  'Gestures': ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  'Objects': ['🎮', '🎯', '🎲', '🎰', '🎳', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐'],
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export const EmojiPicker = React.memo<EmojiPickerProps>(({ onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Smileys');

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  return (
    <div className="absolute bottom-full right-0 mb-2 w-80 bg-[#313338] rounded-xl shadow-2xl border border-white/10 overflow-hidden animate-scale-in">
      {/* Search */}
      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emoji..."
            className="w-full pl-10 pr-3 py-2 bg-[#1e1f22] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 px-3 py-2 border-b border-white/10 overflow-x-auto custom-scrollbar">
        {Object.keys(emojiCategories).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === category
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="p-3 h-64 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-8 gap-2">
          {emojiCategories[activeCategory as keyof typeof emojiCategories].map((emoji, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(emoji)}
              className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-white/10 rounded-lg transition-colors"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

EmojiPicker.displayName = 'EmojiPicker';
