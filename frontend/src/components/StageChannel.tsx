import React, { useState } from 'react';
import { Mic, MicOff, Users, Hand, Shield, User } from 'lucide-react';

interface StageSpeaker {
  id: string;
  username: string;
  avatar_url?: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isModerator: boolean;
}

interface StageChannelProps {
  channelId: string;
  channelName: string;
  topic?: string;
}

export const StageChannel: React.FC<StageChannelProps> = ({ 
  channelId, 
  channelName, 
  topic 
}) => {
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Mock data - replace with real data from backend
  const speakers: StageSpeaker[] = [
    {
      id: '1',
      username: 'Host',
      isSpeaking: true,
      isMuted: false,
      isModerator: true
    }
  ];

  const audience = 42; // Mock audience count

  const requestToSpeak = () => {
    setIsHandRaised(!isHandRaised);
  };

  const becomeSpeaker = () => {
    setIsSpeaker(true);
    setIsHandRaised(false);
  };

  const leaveStage = () => {
    setIsSpeaker(false);
    setIsMuted(false);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      {/* Stage Header */}
      <div className="p-6 border-b border-neutral-700">
        <h2 className="text-2xl font-bold text-white mb-2">{channelName}</h2>
        {topic && <p className="text-neutral-400 text-sm">{topic}</p>}
        <div className="flex items-center gap-2 mt-3 text-neutral-400 text-sm">
          <Users className="w-4 h-4" />
          <span>{speakers.length} speakers • {audience} listening</span>
        </div>
      </div>

      {/* Speakers Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-400 uppercase mb-3">
            Speakers
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {speakers.map((speaker) => (
              <div
                key={speaker.id}
                className="flex flex-col items-center p-4 bg-neutral-800 rounded-lg"
              >
                <div className="relative mb-3">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center ${
                    speaker.isSpeaking ? 'ring-4 ring-green-500' : ''
                  }`}>
                    {speaker.avatar_url ? (
                      <img 
                        src={speaker.avatar_url} 
                        alt={speaker.username}
                        className="w-full h-full rounded-full"
                      />
                    ) : (
                      <User className="w-8 h-8 text-white" />
                    )}
                  </div>
                  {speaker.isModerator && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <Shield className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {speaker.isMuted && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                      <MicOff className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-white text-center">
                  {speaker.username}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Audience Section */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-neutral-400 uppercase mb-3">
            Audience
          </h3>
          <div className="p-6 bg-neutral-800 rounded-lg text-center">
            <Users className="w-12 h-12 text-neutral-600 mx-auto mb-2" />
            <p className="text-neutral-400">{audience} people listening</p>
          </div>
        </div>
      </div>

      {/* Stage Controls */}
      <div className="p-4 border-t border-neutral-700 bg-neutral-850">
        {isSpeaker ? (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-full transition-colors ${
                isMuted
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-neutral-700 hover:bg-neutral-600'
              }`}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </button>
            <button
              onClick={leaveStage}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Leave Stage
            </button>
          </div>
        ) : (
          <button
            onClick={requestToSpeak}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              isHandRaised
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Hand className="w-5 h-5" />
            {isHandRaised ? 'Hand Raised' : 'Request to Speak'}
          </button>
        )}
      </div>
    </div>
  );
};