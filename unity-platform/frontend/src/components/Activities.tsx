import React, { useState, useEffect } from 'react';
import { Gamepad2, Users, Clock, Play, X, Search, TrendingUp, Star, Trophy, Zap, Target, Swords } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

interface Activity {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'game' | 'watch' | 'listen' | 'compete';
  maxPlayers: number;
  minPlayers: number;
  isPremium: boolean;
  popularity: number;
  imageUrl?: string;
}

interface ActiveSession {
  id: string;
  activityId: string;
  hostId: string;
  hostName: string;
  participants: Participant[];
  startedAt: Date;
  status: 'waiting' | 'in_progress' | 'finished';
  inviteCode: string;
}

interface Participant {
  id: string;
  username: string;
  avatarUrl?: string;
  score?: number;
  status: 'ready' | 'playing' | 'spectating';
}

export const Activities: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      name: 'Chess',
      description: 'Classic strategy game',
      icon: '♟️',
      category: 'game',
      maxPlayers: 2,
      minPlayers: 2,
      isPremium: false,
      popularity: 95,
      imageUrl: '/images/chess.jpg'
    },
    {
      id: '2',
      name: 'Poker Night',
      description: 'Texas Hold\'em with friends',
      icon: '🃏',
      category: 'game',
      maxPlayers: 8,
      minPlayers: 2,
      isPremium: false,
      popularity: 88,
      imageUrl: '/images/poker.jpg'
    },
    {
      id: '3',
      name: 'Watch Together',
      description: 'Watch YouTube videos together',
      icon: '📺',
      category: 'watch',
      maxPlayers: 50,
      minPlayers: 2,
      isPremium: false,
      popularity: 92,
      imageUrl: '/images/youtube.jpg'
    },
    {
      id: '4',
      name: 'Sketch Heads',
      description: 'Draw and guess with friends',
      icon: '🎨',
      category: 'game',
      maxPlayers: 8,
      minPlayers: 3,
      isPremium: false,
      popularity: 85,
      imageUrl: '/images/sketch.jpg'
    },
    {
      id: '5',
      name: 'Letter League',
      description: 'Word game competition',
      icon: '📝',
      category: 'compete',
      maxPlayers: 8,
      minPlayers: 2,
      isPremium: true,
      popularity: 78,
      imageUrl: '/images/letter.jpg'
    },
    {
      id: '6',
      name: 'Spotify Listen Along',
      description: 'Listen to music together',
      icon: '🎵',
      category: 'listen',
      maxPlayers: 20,
      minPlayers: 2,
      isPremium: false,
      popularity: 90,
      imageUrl: '/images/spotify.jpg'
    },
    {
      id: '7',
      name: 'Blazing 8s',
      description: 'Fast-paced card game',
      icon: '🔥',
      category: 'game',
      maxPlayers: 4,
      minPlayers: 2,
      isPremium: true,
      popularity: 82,
      imageUrl: '/images/blazing.jpg'
    },
    {
      id: '8',
      name: 'Putt Party',
      description: 'Mini golf with friends',
      icon: '⛳',
      category: 'game',
      maxPlayers: 8,
      minPlayers: 2,
      isPremium: true,
      popularity: 86,
      imageUrl: '/images/golf.jpg'
    }
  ]);

  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSession, setCurrentSession] = useState<ActiveSession | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const { user } = useAuthStore();

  const categories = [
    { id: 'all', name: 'All Activities', icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'game', name: 'Games', icon: <Target className="w-4 h-4" /> },
    { id: 'watch', name: 'Watch', icon: <Play className="w-4 h-4" /> },
    { id: 'listen', name: 'Listen', icon: <Zap className="w-4 h-4" /> },
    { id: 'compete', name: 'Compete', icon: <Trophy className="w-4 h-4" /> }
  ];

  useEffect(() => {
    loadActiveSessions();
    setupActivityListeners();
  }, []);

  const loadActiveSessions = async () => {
    try {
      const response = await fetch('/api/v1/activities/sessions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setActiveSessions(data.sessions);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const setupActivityListeners = () => {
    const ws = window.socketConnection;
    if (!ws) return;

    ws.on('activity:sessionCreated', (session: ActiveSession) => {
      setActiveSessions(prev => [...prev, session]);
    });

    ws.on('activity:sessionUpdated', (session: ActiveSession) => {
      setActiveSessions(prev => prev.map(s => 
        s.id === session.id ? session : s
      ));
      if (currentSession?.id === session.id) {
        setCurrentSession(session);
      }
    });

    ws.on('activity:sessionEnded', (sessionId: string) => {
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        toast.info('Activity session ended');
      }
    });

    ws.on('activity:playerJoined', (data: { sessionId: string; participant: Participant }) => {
      setActiveSessions(prev => prev.map(s => {
        if (s.id === data.sessionId) {
          return {
            ...s,
            participants: [...s.participants, data.participant]
          };
        }
        return s;
      }));
    });
  };

  const startActivity = async (activityId: string) => {
    try {
      const response = await fetch('/api/v1/activities/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ activityId })
      });

      if (response.ok) {
        const session = await response.json();
        setCurrentSession(session);
        setShowCreateModal(false);
        toast.success('Activity started!');

        // Open activity in new window or embed
        if (session.embedUrl) {
          window.open(session.embedUrl, 'activity', 'width=800,height=600');
        }
      }
    } catch (error) {
      toast.error('Failed to start activity');
    }
  };

  const joinSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/v1/activities/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const session = await response.json();
        setCurrentSession(session);
        toast.success('Joined activity!');

        if (session.embedUrl) {
          window.open(session.embedUrl, 'activity', 'width=800,height=600');
        }
      }
    } catch (error) {
      toast.error('Failed to join activity');
    }
  };

  const leaveSession = async () => {
    if (!currentSession) return;

    try {
      await fetch(`/api/v1/activities/sessions/${currentSession.id}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      setCurrentSession(null);
      toast.info('Left activity');
    } catch (error) {
      toast.error('Failed to leave activity');
    }
  };

  const inviteToActivity = async (userId: string) => {
    if (!currentSession) return;

    try {
      await fetch(`/api/v1/activities/sessions/${currentSession.id}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
      toast.success('Invitation sent');
    } catch (error) {
      toast.error('Failed to send invitation');
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
    const matchesSearch = activity.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 via-indigo-900/20 to-gray-900">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-indigo-400" />
            Activities
          </h1>
          
          {currentSession ? (
            <div className="flex items-center gap-3 px-4 py-2 bg-indigo-600/20 rounded-lg">
              <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-white">In Activity: {currentSession.participants.length} players</span>
              <button
                onClick={leaveSession}
                className="p-1 hover:bg-red-600/30 rounded transition-all"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-all"
            >
              Start Activity
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/30 border border-indigo-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-black/30 text-gray-300 hover:bg-black/50'
              }`}
            >
              {cat.icon}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-700/50">
          <h2 className="text-sm font-medium text-gray-400 uppercase mb-3">Active Sessions</h2>
          <div className="grid grid-cols-3 gap-3">
            {activeSessions.map(session => {
              const activity = activities.find(a => a.id === session.activityId);
              return (
                <div
                  key={session.id}
                  className="p-4 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-lg hover:from-indigo-600/30 hover:to-purple-600/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{activity?.icon}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      session.status === 'waiting' 
                        ? 'bg-yellow-600/20 text-yellow-400'
                        : 'bg-green-600/20 text-green-400'
                    }`}>
                      {session.status === 'waiting' ? 'Waiting' : 'Playing'}
                    </span>
                  </div>
                  <h3 className="font-medium text-white mb-1">{activity?.name}</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Host: {session.hostName}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {session.participants.slice(0, 3).map(p => (
                        <img
                          key={p.id}
                          src={p.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${p.username}`}
                          alt={p.username}
                          className="w-6 h-6 rounded-full border-2 border-gray-800"
                        />
                      ))}
                      {session.participants.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center">
                          <span className="text-xs text-gray-300">+{session.participants.length - 3}</span>
                        </div>
                      )}
                    </div>
                    {session.hostId !== user?.id && (
                      <button
                        onClick={() => joinSession(session.id)}
                        className="px-3 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 rounded text-sm font-medium transition-all"
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activities Grid */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <div className="grid grid-cols-4 gap-4">
          {filteredActivities.map(activity => (
            <div
              key={activity.id}
              className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-all cursor-pointer"
              onClick={() => {
                setSelectedActivity(activity);
                setShowCreateModal(true);
              }}
            >
              {/* Activity Image/Icon */}
              <div className="aspect-video bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center">
                <span className="text-6xl">{activity.icon}</span>
              </div>

              {/* Activity Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white">{activity.name}</h3>
                  {activity.isPremium && (
                    <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                  )}
                </div>
                <p className="text-sm text-gray-400 mb-3">{activity.description}</p>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-gray-400">
                      <Users className="w-3 h-3" />
                      {activity.minPlayers}-{activity.maxPlayers}
                    </span>
                    <span className="flex items-center gap-1 text-gray-400">
                      <TrendingUp className="w-3 h-3" />
                      {activity.popularity}%
                    </span>
                  </div>
                  <span className="px-2 py-1 bg-black/30 rounded text-gray-300 capitalize">
                    {activity.category}
                  </span>
                </div>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <button
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    startActivity(activity.id);
                  }}
                >
                  Start Activity
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Activity Modal */}
      {showCreateModal && selectedActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Start {selectedActivity.name}</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedActivity(null);
                }}
                className="p-1 hover:bg-white/10 rounded transition-all"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center py-8 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-lg">
                <span className="text-6xl">{selectedActivity.icon}</span>
              </div>

              <div className="space-y-2">
                <p className="text-gray-300">{selectedActivity.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {selectedActivity.minPlayers}-{selectedActivity.maxPlayers} players
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    ~15 min
                  </span>
                </div>
              </div>

              {selectedActivity.isPremium && (
                <div className="p-3 bg-yellow-600/20 rounded-lg text-yellow-400 text-sm">
                  <Star className="w-4 h-4 inline mr-1" />
                  Premium activity - Unity Plus required
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedActivity(null);
                  }}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => startActivity(selectedActivity.id)}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-all"
                >
                  Start Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
