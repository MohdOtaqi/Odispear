import React, { useState, useEffect } from 'react';
import { Bell, BellOff, MessageCircle, UserPlus, Heart, AtSign, Hash, Volume2, Settings, X, Check } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

interface NotificationSettings {
  desktop: boolean;
  sound: boolean;
  directMessages: boolean;
  mentions: boolean;
  friendRequests: boolean;
  reactions: boolean;
  serverInvites: boolean;
}

interface Notification {
  id: string;
  type: 'message' | 'mention' | 'friend_request' | 'reaction' | 'server_invite';
  title: string;
  content: string;
  avatar?: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export const NotificationSystem: React.FC = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<NotificationSettings>({
    desktop: true,
    sound: true,
    directMessages: true,
    mentions: true,
    friendRequests: true,
    reactions: true,
    serverInvites: true,
  });

  useEffect(() => {
    loadSettings();
    fetchNotifications();
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const loadSettings = () => {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  };

  const saveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      // Use mock data for demo
      setNotifications(generateMockNotifications());
    }
  };

  const generateMockNotifications = (): Notification[] => {
    return [
      {
        id: '1',
        type: 'message',
        title: 'New message from Alex',
        content: 'Hey! Are you available for the game tonight?',
        avatar: 'https://ui-avatars.com/api/?name=Alex&background=6366f1&color=fff',
        timestamp: new Date(Date.now() - 5 * 60000),
        read: false,
        actionUrl: '/app/dms/alex',
      },
      {
        id: '2',
        type: 'mention',
        title: 'You were mentioned in #general',
        content: '@you Check out this awesome project!',
        avatar: 'https://ui-avatars.com/api/?name=Unity&background=8b5cf6&color=fff',
        timestamp: new Date(Date.now() - 15 * 60000),
        read: false,
        actionUrl: '/app/servers/unity/general',
      },
      {
        id: '3',
        type: 'friend_request',
        title: 'New friend request',
        content: 'Sarah wants to be your friend',
        avatar: 'https://ui-avatars.com/api/?name=Sarah&background=ec4899&color=fff',
        timestamp: new Date(Date.now() - 30 * 60000),
        read: true,
        actionUrl: '/app/friends',
      },
      {
        id: '4',
        type: 'reaction',
        title: 'New reaction to your message',
        content: 'John reacted with 😂 to your message',
        timestamp: new Date(Date.now() - 60 * 60000),
        read: true,
      },
      {
        id: '5',
        type: 'server_invite',
        title: 'Server invitation',
        content: 'You\'ve been invited to join "Gaming Hub"',
        avatar: 'https://ui-avatars.com/api/?name=Gaming+Hub&background=ef4444&color=fff',
        timestamp: new Date(Date.now() - 120 * 60000),
        read: true,
        actionUrl: '/app/invites',
      },
    ];
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const showDesktopNotification = (notification: Notification) => {
    if (settings.desktop && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.content,
        icon: notification.avatar || '/icon.png',
        tag: notification.id,
      });
    }
  };

  const playNotificationSound = () => {
    if (settings.sound) {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(console.error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="w-4 h-4" />;
      case 'mention':
        return <AtSign className="w-4 h-4" />;
      case 'friend_request':
        return <UserPlus className="w-4 h-4" />;
      case 'reaction':
        return <Heart className="w-4 h-4" />;
      case 'server_invite':
        return <Hash className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <>
      {/* Notification Bell Button */}
      <div className="relative">
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="relative p-2 text-gray-400 hover:text-white transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Panel */}
        {showPanel && (
          <div className="absolute right-0 mt-2 w-96 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 animate-slide-up">
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Notifications</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="p-1.5 text-gray-400 hover:text-white transition-colors"
                      title="Mark all as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={clearNotifications}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors"
                    title="Clear all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Settings Panel */}
              {showSettings && (
                <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Notification Settings</h4>
                  <div className="space-y-2">
                    {Object.entries(settings).map(([key, value]) => (
                      <label key={key} className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-gray-400 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => saveSettings({ ...settings, [key]: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <BellOff className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No notifications yet</p>
                  <p className="text-sm text-gray-500 mt-1">We'll let you know when something happens</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-800/50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-gray-800/30' : ''
                      }`}
                      onClick={() => {
                        markAsRead(notification.id);
                        if (notification.actionUrl) {
                          window.location.href = notification.actionUrl;
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {notification.avatar ? (
                          <img
                            src={notification.avatar}
                            alt=""
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            notification.type === 'message' ? 'bg-blue-900/50' :
                            notification.type === 'mention' ? 'bg-purple-900/50' :
                            notification.type === 'friend_request' ? 'bg-green-900/50' :
                            notification.type === 'reaction' ? 'bg-pink-900/50' :
                            'bg-gray-800'
                          }`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-white">{notification.title}</p>
                              <p className="text-sm text-gray-400 mt-0.5">{notification.content}</p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{formatTime(notification.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-800">
                <button className="w-full text-center text-sm text-purple-400 hover:text-purple-300 transition-colors">
                  View All Notifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationSystem;
