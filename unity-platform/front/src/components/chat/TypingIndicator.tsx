import React from 'react';

interface TypingIndicatorProps {
  users: string[];
}

export const TypingIndicator = React.memo<TypingIndicatorProps>(({ users }) => {
  if (users.length === 0) return null;

  const displayText = () => {
    if (users.length === 1) {
      return `${users[0]} is typing...`;
    } else if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing...`;
    } else if (users.length === 3) {
      return `${users[0]}, ${users[1]}, and ${users[2]} are typing...`;
    } else {
      return `Several people are typing...`;
    }
  };

  return (
    <div className="px-4 py-2 text-sm text-gray-400 flex items-center gap-2 animate-fade-in">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="font-medium">{displayText()}</span>
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';
