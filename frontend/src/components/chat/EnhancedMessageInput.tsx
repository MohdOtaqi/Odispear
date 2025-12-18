import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, Mic, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface EnhancedMessageInputProps {
  onSendMessage: (content: string, attachments?: File[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Modern Enhanced Message Input Component
 * Following 2025 chat UI best practices:
 * - Sticky input bar with clear hierarchy
 * - Quick action buttons (emoji, attachment, voice)
 * - File preview before sending
 * - Auto-expanding textarea
 * - Typing indicator support
 * - Rich media support
 */

const EnhancedMessageInput: React.FC<EnhancedMessageInputProps> = ({
  onSendMessage,
  placeholder = "Type a message...",
  disabled = false
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleSend = () => {
    if ((!message.trim() && attachments.length === 0) || disabled) return;

    onSendMessage(message.trim(), attachments.length > 0 ? attachments : undefined);
    setMessage('');
    setAttachments([]);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });
    
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast('Voice recording coming soon!', { icon: '🎤' });
    }
  };

  return (
    <div className="sticky bottom-0 bg-mot-black/95 backdrop-blur-lg border-t border-mot-border p-4">
      {/* File Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex gap-2 flex-wrap animate-slide-in-up">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="relative group bg-mot-surface rounded-lg p-2 pr-8 flex items-center gap-2 border border-mot-border hover:border-mot-gold/50 transition-all"
            >
              <div className="w-10 h-10 bg-mot-gold/10 rounded flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-mot-gold" />
              </div>
              <div className="text-xs">
                <div className="text-gray-300 font-medium truncate max-w-[150px]">
                  {file.name}
                </div>
                <div className="text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <button
                onClick={() => removeAttachment(index)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Container */}
      <div className="flex items-end gap-2">
        {/* Quick Actions */}
        <div className="flex items-center gap-1 pb-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="p-2 rounded-lg text-gray-400 hover:text-mot-gold hover:bg-mot-gold/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,video/*,.pdf,.txt"
          />
          
          <button
            onClick={toggleRecording}
            disabled={disabled}
            className={`p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording
                ? 'text-red-400 bg-red-500/20 animate-pulse'
                : 'text-gray-400 hover:text-mot-gold hover:bg-mot-gold/10'
            }`}
            title="Voice message"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full bg-mot-surface border border-mot-border rounded-xl px-4 py-3 pr-12 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-mot-gold/50 focus:border-mot-gold resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          
          <button
            onClick={() => toast('Emoji picker coming soon! 😊')}
            disabled={disabled}
            className="absolute right-3 bottom-3 p-1.5 rounded-lg text-gray-400 hover:text-mot-gold hover:bg-mot-gold/10 transition-all disabled:opacity-50"
            title="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && attachments.length === 0)}
          className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-2"
          title="Send message (Enter)"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Helper Text */}
      <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
        <span>
          Press <kbd className="px-1.5 py-0.5 bg-mot-surface rounded border border-mot-border">Enter</kbd> to send, 
          <kbd className="ml-1 px-1.5 py-0.5 bg-mot-surface rounded border border-mot-border">Shift + Enter</kbd> for new line
        </span>
        {message.length > 0 && (
          <span className={message.length > 2000 ? 'text-red-400' : ''}>
            {message.length} / 2000
          </span>
        )}
      </div>
    </div>
  );
};

export default EnhancedMessageInput;
