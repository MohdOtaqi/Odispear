import React, { useState, useEffect } from 'react';
import { Shield, Crown, Users, Eye, EyeOff, Mic, MicOff, Volume2, MessageSquare, FileText, Link2, Image, Video, Calendar, Settings, UserPlus, UserMinus, Ban, Clock, Hash, Lock, Trash2, Edit, Save, X, Plus, ChevronDown, ChevronUp, Move } from 'lucide-react';
import api from '../lib/api';
import { useGuildStore } from '../store/guildStore';

// Discord permission flags (bitwise)
const PERMISSIONS = {
  CREATE_INSTANT_INVITE: 0x1,
  KICK_MEMBERS: 0x2,
  BAN_MEMBERS: 0x4,
  ADMINISTRATOR: 0x8,
  MANAGE_CHANNELS: 0x10,
  MANAGE_GUILD: 0x20,
  ADD_REACTIONS: 0x40,
  VIEW_AUDIT_LOG: 0x80,
  PRIORITY_SPEAKER: 0x100,
  STREAM: 0x200,
  VIEW_CHANNEL: 0x400,
  SEND_MESSAGES: 0x800,
  SEND_TTS_MESSAGES: 0x1000,
  MANAGE_MESSAGES: 0x2000,
  EMBED_LINKS: 0x4000,
  ATTACH_FILES: 0x8000,
  READ_MESSAGE_HISTORY: 0x10000,
  MENTION_EVERYONE: 0x20000,
  USE_EXTERNAL_EMOJIS: 0x40000,
  VIEW_GUILD_INSIGHTS: 0x80000,
  CONNECT: 0x100000,
  SPEAK: 0x200000,
  MUTE_MEMBERS: 0x400000,
  DEAFEN_MEMBERS: 0x800000,
  MOVE_MEMBERS: 0x1000000,
  USE_VAD: 0x2000000,
  CHANGE_NICKNAME: 0x4000000,
  MANAGE_NICKNAMES: 0x8000000,
  MANAGE_ROLES: 0x10000000,
  MANAGE_WEBHOOKS: 0x20000000,
  MANAGE_EMOJIS_AND_STICKERS: 0x40000000,
  USE_SLASH_COMMANDS: 0x80000000,
  REQUEST_TO_SPEAK: 0x100000000,
  MANAGE_EVENTS: 0x200000000,
  MANAGE_THREADS: 0x400000000,
  CREATE_PUBLIC_THREADS: 0x800000000,
  CREATE_PRIVATE_THREADS: 0x1000000000,
  USE_EXTERNAL_STICKERS: 0x2000000000,
  SEND_MESSAGES_IN_THREADS: 0x4000000000,
  START_EMBEDDED_ACTIVITIES: 0x8000000000,
  MODERATE_MEMBERS: 0x10000000000
};

