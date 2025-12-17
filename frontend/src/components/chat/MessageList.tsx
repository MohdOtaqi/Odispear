import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Avatar } from '../ui/Avatar';
import { Tooltip } from '../ui/Tooltip';
import { formatTime, formatMessageDate, isSameDay } from '../../lib/utils';
import { useMessageStore } from '../../store/messageStore';
import { useDMStore } from '../../store/dmStore';
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
}

// Optimized Message Item with React.memo
const MessageItem = React.memo<{
  message: Message;
  isOwn: boolean;
  isGrouped: boolean;
}>(({ message, isOwn, isGrouped }) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

  return (
    <div
      className={`group relative px-4 py-1 hover:bg-mot-gold/5 transition-colors ${
        isGrouped ? 'mt-0.5' : 'mt-4'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-3">
        {/* Avatar (only show if not grouped) */}
        <div className="w-10 flex-shrink-0">
          {!isGrouped && (
            <Avatar
              src={message.avatar_url}
              alt={message.username}
              fallback={message.username.charAt(0)}
              size="md"
            />
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          {!isGrouped && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="font-semibold text-white hover:underline cursor-pointer">
                {message.display_name || message.username}
              </span>
              <Tooltip content={new Date(message.created_at).toLocaleString()} position="top">
                <span className="text-xs text-gray-500 hover:text-gray-400 cursor-default">
                  {formatTime(message.created_at)}
                </span>
              </Tooltip>
              {message.edited_at && (
                <Tooltip content={`Edited at ${new Date(message.edited_at).toLocaleString()}`}>
                  <span className="text-xs text-gray-500">(edited)</span>
                </Tooltip>
              )}
            </div>
          )}
          <div className="text-sm text-gray-200 break-words leading-relaxed group/content relative">
            {message.content}
            {isGrouped && (
              <Tooltip content={new Date(message.created_at).toLocaleString()} position="top">
                <span className="ml-2 text-xs text-gray-600 opacity-0 group-hover/content:opacity-100 transition-opacity cursor-default">
                  {formatTime(message.created_at)}
                </span>
              </Tooltip>
            )}
          </div>

          {/* Reactions placeholder */}
          {showReactions && (
            <div className="flex gap-1 mt-2">
              {quickReactions.map((emoji) => (
                <button
                  key={emoji}
                  className="px-2 py-0.5 bg-mot-surface hover:bg-mot-gold/20 rounded-md text-sm transition-colors"
                >
                  {emoji} 0
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="absolute -top-4 right-4 flex items-center gap-1 bg-mot-surface border border-mot-border rounded-lg p-1 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip content="Add Reaction" position="top">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="p-1.5 hover:bg-mot-gold/10 rounded text-gray-400 hover:text-mot-gold transition-colors"
              >
                <Smile className="h-4 w-4" />
              </button>
            </Tooltip>
            <Tooltip content="Reply" position="top">
              <button className="p-1.5 hover:bg-mot-gold/10 rounded text-gray-400 hover:text-mot-gold transition-colors">
                <Reply className="h-4 w-4" />
              </button>
            </Tooltip>
            {isOwn && (
              <>
                <Tooltip content="Edit" position="top">
                  <button className="p-1.5 hover:bg-mot-gold/10 rounded text-gray-400 hover:text-mot-gold transition-colors">
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
              <button className="p-1.5 hover:bg-mot-gold/10 rounded text-gray-400 hover:text-mot-gold transition-colors">
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
export const MessageList = React.memo<MessageListProps>(({ channelId, isDM = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  const channelMessages = useMessageStore((state) => state.messages[channelId] || []);
  const dmMessages = useDMStore((state) => state.messages[channelId] || []);
  const messages: Message[] = isDM ? (dmMessages as any) : channelMessages;
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
        <div className="w-16 h-16 bg-mot-gold/10 rounded-full flex items-center justify-center mb-4">
          <Hash className="w-8 h-8 text-mot-gold" />
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
        {messages.map((message, index) => {
          const prevMessage = messages[index - 1];
          const showDateSeparator = !prevMessage || !isSameDay(message.created_at, prevMessage.created_at);
          
          return (
            <React.Fragment key={message.id}>
              {showDateSeparator && (
                <div className="flex items-center justify-center my-4 px-4">
                  <div className="flex-1 h-px bg-gray-700"></div>
                  <div className="px-4 text-xs text-gray-400 font-semibold">
                    {formatMessageDate(message.created_at)}
                  </div>
                  <div className="flex-1 h-px bg-gray-700"></div>
                </div>
              )}
              <MessageItem
                message={message}
                isOwn={message.author_id === currentUser?.id}
                isGrouped={shouldGroupMessage(message, prevMessage)}
              />
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {!isAtBottom && messages.length > 0 && (
        <button
          onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="fixed bottom-24 right-8 bg-mot-gold hover:bg-mot-gold-light text-mot-black rounded-full p-3 shadow-gold-glow-sm transition-all hover:-translate-y-1 animate-scale-in"
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
