import React, { useState } from 'react';
import { Reply, MoreVertical, Smile, Edit, Trash, Pin, Flag } from 'lucide-react';

interface Message {
  id: string;
  author: {
    username: string;
    avatar?: string;
    color?: string;
    bot?: boolean;
  };
  content: string;
  timestamp: string;
  edited?: boolean;
  reactions?: Array<{ emoji: string; count: number; reacted: boolean }>;
  attachments?: Array<{ url: string; type: string }>;
  embeds?: Array<{
    title?: string;
    description?: string;
    color?: string;
    thumbnail?: string;
    fields?: Array<{ name: string; value: string }>;
  }>;
  replyTo?: {
    username: string;
    content: string;
  };
}

interface MessageComponentProps {
  message: Message;
  onReply?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

const MessageComponent: React.FC<MessageComponentProps> = ({
  message,
  onReply,
  onEdit,
  onDelete,
  onReact,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '💯'];

  return (
    <div
      className="group relative px-4 py-2 hover:bg-white/5 message-enter transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Reply Reference */}
      {message.replyTo && (
        <div className="flex items-center gap-2 mb-1 ml-14 text-xs text-gray-400 animate-slide-in-down">
          <Reply className="w-3 h-3" />
          <span className="font-semibold">{message.replyTo.username}</span>
          <span className="truncate">{message.replyTo.content}</span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0 animate-scale-in">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm hover-scale cursor-pointer"
            style={{
              background: message.author.color || 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            }}
          >
            {message.author.avatar ? (
              <img
                src={message.author.avatar}
                alt={message.author.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              message.author.username[0].toUpperCase()
            )}
          </div>
          {message.author.bot && (
            <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white text-[8px] px-1 rounded font-bold">
              BOT
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="font-semibold text-sm hover:underline cursor-pointer"
              style={{ color: message.author.color || '#fff' }}
            >
              {message.author.username}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {message.edited && (
              <span className="text-[10px] text-gray-500">(edited)</span>
            )}
          </div>

          {/* Text Content */}
          <div className="text-sm text-gray-200 break-words">{message.content}</div>

          {/* Embeds */}
          {message.embeds?.map((embed, idx) => (
            <div
              key={idx}
              className="mt-2 border-l-4 rounded bg-[#2b2d31] p-3 animate-slide-in-up hover-lift"
              style={{ borderColor: embed.color || '#8b5cf6' }}
            >
              {embed.title && (
                <div className="font-semibold text-sm mb-1 text-white">
                  {embed.title}
                </div>
              )}
              {embed.description && (
                <div className="text-sm text-gray-300 mb-2">{embed.description}</div>
              )}
              {embed.fields?.map((field, fieldIdx) => (
                <div key={fieldIdx} className="mb-2">
                  <div className="text-xs font-semibold text-gray-300">
                    {field.name}
                  </div>
                  <div className="text-xs text-gray-400">{field.value}</div>
                </div>
              ))}
              {embed.thumbnail && (
                <img
                  src={embed.thumbnail}
                  alt="Embed"
                  className="mt-2 rounded max-w-[100px] hover-scale cursor-pointer"
                />
              )}
            </div>
          ))}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.attachments.map((attachment, idx) => (
                <div
                  key={idx}
                  className="relative rounded-lg overflow-hidden hover-lift cursor-pointer animate-scale-in"
                >
                  {attachment.type === 'image' ? (
                    <img
                      src={attachment.url}
                      alt="Attachment"
                      className="max-w-sm max-h-64 rounded-lg"
                    />
                  ) : (
                    <div className="bg-[#2b2d31] px-4 py-3 rounded-lg flex items-center gap-2">
                      <div className="w-10 h-10 bg-purple-600 rounded flex items-center justify-center">
                        📄
                      </div>
                      <span className="text-sm text-gray-300">File attachment</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((reaction, idx) => (
                <button
                  key={idx}
                  onClick={() => onReact?.(message.id, reaction.emoji)}
                  className={`
                    flex items-center gap-1 px-2 py-1 rounded text-xs transition-all hover-scale
                    ${
                      reaction.reacted
                        ? 'bg-purple-600/20 border border-purple-600/50'
                        : 'bg-[#2b2d31] border border-transparent hover:border-purple-600/30'
                    }
                  `}
                >
                  <span className="text-base">{reaction.emoji}</span>
                  <span className="text-gray-300 font-medium">{reaction.count}</span>
                </button>
              ))}
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex items-center justify-center w-7 h-7 rounded bg-[#2b2d31] hover:bg-[#383a40] transition-colors hover-scale"
              >
                <Smile className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          )}

          {/* Quick Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute mt-2 bg-[#1e1f22] rounded-lg shadow-2xl p-2 flex gap-1 border border-purple-600/20 animate-scale-in z-10">
              {quickEmojis.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onReact?.(message.id, emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="w-8 h-8 rounded hover:bg-purple-600/20 transition-colors text-lg hover-scale"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          className={`
            absolute top-0 right-4 bg-[#1e1f22] border border-purple-600/20 rounded shadow-lg 
            flex gap-1 p-1 transition-all
            ${showActions ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
          `}
        >
          <button
            onClick={() => onReact?.(message.id, '👍')}
            className="p-1.5 rounded hover:bg-purple-600/20 transition-colors tooltip"
            data-tooltip="Add Reaction"
          >
            <Smile className="w-4 h-4 text-gray-400 hover:text-purple-400" />
          </button>
          <button
            onClick={() => onReply?.(message.id)}
            className="p-1.5 rounded hover:bg-purple-600/20 transition-colors tooltip"
            data-tooltip="Reply"
          >
            <Reply className="w-4 h-4 text-gray-400 hover:text-purple-400" />
          </button>
          <button
            onClick={() => onEdit?.(message.id)}
            className="p-1.5 rounded hover:bg-purple-600/20 transition-colors tooltip"
            data-tooltip="Edit"
          >
            <Edit className="w-4 h-4 text-gray-400 hover:text-purple-400" />
          </button>
          <button
            onClick={() => onDelete?.(message.id)}
            className="p-1.5 rounded hover:bg-red-600/20 transition-colors tooltip"
            data-tooltip="Delete"
          >
            <Trash className="w-4 h-4 text-gray-400 hover:text-red-400" />
          </button>
          <button className="p-1.5 rounded hover:bg-purple-600/20 transition-colors tooltip" data-tooltip="More">
            <MoreVertical className="w-4 h-4 text-gray-400 hover:text-purple-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageComponent;