const PERMISSION_GROUPS = {
  'General Permissions': [
    { name: 'View Channels', flag: PERMISSIONS.VIEW_CHANNEL, icon: Eye, description: 'Allows members to view channels' },
    { name: 'Manage Channels', flag: PERMISSIONS.MANAGE_CHANNELS, icon: Settings, description: 'Allows members to create, edit, and delete channels' },
    { name: 'Manage Roles', flag: PERMISSIONS.MANAGE_ROLES, icon: Shield, description: 'Allows members to create, edit, and delete roles' },
    { name: 'Manage Emojis & Stickers', flag: PERMISSIONS.MANAGE_EMOJIS_AND_STICKERS, icon: Image, description: 'Allows members to manage emojis and stickers' },
    { name: 'View Audit Log', flag: PERMISSIONS.VIEW_AUDIT_LOG, icon: FileText, description: 'Allows members to view audit logs' },
    { name: 'View Server Insights', flag: PERMISSIONS.VIEW_GUILD_INSIGHTS, icon: Eye, description: 'Allows members to view server insights' },
    { name: 'Manage Webhooks', flag: PERMISSIONS.MANAGE_WEBHOOKS, icon: Link2, description: 'Allows members to manage webhooks' },
    { name: 'Manage Server', flag: PERMISSIONS.MANAGE_GUILD, icon: Settings, description: 'Allows members to edit server settings' }
  ],
  'Membership Permissions': [
    { name: 'Create Invite', flag: PERMISSIONS.CREATE_INSTANT_INVITE, icon: UserPlus, description: 'Allows members to invite new people' },
    { name: 'Change Nickname', flag: PERMISSIONS.CHANGE_NICKNAME, icon: Edit, description: 'Allows members to change their nickname' },
    { name: 'Manage Nicknames', flag: PERMISSIONS.MANAGE_NICKNAMES, icon: Edit, description: 'Allows members to change other members nicknames' },
    { name: 'Kick Members', flag: PERMISSIONS.KICK_MEMBERS, icon: UserMinus, description: 'Allows members to kick other members' },
    { name: 'Ban Members', flag: PERMISSIONS.BAN_MEMBERS, icon: Ban, description: 'Allows members to ban other members' },
    { name: 'Moderate Members', flag: PERMISSIONS.MODERATE_MEMBERS, icon: Clock, description: 'Allows members to timeout other members' }
  ],
  'Text Channel Permissions': [
    { name: 'Send Messages', flag: PERMISSIONS.SEND_MESSAGES, icon: MessageSquare, description: 'Allows members to send messages' },
    { name: 'Send Messages in Threads', flag: PERMISSIONS.SEND_MESSAGES_IN_THREADS, icon: MessageSquare, description: 'Allows members to send messages in threads' },
    { name: 'Create Public Threads', flag: PERMISSIONS.CREATE_PUBLIC_THREADS, icon: Hash, description: 'Allows members to create public threads' },
    { name: 'Create Private Threads', flag: PERMISSIONS.CREATE_PRIVATE_THREADS, icon: Lock, description: 'Allows members to create private threads' },
    { name: 'Embed Links', flag: PERMISSIONS.EMBED_LINKS, icon: Link2, description: 'Links sent will auto-embed' },
    { name: 'Attach Files', flag: PERMISSIONS.ATTACH_FILES, icon: Image, description: 'Allows members to upload files' },
    { name: 'Add Reactions', flag: PERMISSIONS.ADD_REACTIONS, icon: MessageSquare, description: 'Allows members to add reactions' },
    { name: 'Use External Emojis', flag: PERMISSIONS.USE_EXTERNAL_EMOJIS, icon: Image, description: 'Allows members to use emojis from other servers' },
    { name: 'Use External Stickers', flag: PERMISSIONS.USE_EXTERNAL_STICKERS, icon: Image, description: 'Allows members to use stickers from other servers' },
    { name: 'Mention Everyone', flag: PERMISSIONS.MENTION_EVERYONE, icon: Users, description: 'Allows members to use @everyone' },
    { name: 'Manage Messages', flag: PERMISSIONS.MANAGE_MESSAGES, icon: MessageSquare, description: 'Allows members to delete messages' },
    { name: 'Manage Threads', flag: PERMISSIONS.MANAGE_THREADS, icon: Hash, description: 'Allows members to manage threads' },
    { name: 'Read Message History', flag: PERMISSIONS.READ_MESSAGE_HISTORY, icon: Clock, description: 'Allows members to read message history' },
    { name: 'Send TTS Messages', flag: PERMISSIONS.SEND_TTS_MESSAGES, icon: Volume2, description: 'Allows members to send text-to-speech messages' },
    { name: 'Use Slash Commands', flag: PERMISSIONS.USE_SLASH_COMMANDS, icon: MessageSquare, description: 'Allows members to use slash commands' }
  ],
  'Voice Channel Permissions': [
    { name: 'Connect', flag: PERMISSIONS.CONNECT, icon: Mic, description: 'Allows members to connect to voice channels' },
    { name: 'Speak', flag: PERMISSIONS.SPEAK, icon: Mic, description: 'Allows members to speak in voice channels' },
    { name: 'Video', flag: PERMISSIONS.STREAM, icon: Video, description: 'Allows members to share video' },
    { name: 'Mute Members', flag: PERMISSIONS.MUTE_MEMBERS, icon: MicOff, description: 'Allows members to mute other members' },
    { name: 'Deafen Members', flag: PERMISSIONS.DEAFEN_MEMBERS, icon: Volume2, description: 'Allows members to deafen other members' },
    { name: 'Move Members', flag: PERMISSIONS.MOVE_MEMBERS, icon: Move, description: 'Allows members to move other members between voice channels' },
    { name: 'Use Voice Activity', flag: PERMISSIONS.USE_VAD, icon: Mic, description: 'Allows members to use voice activity detection' },
    { name: 'Priority Speaker', flag: PERMISSIONS.PRIORITY_SPEAKER, icon: Crown, description: 'Allows members to be a priority speaker' },
    { name: 'Request to Speak', flag: PERMISSIONS.REQUEST_TO_SPEAK, icon: Mic, description: 'Allows members to request to speak in stage channels' },
    { name: 'Start Activities', flag: PERMISSIONS.START_EMBEDDED_ACTIVITIES, icon: Calendar, description: 'Allows members to start activities' }
  ],
  'Events Permissions': [
    { name: 'Manage Events', flag: PERMISSIONS.MANAGE_EVENTS, icon: Calendar, description: 'Allows members to create and manage events' }
  ],
  'Advanced Permissions': [
    { name: 'Administrator', flag: PERMISSIONS.ADMINISTRATOR, icon: Crown, description: 'Grants all permissions and bypasses channel overrides' }
  ]
};

