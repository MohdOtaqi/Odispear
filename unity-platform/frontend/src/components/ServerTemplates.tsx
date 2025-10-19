import React, { useState } from 'react';
import { Users, Gaming, BookOpen, Briefcase, Music, Code, Palette, Heart, School, MessageSquare, Mic, Video, Calendar, Hash, Lock, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  channels: {
    name: string;
    type: 'text' | 'voice' | 'announcement' | 'stage';
    private?: boolean;
  }[];
  roles: {
    name: string;
    color: string;
    permissions: string[];
  }[];
  categories: {
    name: string;
    channels: string[];
  }[];
}

const TEMPLATES: Template[] = [
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'Perfect for gaming communities with voice channels and LFG',
    icon: Gaming,
    color: 'from-red-500 to-orange-500',
    categories: [
      {
        name: 'Welcome',
        channels: ['welcome', 'rules', 'announcements']
      },
      {
        name: 'General',
        channels: ['general-chat', 'memes', 'clips']
      },
      {
        name: 'Gaming',
        channels: ['lfg', 'game-chat', 'game-voice-1', 'game-voice-2', 'streaming']
      }
    ],
    channels: [
      { name: 'welcome', type: 'text', private: false },
      { name: 'rules', type: 'text', private: false },
      { name: 'announcements', type: 'announcement' },
      { name: 'general-chat', type: 'text' },
      { name: 'memes', type: 'text' },
      { name: 'clips', type: 'text' },
      { name: 'lfg', type: 'text' },
      { name: 'game-chat', type: 'text' },
      { name: 'game-voice-1', type: 'voice' },
      { name: 'game-voice-2', type: 'voice' },
      { name: 'streaming', type: 'voice' }
    ],
    roles: [
      { name: 'Admin', color: '#e74c3c', permissions: ['ADMINISTRATOR'] },
      { name: 'Moderator', color: '#3498db', permissions: ['MANAGE_MESSAGES', 'KICK_MEMBERS', 'BAN_MEMBERS'] },
      { name: 'VIP Gamer', color: '#9b59b6', permissions: ['PRIORITY_SPEAKER', 'STREAM'] },
      { name: 'Member', color: '#95a5a6', permissions: ['SEND_MESSAGES', 'CONNECT'] }
    ]
  },
  {
    id: 'study',
    name: 'Study Group',
    description: 'Organized study spaces with focus rooms and resources',
    icon: BookOpen,
    color: 'from-blue-500 to-cyan-500',
    categories: [
      {
        name: 'Info',
        channels: ['welcome', 'resources', 'announcements']
      },
      {
        name: 'Study Rooms',
        channels: ['quiet-study-1', 'quiet-study-2', 'group-study', 'break-room']
      },
      {
        name: 'Subjects',
        channels: ['math-help', 'science-help', 'literature', 'general-help']
      }
    ],
    channels: [
      { name: 'welcome', type: 'text' },
      { name: 'resources', type: 'text' },
      { name: 'announcements', type: 'announcement' },
      { name: 'quiet-study-1', type: 'voice' },
      { name: 'quiet-study-2', type: 'voice' },
      { name: 'group-study', type: 'voice' },
      { name: 'break-room', type: 'voice' },
      { name: 'math-help', type: 'text' },
      { name: 'science-help', type: 'text' },
      { name: 'literature', type: 'text' },
      { name: 'general-help', type: 'text' }
    ],
    roles: [
      { name: 'Teacher', color: '#2ecc71', permissions: ['ADMINISTRATOR'] },
      { name: 'Teaching Assistant', color: '#3498db', permissions: ['MANAGE_MESSAGES', 'MOVE_MEMBERS'] },
      { name: 'Student', color: '#95a5a6', permissions: ['SEND_MESSAGES', 'CONNECT'] }
    ]
  },
  {
    id: 'creators',
    name: 'Content Creators',
    description: 'For creators to collaborate, share work, and get feedback',
    icon: Palette,
    color: 'from-purple-500 to-pink-500',
    categories: [
      {
        name: 'Welcome',
        channels: ['welcome', 'introductions', 'announcements']
      },
      {
        name: 'Showcase',
        channels: ['artwork', 'videos', 'music', 'writing']
      },
      {
        name: 'Collaboration',
        channels: ['collab-finder', 'feedback', 'resources', 'voice-collab']
      }
    ],
    channels: [
      { name: 'welcome', type: 'text' },
      { name: 'introductions', type: 'text' },
      { name: 'announcements', type: 'announcement' },
      { name: 'artwork', type: 'text' },
      { name: 'videos', type: 'text' },
      { name: 'music', type: 'text' },
      { name: 'writing', type: 'text' },
      { name: 'collab-finder', type: 'text' },
      { name: 'feedback', type: 'text' },
      { name: 'resources', type: 'text' },
      { name: 'voice-collab', type: 'voice' }
    ],
    roles: [
      { name: 'Featured Creator', color: '#f39c12', permissions: ['PRIORITY_SPEAKER', 'STREAM'] },
      { name: 'Creator', color: '#9b59b6', permissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES'] },
      { name: 'Supporter', color: '#95a5a6', permissions: ['SEND_MESSAGES', 'READ_MESSAGES'] }
    ]
  },
  {
    id: 'community',
    name: 'Community',
    description: 'General community server with social channels',
    icon: Heart,
    color: 'from-green-500 to-emerald-500',
    categories: [
      {
        name: 'Welcome',
        channels: ['welcome', 'rules', 'roles', 'introductions']
      },
      {
        name: 'Social',
        channels: ['general', 'off-topic', 'memes', 'selfies']
      },
      {
        name: 'Activities',
        channels: ['events', 'games', 'movie-nights', 'voice-hangout']
      }
    ],
    channels: [
      { name: 'welcome', type: 'text' },
      { name: 'rules', type: 'text' },
      { name: 'roles', type: 'text' },
      { name: 'introductions', type: 'text' },
      { name: 'general', type: 'text' },
      { name: 'off-topic', type: 'text' },
      { name: 'memes', type: 'text' },
      { name: 'selfies', type: 'text' },
      { name: 'events', type: 'announcement' },
      { name: 'games', type: 'text' },
      { name: 'movie-nights', type: 'stage' },
      { name: 'voice-hangout', type: 'voice' }
    ],
    roles: [
      { name: 'Community Manager', color: '#e74c3c', permissions: ['ADMINISTRATOR'] },
      { name: 'Moderator', color: '#3498db', permissions: ['MANAGE_MESSAGES', 'KICK_MEMBERS'] },
      { name: 'Active Member', color: '#2ecc71', permissions: ['SEND_MESSAGES', 'ADD_REACTIONS'] },
      { name: 'Member', color: '#95a5a6', permissions: ['SEND_MESSAGES'] }
    ]
  },
  {
    id: 'work',
    name: 'Work Team',
    description: 'Professional workspace for teams and projects',
    icon: Briefcase,
    color: 'from-gray-600 to-gray-800',
    categories: [
      {
        name: 'General',
        channels: ['announcements', 'general', 'random']
      },
      {
        name: 'Departments',
        channels: ['engineering', 'design', 'marketing', 'sales']
      },
      {
        name: 'Meetings',
        channels: ['standup', 'meeting-room-1', 'meeting-room-2']
      }
    ],
    channels: [
      { name: 'announcements', type: 'announcement' },
      { name: 'general', type: 'text' },
      { name: 'random', type: 'text' },
      { name: 'engineering', type: 'text', private: true },
      { name: 'design', type: 'text', private: true },
      { name: 'marketing', type: 'text', private: true },
      { name: 'sales', type: 'text', private: true },
      { name: 'standup', type: 'voice' },
      { name: 'meeting-room-1', type: 'voice', private: true },
      { name: 'meeting-room-2', type: 'voice', private: true }
    ],
    roles: [
      { name: 'CEO', color: '#e74c3c', permissions: ['ADMINISTRATOR'] },
      { name: 'Manager', color: '#f39c12', permissions: ['MANAGE_CHANNELS', 'MANAGE_MESSAGES'] },
      { name: 'Employee', color: '#3498db', permissions: ['SEND_MESSAGES', 'CONNECT'] },
      { name: 'Intern', color: '#95a5a6', permissions: ['READ_MESSAGES'] }
    ]
  }
];

