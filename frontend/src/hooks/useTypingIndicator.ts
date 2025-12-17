import { useState, useEffect, useCallback, useRef } from 'react';
import { socketManager } from '../lib/socket';
import { useAuthStore } from '../store/authStore';

interface TypingUser {
  userId: string;
  username: string;
  timestamp: number;
}

export const useTypingIndicator = (channelId: string) => {
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map());
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuthStore();

  // Clean up old typing indicators (after 3 seconds)
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => {
        const updated = new Map(prev);
        for (const [userId, data] of updated) {
          if (now - data.timestamp > 3000) {
            updated.delete(userId);
          }
        }
        return updated.size !== prev.size ? updated : prev;
      });
    }, 1000);

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, []);

  // Listen for typing events from other users
  useEffect(() => {
    const handleTypingStart = (data: { userId: string; username: string; channelId: string }) => {
      if (data.channelId !== channelId || data.userId === user?.id) return;
      
      setTypingUsers(prev => {
        const updated = new Map(prev);
        updated.set(data.userId, {
          userId: data.userId,
          username: data.username,
          timestamp: Date.now()
        });
        return updated;
      });
    };

    const handleTypingStop = (data: { userId: string; channelId: string }) => {
      if (data.channelId !== channelId) return;
      
      setTypingUsers(prev => {
        const updated = new Map(prev);
        updated.delete(data.userId);
        return updated.size !== prev.size ? updated : prev;
      });
    };

    socketManager.on('typing.start', handleTypingStart);
    socketManager.on('typing.stop', handleTypingStop);

    return () => {
      socketManager.off('typing.start', handleTypingStart);
      socketManager.off('typing.stop', handleTypingStop);
    };
  }, [channelId, user?.id]);

  // Send typing indicator
  const startTyping = useCallback(() => {
    if (isTyping) return;
    
    setIsTyping(true);
    socketManager.emit('typing.start', {
      channelId,
      userId: user?.id,
      username: user?.username
    });

    // Auto-stop typing after 2.5 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2500);
  }, [channelId, user, isTyping]);

  // Stop typing indicator
  const stopTyping = useCallback(() => {
    if (!isTyping) return;
    
    setIsTyping(false);
    socketManager.emit('typing.stop', {
      channelId,
      userId: user?.id
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [channelId, user, isTyping]);

  // Handle input change with debouncing
  const handleInputChange = useCallback((value: string) => {
    if (value.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  }, [startTyping, stopTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTyping) {
        socketManager.emit('typing.stop', {
          channelId,
          userId: user?.id
        });
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    typingUsers: Array.from(typingUsers.values()),
    isTyping,
    startTyping,
    stopTyping,
    handleInputChange
  };
};
