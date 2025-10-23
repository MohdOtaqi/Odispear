import React, { useState } from 'react';
import { Plus, Smile } from 'lucide-react';
import { EmojiPicker } from '../ui/EmojiPicker';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface Reaction {
  emoji: string;
  count: number;
  users: Array<{
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  }>;
  hasReacted?: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  reactions: Reaction[];
  currentUserId: string;
  onReactionUpdate?: () => void;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  reactions,
  currentUserId,
  onReactionUpdate,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddReaction = async (emoji: string) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await api.post(`/reactions/${messageId}`, { emoji });
      setShowEmojiPicker(false);
      onReactionUpdate?.();
    } catch (error: any) {
      console.error('Failed to add reaction:', error);
      toast.error(error.response?.data?.error || 'Failed to add reaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveReaction = async (emoji: string) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await api.delete(`/reactions/${messageId}/${encodeURIComponent(emoji)}`);
      onReactionUpdate?.();
    } catch (error: any) {
      console.error('Failed to remove reaction:', error);
      toast.error(error.response?.data?.error || 'Failed to remove reaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactionClick = (reaction: Reaction) => {
    if (reaction.hasReacted) {
      handleRemoveReaction(reaction.emoji);
    } else {
      handleAddReaction(reaction.emoji);
    }
  };

  if (reactions.length === 0 && !showEmojiPicker) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 mt-2 flex-wrap">
      {/* Existing Reactions */}
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleReactionClick(reaction)}
          disabled={isLoading}
          className={`
            group flex items-center gap-1.5 px-2 py-1 rounded-lg
            transition-all hover-lift text-sm font-medium
            ${reaction.hasReacted 
              ? 'bg-primary-500/20 border border-primary-500/40 text-primary-400' 
              : 'bg-neutral-700/50 border border-neutral-600/50 text-neutral-300 hover:bg-neutral-700 hover:border-neutral-500'
            }
          `}
          title={reaction.users.map(u => u.display_name || u.username).join(', ')}
        >
          <span className="text-base leading-none group-hover:scale-125 transition-transform">
            {reaction.emoji}
          </span>
          <span className="text-xs font-semibold">{reaction.count}</span>
        </button>
      ))}

      {/* Add Reaction Button */}
      <div className="relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="
            flex items-center justify-center w-7 h-7 rounded-lg
            bg-neutral-700/30 hover:bg-neutral-700 border border-neutral-600/30 hover:border-neutral-500
            text-neutral-400 hover:text-primary-400
            transition-all hover-lift opacity-0 group-hover:opacity-100
          "
          title="Add reaction"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowEmojiPicker(false)}
            />
            <div className="absolute bottom-full left-0 mb-2 z-50 animate-scale-in">
              <EmojiPicker
                onSelect={(emoji) => {
                  handleAddReaction(emoji);
                  setShowEmojiPicker(false);
                }}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
