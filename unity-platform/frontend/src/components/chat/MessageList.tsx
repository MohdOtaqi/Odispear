import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Avatar } from '../ui/Avatar';
import { Tooltip } from '../ui/Tooltip';
import { formatTime } from '../../lib/utils';
import { useMessageStore } from '../../store/messageStore';
import { useAuthStore } from '../../store/authStore';
import { Reply, Trash2, Edit, Smile, MoreHorizontal, Hash } from 'lucide-react';

interface Message {
  id: string;
  author_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  content: string;
  created_at: string;
  edited_at?: string;
  attachments?: any[];
}

interface MessageListProps {
  channelId: string;
  isDM?: boolean;
  onUserClick?: (userId: string) => void;
}

// Optimized Message Item with React.memo
const MessageItem = React.memo<{
  message: Message;
  isOwn: boolean;
  isGrouped: boolean;
  onUserClick?: (userId: string) => void;
}>(({ message, isOwn, isGrouped, onUserClick }) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

  return (
    <div
      className={`group relative px-4 py-1 hover:bg-white/5 transition-colors ${
        isGrouped ? 'mt-0.5' : 'mt-4'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-3">
        {/* Avatar (only show if not grouped) */}
        <div className="w-10 flex-shrink-0">
          {!isGrouped && (
            <div 
              onClick={() => onUserClick?.(message.author_id)}
              className="cursor-pointer"
              title={`View ${message.username}'s profile`}
            >
              <Avatar
                src={message.avatar_url}
                alt={message.username}
                fallback={message.username.charAt(0)}
                size="md"
              />
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          {!isGrouped && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <span 
                onClick={() => onUserClick?.(message.author_id)}
                className="font-semibold text-white hover:underline cursor-pointer transition-colors"
                title={`View ${message.username}'s profile`}
              >
                {message.display_name || message.username}
              </span>
              <span className="text-xs text-gray-500">
                {formatTime(message.created_at)}
              </span>
              {message.edited_at && (
                <Tooltip content={`Edited ${formatTime(message.edited_at)}`}>
                  <span className="text-xs text-gray-500">(edited)</span>
                </Tooltip>
              )}
            </div>
          )}
          <div className="text-sm text-gray-200 break-words leading-relaxed">
            {message.content}
          </div>

          {/* Reactions placeholder */}
          {showReactions && (
            <div className="flex gap-1 mt-2">
              {quickReactions.map((emoji) => (
                <button
                  key={emoji}
                  className="px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded-md text-sm transition-colors"
                >
                  {emoji} 0
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="absolute -top-4 right-4 flex items-center gap-1 bg-[#1e1f22] border border-white/10 rounded-lg p-1 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip content="Add Reaction" position="top">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
              >
                <Smile className="h-4 w-4" />
              </button>
            </Tooltip>
            <Tooltip content="Reply" position="top">
              <button className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
                <Reply className="h-4 w-4" />
              </button>
            </Tooltip>
            {isOwn && (
              <>
                <Tooltip content="Edit" position="top">
                  <button className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
                    <Edit className="h-4 w-4" />
                  </button>
                </Tooltip>
                <Tooltip content="Delete" position="top">
                  <button className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Tooltip>
              </>
            )}
            <Tooltip content="More" position="top">
              <button className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

// Optimized Message List with auto-scroll
export const MessageList = React.memo<MessageListProps>(({ channelId, onUserClick }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  const messages = useMessageStore((state) => state.messages[channelId] || []);
  const currentUser = useAuthStore((state) => state.user);

  // Detect if user is at bottom of scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(atBottom);
  }, []);

  // Auto-scroll only if user is at bottom
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  // Check if messages should be grouped (same author within 5 minutes)
  const shouldGroupMessage = useCallback((currentMsg: Message, prevMsg: Message | undefined) => {
    if (!prevMsg) return false;
    if (currentMsg.author_id !== prevMsg.author_id) return false;
    
    const timeDiff = new Date(currentMsg.created_at).getTime() - new Date(prevMsg.created_at).getTime();
    return timeDiff < 5 * 60 * 1000; // 5 minutes
  }, []);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 animate-fade-in">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <Hash className="w-8 h-8 text-gray-600" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No messages yet</h3>
        <p className="text-sm">Be the first to say something!</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto custom-scrollbar"
      onScroll={handleScroll}
    >
      <div className="py-4">
        {messages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            isOwn={message.author_id === currentUser?.id}
            isGrouped={shouldGroupMessage(message, messages[index - 1])}
            onUserClick={onUserClick}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {!isAtBottom && messages.length > 0 && (
        <button
          onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="fixed bottom-24 right-8 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg transition-all hover:-translate-y-1 animate-scale-in"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  );
});

MessageList.displayName = 'MessageList';
