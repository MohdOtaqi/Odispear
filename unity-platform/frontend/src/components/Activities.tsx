import React, { useState } from 'react';
import { Gamepad2, Music, Video, Users, Sparkles } from 'lucide-react';

interface Activity {
  id: string;
  name: string;
  type: 'game' | 'music' | 'video' | 'custom';
  icon: React.ReactNode;
  description: string;
}

const activities: Activity[] = [
  {
    id: 'youtube',
    name: 'Watch Together',
    type: 'video',
    icon: <Video className="w-6 h-6" />,
    description: 'Watch YouTube videos with friends'
  },
  {
    id: 'poker',
    name: 'Poker Night',
    type: 'game',
    icon: <Gamepad2 className="w-6 h-6" />,
    description: 'Play poker with your friends'
  },
  {
    id: 'chess',
    name: 'Chess',
    type: 'game',
    icon: <Gamepad2 className="w-6 h-6" />,
    description: 'Play chess together'
  },
  {
    id: 'drawing',
    name: 'Sketch Heads',
    type: 'game',
    icon: <Sparkles className="w-6 h-6" />,
    description: 'Drawing and guessing game'
  },
  {
    id: 'listen-along',
    name: 'Listen Along',
    type: 'music',
    icon: <Music className="w-6 h-6" />,
    description: 'Listen to Spotify together'
  }
];

interface ActivitiesProps {
  channelId?: string;
  onClose?: () => void;
}

export const Activities: React.FC<ActivitiesProps> = ({ channelId, onClose }) => {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  const startActivity = (activityId: string) => {
    setSelectedActivity(activityId);
    // TODO: Implement activity launching logic
    console.log('Starting activity:', activityId, 'in channel:', channelId);
  };

  return (
    <div className="p-6 bg-neutral-900 rounded-xl max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Activities</h2>
        <p className="text-neutral-400 text-sm">
          Choose an activity to do together in your voice channel
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activities.map((activity) => (
          <button
            key={activity.id}
            onClick={() => startActivity(activity.id)}
            className="flex items-start gap-4 p-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-left group"
          >
            <div className="p-3 bg-neutral-700 group-hover:bg-neutral-600 rounded-lg transition-colors">
              {activity.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">{activity.name}</h3>
              <p className="text-sm text-neutral-400">{activity.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 bg-neutral-800 rounded-lg">
        <div className="flex items-center gap-2 text-neutral-400 text-sm">
          <Users className="w-4 h-4" />
          <span>Join a voice channel to start an activity</span>
        </div>
      </div>

      {onClose && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};