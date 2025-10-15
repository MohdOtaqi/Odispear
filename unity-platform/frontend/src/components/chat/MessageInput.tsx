import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Plus, Smile, Gift } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { useMessageStore } from '../../store/messageStore';
import { socketManager } from '../../lib/socket';
import { useDebounce } from '../../hooks/usePerformance';

interface MessageInputProps {
  channelId: string;
}

export const MessageInput = React.memo<MessageInputProps>(({ channelId }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  
  const sendMessage = useMessageStore((state) => state.sendMessage);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 200); // Max 200px
    textarea.style.height = `${newHeight}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  // Debounced typing indicator
  const debouncedMessage = useDebounce(message, 300);

  useEffect(() => {
    if (debouncedMessage && !isTyping) {
      setIsTyping(true);
      socketManager.startTyping(channelId);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketManager.stopTyping(channelId);
    }, 3000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [debouncedMessage, channelId, isTyping]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(channelId, message.trim());
      setMessage('');
      setIsTyping(false);
      socketManager.stopTyping(channelId);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [message, channelId, sendMessage, isSending]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  return (
    <div className="border-t border-white/10 p-4 bg-[#2b2d31]">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* Attachment Button */}
        <Tooltip content="Upload File" position="top">
          <button
            type="button"
            className="flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            aria-label="Upload File"
          >
            <Plus className="h-5 w-5" />
          </button>
        </Tooltip>

        {/* Message Input */}
        <div className="flex-1 bg-[#383a40] rounded-lg border border-white/5 focus-within:border-purple-500/50 transition-colors">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${channelId.substring(0, 8)}...`}
            className="w-full bg-transparent px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none custom-scrollbar"
            rows={1}
            maxLength={2000}
            style={{ minHeight: '44px', maxHeight: '200px' }}
          />
          
          {/* Character Counter */}
          {message.length > 1800 && (
            <div className={`px-4 pb-2 text-xs ${message.length >= 2000 ? 'text-red-400' : 'text-gray-500'}`}>
              {message.length} / 2000
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <Tooltip content="Gift Nitro" position="top">
            <button
              type="button"
              className="flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              aria-label="Gift Nitro"
            >
              <Gift className="h-5 w-5" />
            </button>
          </Tooltip>

          <Tooltip content="Add Emoji" position="top">
            <button
              type="button"
              className="flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              aria-label="Add Emoji"
            >
              <Smile className="h-5 w-5" />
            </button>
          </Tooltip>

          {/* Send Button */}
          <Tooltip content={message.trim() ? 'Send Message' : 'Type a message'} position="top">
            <button
              type="submit"
              disabled={!message.trim() || isSending}
              className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                message.trim() && !isSending
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
                  : 'bg-white/5 text-gray-500 cursor-not-allowed'
              }`}
              aria-label="Send Message"
            >
              {isSending ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </Tooltip>
        </div>
      </form>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';
