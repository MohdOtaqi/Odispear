import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Users, Radio, UserPlus, Hand, Volume2, Settings, ChevronUp, ChevronDown, Crown, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

interface StageSpeaker {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isMuted: boolean;
  isSpeaking: boolean;
  isHost: boolean;
  isModerator: boolean;
  volume: number;
}

interface StageListener {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  handRaised: boolean;
  joinedAt: Date;
}

interface StageChannelProps {
  channelId: string;
  channelName: string;
  topic?: string;
  guildId: string;
}

export const StageChannel: React.FC<StageChannelProps> = ({
  channelId,
  channelName,
  topic,
  guildId
}) => {
  const [speakers, setSpeakers] = useState<StageSpeaker[]>([]);
  const [listeners, setListeners] = useState<StageListener[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [stageTopic, setStageTopic] = useState(topic || 'Welcome to the stage!');
  const [showSettings, setShowSettings] = useState(false);
  const [requestQueue, setRequestQueue] = useState<StageListener[]>([]);
  const [showListeners, setShowListeners] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (isConnected) {
      loadStageData();
      setupWebSocketListeners();
    }
  }, [isConnected, channelId]);

  const loadStageData = async () => {
    try {
      const response = await fetch(`/api/v1/stage/${channelId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSpeakers(data.speakers);
        setListeners(data.listeners);
        setStageTopic(data.topic || stageTopic);
        setRequestQueue(data.requestQueue || []);
      }
    } catch (error) {
      console.error('Failed to load stage data:', error);
    }
  };

  const setupWebSocketListeners = () => {
    const ws = window.socketConnection;
    if (!ws) return;

    ws.on('stage:speakerJoined', (speaker: StageSpeaker) => {
      setSpeakers(prev => [...prev, speaker]);
    });

    ws.on('stage:speakerLeft', (userId: string) => {
      setSpeakers(prev => prev.filter(s => s.id !== userId));
    });

    ws.on('stage:listenerJoined', (listener: StageListener) => {
      setListeners(prev => [...prev, listener]);
    });

    ws.on('stage:listenerLeft', (userId: string) => {
      setListeners(prev => prev.filter(l => l.id !== userId));
    });

    ws.on('stage:handRaised', (userId: string) => {
      setListeners(prev => prev.map(l => 
        l.id === userId ? { ...l, handRaised: true } : l
      ));
      setRequestQueue(prev => {
        const listener = listeners.find(l => l.id === userId);
        return listener && !prev.some(r => r.id === userId) 
          ? [...prev, listener] 
          : prev;
      });
    });

    ws.on('stage:topicChanged', (newTopic: string) => {
      setStageTopic(newTopic);
      toast.info('Stage topic updated');
    });
  };

  const joinStage = async () => {
    try {
      const response = await fetch(`/api/v1/stage/${channelId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ asListener: true })
      });

      if (response.ok) {
        setIsConnected(true);
        toast.success('Joined stage as listener');
      }
    } catch (error) {
      toast.error('Failed to join stage');
    }
  };

  const leaveStage = async () => {
    try {
      await fetch(`/api/v1/stage/${channelId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      setIsConnected(false);
      setIsSpeaker(false);
      setHandRaised(false);
      toast.info('Left the stage');
    } catch (error) {
      toast.error('Failed to leave stage');
    }
  };

  const requestToSpeak = async () => {
    if (handRaised) {
      setHandRaised(false);
      toast.info('Lowered hand');
      return;
    }

    try {
      const response = await fetch(`/api/v1/stage/${channelId}/request-speak`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        setHandRaised(true);
        toast.success('Requested to speak');
      }
    } catch (error) {
      toast.error('Failed to request speaking');
    }
  };

  const inviteToSpeak = async (listenerId: string) => {
    try {
      const response = await fetch(`/api/v1/stage/${channelId}/invite-speaker`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: listenerId })
      });

      if (response.ok) {
        toast.success('Invited to speak');
        setRequestQueue(prev => prev.filter(r => r.id !== listenerId));
      }
    } catch (error) {
      toast.error('Failed to invite speaker');
    }
  };

  const moveToListener = async (speakerId: string) => {
    try {
      const response = await fetch(`/api/v1/stage/${channelId}/move-to-listener`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: speakerId })
      });

      if (response.ok) {
        toast.success('Moved to listeners');
      }
    } catch (error) {
      toast.error('Failed to move speaker');
    }
  };

  const updateTopic = async (newTopic: string) => {
    try {
      const response = await fetch(`/api/v1/stage/${channelId}/topic`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ topic: newTopic })
      });

      if (response.ok) {
        setStageTopic(newTopic);
        toast.success('Topic updated');
      }
    } catch (error) {
      toast.error('Failed to update topic');
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Implement actual mute logic with voice SDK
  };

  const isHost = speakers.find(s => s.id === user?.id)?.isHost;
  const isModerator = speakers.find(s => s.id === user?.id)?.isModerator;
  const canManageStage = isHost || isModerator;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">{channelName}</h2>
              <p className="text-sm text-gray-400">{stageTopic}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canManageStage && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-white/5 rounded-lg transition-all"
              >
                <Settings className="w-5 h-5 text-gray-400" />
              </button>
            )}
            {!isConnected ? (
              <button
                onClick={joinStage}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-all"
              >
                Join Stage
              </button>
            ) : (
              <button
                onClick={leaveStage}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-all"
              >
                Leave Stage
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stage Settings (for hosts/mods) */}
      {showSettings && canManageStage && (
        <div className="px-6 py-3 bg-black/20 border-b border-gray-700/50">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={stageTopic}
              onChange={(e) => setStageTopic(e.target.value)}
              onBlur={(e) => updateTopic(e.target.value)}
              className="flex-1 px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              placeholder="Stage topic..."
            />
            {requestQueue.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 rounded-lg">
                <Hand className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300">
                  {requestQueue.length} requests
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Speakers */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-400 uppercase">
            Speakers — {speakers.length}
          </h3>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {speakers.map(speaker => (
            <div
              key={speaker.id}
              className="relative group"
            >
              <div className="flex flex-col items-center p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all">
                <div className="relative mb-2">
                  <img
                    src={speaker.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${speaker.username}`}
                    alt={speaker.username}
                    className="w-16 h-16 rounded-full"
                  />
                  {speaker.isSpeaking && (
                    <div className="absolute inset-0 rounded-full ring-2 ring-green-500 ring-offset-2 ring-offset-gray-900 animate-pulse" />
                  )}
                  {speaker.isMuted && (
                    <div className="absolute bottom-0 right-0 p-1 bg-red-600 rounded-full">
                      <MicOff className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {speaker.isHost && (
                    <div className="absolute top-0 right-0 p-1 bg-yellow-600 rounded-full">
                      <Crown className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {speaker.isModerator && !speaker.isHost && (
                    <div className="absolute top-0 right-0 p-1 bg-purple-600 rounded-full">
                      <Shield className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-white truncate max-w-full">
                  {speaker.displayName || speaker.username}
                </span>
                
                {/* Actions for moderators */}
                {canManageStage && speaker.id !== user?.id && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveToListener(speaker.id)}
                      className="p-1 bg-black/50 hover:bg-black/70 rounded text-gray-300 hover:text-white transition-all"
                      title="Move to listeners"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Request Queue (for moderators) */}
      {canManageStage && requestQueue.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-700/50">
          <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">
            Speaking Requests
          </h3>
          <div className="flex gap-2 overflow-x-auto">
            {requestQueue.map(request => (
              <div
                key={request.id}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 rounded-lg whitespace-nowrap"
              >
                <img
                  src={request.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${request.username}`}
                  alt={request.username}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm text-white">{request.displayName || request.username}</span>
                <button
                  onClick={() => inviteToSpeak(request.id)}
                  className="p-1 hover:bg-green-600/30 rounded text-green-400"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Listeners */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <button
          onClick={() => setShowListeners(!showListeners)}
          className="flex items-center justify-between w-full mb-3"
        >
          <h3 className="text-sm font-medium text-gray-400 uppercase">
            Listeners — {listeners.length}
          </h3>
          {showListeners ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {showListeners && (
          <div className="space-y-1">
            {listeners.map(listener => (
              <div
                key={listener.id}
                className="flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-lg group transition-all"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={listener.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${listener.username}`}
                    alt={listener.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm text-gray-300">
                    {listener.displayName || listener.username}
                  </span>
                  {listener.handRaised && (
                    <Hand className="w-4 h-4 text-yellow-400 animate-bounce" />
                  )}
                </div>
                
                {canManageStage && (
                  <button
                    onClick={() => inviteToSpeak(listener.id)}
                    className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-purple-600/30 hover:bg-purple-600/50 rounded text-xs text-purple-300 transition-all"
                  >
                    Invite to speak
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      {isConnected && (
        <div className="px-6 py-4 border-t border-gray-700/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSpeaker ? (
                <>
                  <button
                    onClick={toggleMute}
                    className={`p-2 rounded-lg transition-all ${
                      isMuted 
                        ? 'bg-red-600/20 text-red-400' 
                        : 'bg-white/10 text-gray-300 hover:text-white'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-gray-300 hover:text-white transition-all">
                    <Volume2 className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={requestToSpeak}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    handRaised
                      ? 'bg-yellow-600/20 text-yellow-400'
                      : 'bg-white/10 text-gray-300 hover:text-white hover:bg-white/20'
                  }`}
                >
                  <Hand className="w-4 h-4" />
                  {handRaised ? 'Cancel Request' : 'Request to Speak'}
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Users className="w-4 h-4" />
              <span>{speakers.length + listeners.length} in stage</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
