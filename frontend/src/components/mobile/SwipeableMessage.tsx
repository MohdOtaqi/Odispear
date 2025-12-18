import React, { useRef, useState, TouchEvent } from 'react';
import { Reply, Heart, Smile } from 'lucide-react';

interface SwipeableMessageProps {
  children: React.ReactNode;
  onReply?: () => void;
  onReact?: (emoji: string) => void;
  messageId: string;
}

/**
 * Swipeable message component with gesture support
 * Swipe right to reply (like WhatsApp/Telegram)
 * Long press for reactions
 */

const SwipeableMessage: React.FC<SwipeableMessageProps> = ({
  children,
  onReply,
  onReact,
  messageId
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const longPressTimerRef = useRef<NodeJS.Timeout>();

  const handleTouchStart = (e: TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;

    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
      setShowActions(true);
    }, 500);
  };

  const handleTouchMove = (e: TouchEvent) => {
    // Clear long press if user starts swiping
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    currentXRef.current = e.touches[0].clientX;
    const diff = currentXRef.current - startXRef.current;

    // Only allow swipe right (reply action)
    if (diff > 0 && diff < 100) {
      setTranslateX(diff);
    }
  };

  const handleTouchEnd = () => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    const diff = currentXRef.current - startXRef.current;

    // Trigger reply if swiped enough
    if (diff > 60 && onReply) {
      onReply();
    }

    // Reset position
    setTranslateX(0);
  };

  return (
    <>
      <div
        className="relative touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: translateX === 0 ? 'transform 0.2s ease-out' : 'none'
        }}
      >
        {/* Reply icon appears during swipe */}
        {translateX > 0 && (
          <div
            className="absolute left-4 top-1/2 -translate-y-1/2 text-mot-gold transition-opacity"
            style={{ opacity: Math.min(translateX / 60, 1) }}
          >
            <Reply className="w-5 h-5" />
          </div>
        )}

        {children}
      </div>

      {/* Quick reactions popup */}
      {showActions && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={() => setShowActions(false)}
        >
          <div className="bg-mot-surface rounded-2xl p-4 m-4 shadow-2xl animate-scale-in">
            <div className="flex gap-3 mb-4">
              {['❤️', '👍', '😂', '😮', '😢', '🔥'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact?.(emoji);
                    setShowActions(false);
                  }}
                  className="text-3xl hover:scale-125 transition-transform active:scale-110 p-2"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                onReply?.();
                setShowActions(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-mot-gold/10 hover:bg-mot-gold/20 text-mot-gold rounded-xl transition-all"
            >
              <Reply className="w-4 h-4" />
              <span className="font-medium">Reply</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SwipeableMessage;