interface Role {
  id: string;
  name: string;
  color: string;
  position: number;
  permissions: number;
  mentionable: boolean;
  hoist: boolean;
  icon?: string;
  unicode_emoji?: string;
  managed: boolean;
  tags?: {
    bot_id?: string;
    integration_id?: string;
    premium_subscriber?: boolean;
  };
}

interface RolePermissionsManagerProps {
  guildId: string;
  onClose?: () => void;
}

export const RolePermissionsManager: React.FC<RolePermissionsManagerProps> = ({ guildId, onClose }) => {
  const { selectedGuild } = useGuildStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [creatingRole, setCreatingRole] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['General Permissions']));

  useEffect(() => {
    fetchRoles();
  }, [guildId]);

  const fetchRoles = async () => {
    try {
      const response = await api.get(`/guilds/${guildId}/roles`);
      setRoles(response.data.sort((a: Role, b: Role) => b.position - a.position));
      if (response.data.length > 0) {
        setSelectedRole(response.data[0]);
      }
    } catch (error) {
      // Mock data
      const mockRoles: Role[] = [
        {
          id: '1',
          name: '@everyone',
          color: '#95a5a6',
          position: 0,
          permissions: PERMISSIONS.VIEW_CHANNEL | PERMISSIONS.SEND_MESSAGES | PERMISSIONS.CONNECT | PERMISSIONS.SPEAK,
          mentionable: false,
          hoist: false,
          managed: false
        },
        {
          id: '2',
          name: 'Admin',
          color: '#e74c3c',
          position: 10,
          permissions: PERMISSIONS.ADMINISTRATOR,
          mentionable: true,
          hoist: true,
          managed: false
        },
        {
          id: '3',
          name: 'Moderator',
          color: '#3498db',
          position: 8,
          permissions: PERMISSIONS.KICK_MEMBERS | PERMISSIONS.BAN_MEMBERS | PERMISSIONS.MANAGE_MESSAGES | PERMISSIONS.MUTE_MEMBERS | PERMISSIONS.MOVE_MEMBERS,
          mentionable: true,
          hoist: true,
          managed: false
        },
        {
          id: '4',
          name: 'Member',
          color: '#2ecc71',
          position: 5,
          permissions: PERMISSIONS.VIEW_CHANNEL | PERMISSIONS.SEND_MESSAGES | PERMISSIONS.CONNECT | PERMISSIONS.SPEAK | PERMISSIONS.ADD_REACTIONS,
          mentionable: false,
          hoist: false,
          managed: false
        }
      ];
      setRoles(mockRoles);
      setSelectedRole(mockRoles[0]);
    }
  };

  const hasPermission = (role: Role, permission: number): boolean => {
    return (role.permissions & PERMISSIONS.ADMINISTRATOR) === PERMISSIONS.ADMINISTRATOR || 
           (role.permissions & permission) === permission;
  };

  const togglePermission = (permission: number) => {
    if (!editingRole) return;
    
    const newPermissions = hasPermission(editingRole, permission)
      ? editingRole.permissions & ~permission
      : editingRole.permissions | permission;
    
    setEditingRole({ ...editingRole, permissions: newPermissions });
  };

  const saveRole = async () => {
    if (!editingRole) return;
    
    try {
      if (creatingRole) {
        const response = await api.post(`/guilds/${guildId}/roles`, editingRole);
        setRoles([...roles, response.data].sort((a, b) => b.position - a.position));
        setSelectedRole(response.data);
      } else {
        await api.patch(`/guilds/${guildId}/roles/${editingRole.id}`, editingRole);
        setRoles(roles.map(r => r.id === editingRole.id ? editingRole : r));
        setSelectedRole(editingRole);
      }
      setEditingRole(null);
      setCreatingRole(false);
    } catch (error) {
      console.error('Failed to save role:', error);
    }
  };

  const deleteRole = async (roleId: string) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await api.delete(`/guilds/${guildId}/roles/${roleId}`);
        setRoles(roles.filter(r => r.id !== roleId));
        if (selectedRole?.id === roleId) {
          setSelectedRole(roles[0]);
        }
      } catch (error) {
        console.error('Failed to delete role:', error);
      }
    }
  };

  const createNewRole = () => {
    const newRole: Role = {
      id: 'new',
      name: 'New Role',
      color: '#95a5a6',
      position: 1,
      permissions: PERMISSIONS.VIEW_CHANNEL | PERMISSIONS.SEND_MESSAGES,
      mentionable: false,
      hoist: false,
      managed: false
    };
    setEditingRole(newRole);
    setCreatingRole(true);
  };

  const moveRole = async (roleId: string, direction: 'up' | 'down') => {
    const roleIndex = roles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) return;
    
    const newRoles = [...roles];
    if (direction === 'up' && roleIndex > 0) {
      [newRoles[roleIndex - 1], newRoles[roleIndex]] = [newRoles[roleIndex], newRoles[roleIndex - 1]];
    } else if (direction === 'down' && roleIndex < roles.length - 1) {
      [newRoles[roleIndex], newRoles[roleIndex + 1]] = [newRoles[roleIndex + 1], newRoles[roleIndex]];
    }
    
    // Update positions
    newRoles.forEach((role, idx) => {
      role.position = newRoles.length - idx;
    });
    
    setRoles(newRoles);
    
    try {
      await api.patch(`/guilds/${guildId}/roles/positions`, {
        roles: newRoles.map(r => ({ id: r.id, position: r.position }))
      });
    } catch (error) {
      console.error('Failed to update role positions:', error);
    }
  };

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <div className="flex h-full">
      {/* Roles List */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Server Roles</h3>
          <button
            onClick={createNewRole}
            className="p-1.5 bg-purple-600 rounded hover:bg-purple-700 transition-colors"
            title="Create Role"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>
        
        <div className="space-y-2">
          {roles.map((role, idx) => (
            <div
              key={role.id}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                selectedRole?.id === role.id
                  ? 'bg-gray-800 border border-purple-500'
                  : 'hover:bg-gray-800 border border-transparent'
              }`}
              onClick={() => {
                setSelectedRole(role);
                setEditingRole(null);
                setCreatingRole(false);
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: role.color }}
                />
                <span className="text-sm text-gray-300">{role.name}</span>
                {role.tags?.premium_subscriber && (
                  <Crown className="w-3 h-3 text-purple-400" />
                )}
                {role.tags?.bot_id && (
                  <Shield className="w-3 h-3 text-blue-400" />
                )}
              </div>
              
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                {idx > 0 && !role.managed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveRole(role.id, 'up');
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                    title="Move Up"
                  >
                    <ChevronUp className="w-3 h-3 text-gray-400" />
                  </button>
                )}
                {idx < roles.length - 1 && !role.managed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveRole(role.id, 'down');
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                    title="Move Down"
                  >
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>
                )}
                {!role.managed && role.name !== '@everyone' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRole(role.id);
                    }}
                    className="p-1 hover:bg-red-900/50 rounded"
                    title="Delete Role"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Settings */}
      {(selectedRole || editingRole) && (
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {editingRole ? (creatingRole ? 'Create Role' : 'Edit Role') : 'Role Settings'}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {editingRole ? 'Configure role settings and permissions' : 'View role settings and permissions'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {!editingRole && !selectedRole?.managed && selectedRole?.name !== '@everyone' && (
                <button
                  onClick={() => setEditingRole(selectedRole)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Role
                </button>
              )}
              {editingRole && (
                <>
                  <button
                    onClick={() => {
                      setEditingRole(null);
                      setCreatingRole(false);
                    }}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveRole}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Basic Settings */}
          <div className="mb-6 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Basic Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Role Name</label>
                <input
                  type="text"
                  value={editingRole?.name || selectedRole?.name || ''}
                  onChange={(e) => editingRole && setEditingRole({ ...editingRole, name: e.target.value })}
                  disabled={!editingRole || editingRole.name === '@everyone'}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Role Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={(editingRole?.color || selectedRole?.color || '#95a5a6').startsWith('#') ? (editingRole?.color || selectedRole?.color || '#95a5a6') : '#95a5a6'}
                    onChange={(e) => editingRole && setEditingRole({ ...editingRole, color: e.target.value })}
                    disabled={!editingRole}
                    className="h-10 w-20 bg-gray-900 border border-gray-700 rounded cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={editingRole?.color || selectedRole?.color || '#95a5a6'}
                    onChange={(e) => editingRole && setEditingRole({ ...editingRole, color: e.target.value })}
                    disabled={!editingRole}
                    className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingRole?.hoist ?? selectedRole?.hoist ?? false}
                  onChange={(e) => editingRole && setEditingRole({ ...editingRole, hoist: e.target.checked })}
                  disabled={!editingRole}
                  className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                />
                <span className="text-sm text-gray-300">Display role members separately</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingRole?.mentionable ?? selectedRole?.mentionable ?? false}
                  onChange={(e) => editingRole && setEditingRole({ ...editingRole, mentionable: e.target.checked })}
                  disabled={!editingRole}
                  className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                />
                <span className="text-sm text-gray-300">Allow anyone to @mention this role</span>
              </label>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Permissions</h3>
            
            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
              {Object.entries(PERMISSION_GROUPS).map(([groupName, permissions]) => (
                <div key={groupName} className="border border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleGroup(groupName)}
                    className="w-full px-4 py-3 bg-gray-900/50 flex items-center justify-between hover:bg-gray-900 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-300">{groupName}</span>
                    {expandedGroups.has(groupName) ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedGroups.has(groupName) && (
                    <div className="p-4 space-y-3">
                      {permissions.map((perm) => {
                        const Icon = perm.icon;
                        const isEnabled = hasPermission(editingRole || selectedRole!, perm.flag);
                        const isAdmin = hasPermission(editingRole || selectedRole!, PERMISSIONS.ADMINISTRATOR);
                        
                        return (
                          <label
                            key={perm.name}
                            className={`flex items-start gap-3 cursor-pointer ${
                              (!editingRole || isAdmin) ? 'opacity-75' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={() => togglePermission(perm.flag)}
                              disabled={!editingRole || isAdmin}
                              className="mt-1 w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-300">{perm.name}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{perm.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolePermissionsManager;