interface ServerTemplatesProps {
  onSelectTemplate?: (template: Template) => void;
  isModal?: boolean;
}

export const ServerTemplates: React.FC<ServerTemplatesProps> = ({ onSelectTemplate, isModal = false }) => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [creatingServer, setCreatingServer] = useState(false);
  const [serverName, setServerName] = useState('');

  const handleCreateServer = async (template: Template) => {
    if (!serverName.trim()) return;

    setCreatingServer(true);
    try {
      const response = await api.post('/guilds', {
        name: serverName,
        template_id: template.id,
        channels: template.channels,
        roles: template.roles,
        categories: template.categories
      });
      
      navigate(`/app/servers/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create server:', error);
    } finally {
      setCreatingServer(false);
    }
  };

  const renderTemplate = (template: Template) => {
    const Icon = template.icon;
    return (
      <div
        key={template.id}
        onClick={() => {
          setSelectedTemplate(template);
          setServerName(`${template.name} Server`);
          if (onSelectTemplate) {
            onSelectTemplate(template);
          }
        }}
        className={`p-6 bg-gray-800/50 backdrop-blur-sm border rounded-xl cursor-pointer transition-all hover:scale-[1.02] group ${
          selectedTemplate?.id === template.id
            ? 'border-purple-500 shadow-lg shadow-purple-500/20'
            : 'border-gray-700 hover:border-purple-500/50'
        }`}
      >
        {/* Icon */}
        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${template.color} p-4 mb-4 group-hover:scale-110 transition-transform`}>
          <Icon className="w-full h-full text-white" />
        </div>

        {/* Info */}
        <h3 className="text-lg font-semibold text-white mb-2">{template.name}</h3>
        <p className="text-sm text-gray-400 mb-4">{template.description}</p>

        {/* Preview */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500 font-medium mb-1">CHANNELS PREVIEW</div>
          <div className="space-y-1">
            {template.channels.slice(0, 4).map((channel, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                {channel.type === 'voice' ? (
                  <Volume2 className="w-3 h-3" />
                ) : channel.type === 'announcement' ? (
                  <MessageSquare className="w-3 h-3" />
                ) : channel.private ? (
                  <Lock className="w-3 h-3" />
                ) : (
                  <Hash className="w-3 h-3" />
                )}
                <span>{channel.name}</span>
              </div>
            ))}
            {template.channels.length > 4 && (
              <div className="text-xs text-gray-500">
                +{template.channels.length - 4} more channels
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const containerClass = isModal
    ? "grid grid-cols-2 lg:grid-cols-3 gap-4"
    : "min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900 p-8";

  const content = (
    <>
      {!isModal && (
        <div className="max-w-7xl mx-auto mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Create Your Server</h1>
          <p className="text-gray-400">
            Start with a template or create your own custom server from scratch
          </p>
        </div>
      )}

      <div className={isModal ? containerClass : "max-w-7xl mx-auto"}>
        {!isModal && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {TEMPLATES.map(renderTemplate)}
          </div>
        )}
        {isModal && TEMPLATES.map(renderTemplate)}
      </div>

      {selectedTemplate && !isModal && (
        <div className="max-w-7xl mx-auto mt-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Customize Your Server
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Server Name
              </label>
              <input
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="Enter server name..."
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={() => handleCreateServer(selectedTemplate)}
              disabled={!serverName.trim() || creatingServer}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingServer ? 'Creating...' : 'Create Server'}
            </button>
          </div>
        </div>
      )}
    </>
  );

  return isModal ? content : <div className={containerClass}>{content}</div>;
};

export default ServerTemplates;
