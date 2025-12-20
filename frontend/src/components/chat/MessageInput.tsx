import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Smile, Paperclip, X } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { EmojiPicker } from '../EmojiPicker';
import { useMessageStore } from '../../store/messageStore';
import { useDMStore } from '../../store/dmStore';
import { socketManager } from '../../lib/socket';
import { useDebounce } from '../../hooks/usePerformance';
import toast from 'react-hot-toast';
import api from '../../lib/api';

interface MessageInputProps {
  channelId: string;
  isDM?: boolean;
  placeholder?: string;
}

export const MessageInput = React.memo<MessageInputProps>(({ channelId, isDM = false, placeholder }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const sendChannelMessage = useMessageStore((state) => state.sendMessage);
  const sendDMMessage = useDMStore((state) => state.sendDMMessage);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 200);
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

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

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
      if (isDM) {
        await sendDMMessage(channelId, message.trim());
      } else {
        await sendChannelMessage(channelId, message.trim());
      }
      setMessage('');
      setIsTyping(false);
      socketManager.stopTyping(channelId);

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [message, channelId, isDM, sendDMMessage, sendChannelMessage, isSending]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const fileUrl = response.data.url;
      const fileMessage = `[File: ${file.name}](${fileUrl})`;

      if (isDM) {
        await sendDMMessage(channelId, fileMessage);
      } else {
        await sendChannelMessage(channelId, fileMessage);
      }

      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('File upload failed:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [channelId, isDM, sendDMMessage, sendChannelMessage]);

  return (
    <motion.div
      className="border-t border-mot-border p-4 bg-gradient-to-t from-mot-surface to-mot-surface/95"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        {/* Attachment Button */}
        <Tooltip content="Upload File" position="top">
          <motion.button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-shrink-0 p-2.5 text-gray-400 hover:text-mot-gold rounded-xl hover:bg-mot-gold/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Upload File"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isUploading ? (
              <motion.div
                className="h-5 w-5 border-2 border-mot-gold border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <Plus className="h-5 w-5" />
            )}
          </motion.button>
        </Tooltip>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,video/*,.pdf,.txt,.doc,.docx"
        />

        {/* Message Input Container */}
        <motion.div
          className="flex-1 relative"
          animate={{
            boxShadow: isFocused ? "0 0 20px rgba(212, 175, 55, 0.15)" : "none"
          }}
        >
          {/* Glow border effect */}
          <AnimatePresence>
            {isFocused && (
              <motion.div
                className="absolute -inset-0.5 bg-gradient-to-r from-mot-gold/50 via-amber-500/50 to-mot-gold/50 rounded-2xl blur-sm pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>

          <div className="relative bg-mot-surface-subtle rounded-xl border border-mot-border overflow-hidden">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder || `Message...`}
              className="w-full bg-transparent px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none custom-scrollbar"
              rows={1}
              maxLength={2000}
              style={{ minHeight: '48px', maxHeight: '200px' }}
            />

            {/* Character Counter */}
            <AnimatePresence>
              {message.length > 1800 && (
                <motion.div
                  className={`px-4 pb-2 text-xs ${message.length >= 2000 ? 'text-red-400' : 'text-gray-500'}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                >
                  {message.length} / 2000
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Emoji Picker */}
          <div className="relative">
            <Tooltip content="Add emoji" position="top">
              <motion.button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2.5 text-gray-400 hover:text-mot-gold rounded-xl hover:bg-mot-gold/10 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Smile className="w-5 h-5" />
              </motion.button>
            </Tooltip>
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                >
                  <EmojiPicker
                    onEmojiSelect={handleEmojiSelect}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Send Button */}
          <Tooltip content={message.trim() ? 'Send Message' : 'Type a message'} position="top">
            <motion.button
              type="submit"
              disabled={!message.trim() || isSending}
              className={`flex-shrink-0 p-2.5 rounded-xl transition-colors ${message.trim() && !isSending
                  ? 'bg-gradient-to-r from-mot-gold to-amber-500 text-mot-black shadow-lg'
                  : 'bg-mot-surface-subtle text-gray-500 cursor-not-allowed'
                }`}
              aria-label="Send Message"
              whileHover={message.trim() && !isSending ? {
                scale: 1.1,
                boxShadow: "0 0 25px rgba(212, 175, 55, 0.5)"
              } : undefined}
              whileTap={message.trim() && !isSending ? { scale: 0.9 } : undefined}
              animate={message.trim() && !isSending ? {
                boxShadow: ["0 0 10px rgba(212, 175, 55, 0.3)", "0 0 20px rgba(212, 175, 55, 0.5)", "0 0 10px rgba(212, 175, 55, 0.3)"]
              } : undefined}
              transition={{
                boxShadow: { duration: 2, repeat: Infinity },
                scale: { type: "spring", stiffness: 400, damping: 25 }
              }}
            >
              {isSending ? (
                <motion.div
                  className="h-5 w-5 border-2 border-current border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </motion.button>
          </Tooltip>
        </div>
      </form>
    </motion.div>
  );
});

MessageInput.displayName = 'MessageInput';
