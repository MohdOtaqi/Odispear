import React, { useState, useCallback, useEffect } from 'react';
import { 
  X, Settings, Shield, Users, Hash, Volume2, Trash2, 
  Edit2, Plus, ChevronRight, Save, Ban, Crown, 
  FileText, Bell, Lock, Globe, Palette, Sparkles 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Switch } from '../ui/Switch';
import { Tabs } from '../ui/Tabs';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useGuildStore } from '../../store/guildStore';

interface ServerSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  guildId: string;
}

interface Role {
  id: string;
  name: string;
  color: string;
  position: number;
  permissions: number;
  mentionable: boolean;
  hoisted: boolean;
}

interface ChannelPermission {
  role_id: string;
  allow: bigint;
  deny: bigint;
}

// Permission bits matching backend
const Permission = {
  VIEW_CHANNEL: 1 << 0,
  SEND_MESSAGES: 1 << 1,
  MANAGE_MESSAGES: 1 << 2,
  MANAGE_CHANNELS: 1 << 3,
  MANAGE_GUILD: 1 << 4,
  KICK_MEMBERS: 1 << 5,
  BAN_MEMBERS: 1 << 6,
  MANAGE_ROLES: 1 << 7,
  MANAGE_WEBHOOKS: 1 << 8,
  CONNECT_VOICE: 1 << 9,
  SPEAK_VOICE: 1 << 10,
  MUTE_MEMBERS: 1 << 11,
  MANAGE_EVENTS: 1 << 12,
  ADMINISTRATOR: 1 << 13,
} as const;

const PERMISSION_LABELS: Record<number, { name: string; description: string; category: string }> = {
  [Permission.VIEW_CHANNEL]: { name: 'View Channels', description: 'Allows viewing text and voice channels', category: 'General' },
  [Permission.SEND_MESSAGES]: { name: 'Send Messages', description: 'Allows sending messages in text channels', category: 'Text' },
  [Permission.MANAGE_MESSAGES]: { name: 'Manage Messages', description: 'Allows deleting messages from others', category: 'Text' },
  [Permission.MANAGE_CHANNELS]: { name: 'Manage Channels', description: 'Allows creating, editing, and deleting channels', category: 'Server' },
  [Permission.MANAGE_GUILD]: { name: 'Manage Server', description: 'Allows editing server settings', category: 'Server' },
  [Permission.KICK_MEMBERS]: { name: 'Kick Members', description: 'Allows kicking members from the server', category: 'Moderation' },
  [Permission.BAN_MEMBERS]: { name: 'Ban Members', description: 'Allows banning members from the server', category: 'Moderation' },
  [Permission.MANAGE_ROLES]: { name: 'Manage Roles', description: 'Allows creating, editing, and assigning roles', category: 'Server' },
  [Permission.MANAGE_WEBHOOKS]: { name: 'Manage Webhooks', description: 'Allows creating and managing webhooks', category: 'Server' },
  [Permission.CONNECT_VOICE]: { name: 'Connect to Voice', description: 'Allows connecting to voice channels', category: 'Voice' },
  [Permission.SPEAK_VOICE]: { name: 'Speak in Voice', description: 'Allows speaking in voice channels', category: 'Voice' },
  [Permission.MUTE_MEMBERS]: { name: 'Mute Members', description: 'Allows muting other members in voice', category: 'Moderation' },
  [Permission.MANAGE_EVENTS]: { name: 'Manage Events', description: 'Allows creating and managing events', category: 'Server' },
  [Permission.ADMINISTRATOR]: { name: 'Administrator', description: 'Full access to all server permissions', category: 'Dangerous' },
};

export const ServerSettings: React.FC<ServerSettingsProps> = ({ isOpen, onClose, guildId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#5865F2');
  const [newRolePermissions, setNewRolePermissions] = useState(Permission.VIEW_CHANNEL | Permission.SEND_MESSAGES | Permission.CONNECT_VOICE | Permission.SPEAK_VOICE);
  const [showCreateRole, setShowCreateRole] = useState(false);
  
  const { currentGuild, updateGuild, deleteGuild } = useGuildStore();

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      const { data } = await api.get(`/guilds/${guildId}/roles`);
      setRoles(data);
      if (data.length > 0 && !selectedRole) {
        setSelectedRole(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  }, [guildId, selectedRole]);

  // Create new role
  const createRole = useCallback(async () => {
    if (!newRoleName.trim()) return;
    
    setLoading(true);
    try {
      const { data } = await api.post(`/guilds/${guildId}/roles`, {
        name: newRoleName,
        color: newRoleColor,
        permissions: newRolePermissions,
        mentionable: true,
        hoisted: false
      });
      setRoles(prev => [...prev, data]);
      setNewRoleName('');
      setShowCreateRole(false);
      toast.success('Role created successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create role');
    } finally {
      setLoading(false);
    }
  }, [guildId, newRoleName, newRoleColor]);

  // Update role
  const updateRole = useCallback(async (roleId: string, updates: Partial<Role>) => {
    setLoading(true);
    try {
      const { data } = await api.patch(`/guilds/${guildId}/roles/${roleId}`, updates);
      setRoles(prev => prev.map(r => r.id === roleId ? data : r));
      if (selectedRole?.id === roleId) {
        setSelectedRole(data);
      }
      toast.success('Role updated');
    } catch (error: any) {
      toast.error('Failed to update role');
    } finally {
      setLoading(false);
    }
  }, [guildId, selectedRole]);

  // Delete role
  const deleteRole = useCallback(async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    setLoading(true);
    try {
      await api.delete(`/guilds/${guildId}/roles/${roleId}`);
      setRoles(prev => prev.filter(r => r.id !== roleId));
      if (selectedRole?.id === roleId) {
        setSelectedRole(roles[0] || null);
      }
      toast.success('Role deleted');
    } catch (error: any) {
      toast.error('Failed to delete role');
    } finally {
      setLoading(false);
    }
  }, [guildId, roles, selectedRole]);

  // Update server settings
  const updateServerSettings = useCallback(async (updates: any) => {
    setLoading(true);
    try {
      await api.patch(`/guilds/${guildId}`, updates);
      updateGuild(guildId, updates);
      toast.success('Settings updated');
    } catch (error: any) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  }, [guildId, updateGuild]);

  // Delete server
  const handleDeleteServer = useCallback(async () => {
    if (!confirm('Are you sure? This action cannot be undone!')) return;
    
    const serverName = prompt('Please type the server name to confirm deletion:');
    if (serverName !== currentGuild?.name) {
      toast.error('Server name does not match');
      return;
    }
    
    setLoading(true);
    try {
      await api.delete(`/guilds/${guildId}`);
      deleteGuild(guildId);
      onClose();
      toast.success('Server deleted');
    } catch (error: any) {
      toast.error('Failed to delete server');
    } finally {
      setLoading(false);
    }
  }, [guildId, currentGuild, deleteGuild, onClose]);

  useEffect(() => {
    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen, fetchRoles]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Settings },
    { id: 'roles', label: 'Roles', icon: Shield },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'channels', label: 'Channels', icon: Hash },
    { id: 'moderation', label: 'Moderation', icon: Ban },
    { id: 'widgets', label: 'Widgets', icon: Sparkles },
  ];

  return (
    <div className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-7xl mx-auto flex bg-[#2b2d31] rounded-xl m-4 shadow-2xl animate-scale-in overflow-hidden">
        {/* Sidebar */}
        <div className="w-60 bg-[#1e1f22] p-4 border-r border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Server Settings</h2>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white/10 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
                {activeTab === tab.id && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t border-white/10">
            <button
              onClick={handleDeleteServer}
              className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">Delete Server</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="p-8 space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Server Overview</h3>
                <p className="text-gray-400">Manage your server's basic settings</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Server Name
                  </label>
                  <Input
                    defaultValue={currentGuild?.name}
                    onBlur={(e) => updateServerSettings({ name: e.target.value })}
                    placeholder="Enter server name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Server Description
                  </label>
                  <Input
                    defaultValue={currentGuild?.description}
                    onBlur={(e) => updateServerSettings({ description: e.target.value })}
                    placeholder="What's your server about?"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Verification Level
                  </label>
                  <select
                    className="w-full h-11 px-4 bg-[#1e1f22] border border-white/10 rounded-lg text-white"
                    defaultValue={currentGuild?.verification_level || 0}
                    onChange={(e) => updateServerSettings({ verification_level: parseInt(e.target.value) })}
                  >
                    <option value={0}>None - No restrictions</option>
                    <option value={1}>Low - Must have verified email</option>
                    <option value={2}>Medium - Must be registered for 5 minutes</option>
                    <option value={3}>High - Must be member for 10 minutes</option>
                    <option value={4}>Very High - Must have verified phone</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Features</h4>
                
                <label className="flex items-center gap-3 p-4 bg-[#1e1f22] rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                  <Switch />
                  <div className="flex-1">
                    <div className="font-medium text-white">Community Server</div>
                    <div className="text-sm text-gray-400">Enable community features</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 bg-[#1e1f22] rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                  <Switch />
                  <div className="flex-1">
                    <div className="font-medium text-white">Discovery</div>
                    <div className="text-sm text-gray-400">Make server discoverable</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Roles</h3>
                  <p className="text-gray-400">Create and manage server roles</p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => setShowCreateRole(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Role
                </Button>
              </div>

              {showCreateRole && (
                <div className="mb-6 p-4 bg-[#1e1f22] rounded-lg space-y-4">
                  <div className="flex gap-4">
                    <Input
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="Role name"
                      className="flex-1"
                    />
                    <input
                      type="color"
                      value={newRoleColor}
                      onChange={(e) => setNewRoleColor(e.target.value)}
                      className="w-12 h-11 rounded-lg border border-white/10 cursor-pointer"
                    />
                    <Button variant="primary" onClick={createRole} loading={loading}>
                      Create
                    </Button>
                    <Button variant="secondary" onClick={() => setShowCreateRole(false)}>
                      Cancel
                    </Button>
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <h5 className="text-sm font-semibold text-gray-400 mb-3">Permissions</h5>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {Object.entries(PERMISSION_LABELS).map(([perm, { name }]) => (
                        <label key={perm} className="flex items-center gap-2 p-2 rounded hover:bg-white/5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(newRolePermissions & Number(perm)) !== 0}
                            onChange={() => setNewRolePermissions(prev => (prev & Number(perm)) ? prev & ~Number(perm) : prev | Number(perm))}
                            className="w-4 h-4 rounded border-gray-600 text-mot-gold focus:ring-mot-gold"
                          />
                          <span className="text-sm text-gray-300">{name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-6">
                {/* Role List */}
                <div className="col-span-1 space-y-2">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        selectedRole?.id === role.id
                          ? 'bg-white/10 text-white'
                          : 'bg-[#1e1f22] text-gray-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                      <span className="flex-1 text-left font-medium">{role.name}</span>
                      {role.name === '@everyone' && (
                        <Globe className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Role Settings */}
                {selectedRole && (
                  <div className="col-span-2 space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-4">
                        Edit Role - {selectedRole.name}
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Role Name
                          </label>
                          <Input
                            defaultValue={selectedRole.name}
                            onBlur={(e) => updateRole(selectedRole.id, { name: e.target.value })}
                            disabled={selectedRole.name === '@everyone'}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Role Color
                          </label>
                          <div className="flex gap-4">
                            <input
                              type="color"
                              value={selectedRole.color && selectedRole.color.startsWith('#') ? selectedRole.color : '#99AAB5'}
                              onChange={(e) => updateRole(selectedRole.id, { color: e.target.value })}
                              className="w-12 h-11 rounded-lg border border-white/10 cursor-pointer"
                              disabled={selectedRole.name === '@everyone'}
                            />
                            <Input
                              value={selectedRole.color || '#99AAB5'}
                              onChange={(e) => updateRole(selectedRole.id, { color: e.target.value })}
                              placeholder="#5865F2"
                              className="w-32"
                              disabled={selectedRole.name === '@everyone'}
                            />
                          </div>
                        </div>

                        <label className="flex items-center gap-3 p-4 bg-[#1e1f22] rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                          <Switch
                            checked={selectedRole.hoisted}
                            onChange={(checked) => updateRole(selectedRole.id, { hoisted: checked })}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-white">Display Separately</div>
                            <div className="text-sm text-gray-400">Show members with this role separately</div>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-4 bg-[#1e1f22] rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                          <Switch
                            checked={selectedRole.mentionable}
                            onChange={(checked) => updateRole(selectedRole.id, { mentionable: checked })}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-white">Allow Mentions</div>
                            <div className="text-sm text-gray-400">Allow anyone to @mention this role</div>
                          </div>
                        </label>

                        {/* Permissions Section */}
                        <div className="mt-6">
                          <h5 className="text-sm font-semibold text-gray-400 uppercase mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Permissions
                          </h5>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(PERMISSION_LABELS).map(([perm, { name, description, category }]) => {
                              const permNum = Number(perm);
                              const rolePerms = Number(selectedRole.permissions) || 0;
                              const hasPermission = (rolePerms & permNum) !== 0;
                              const isDangerous = category === 'Dangerous';
                              
                              return (
                                <label
                                  key={perm}
                                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                    hasPermission
                                      ? isDangerous ? 'border-red-500/50 bg-red-500/10' : 'border-mot-gold/50 bg-mot-gold/10'
                                      : 'border-white/10 bg-[#1e1f22] hover:border-white/20'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={hasPermission}
                                    onChange={() => {
                                      const newPerms = hasPermission ? rolePerms & ~permNum : rolePerms | permNum;
                                      updateRole(selectedRole.id, { permissions: newPerms });
                                    }}
                                    className="w-4 h-4 mt-0.5 rounded border-gray-600 text-mot-gold focus:ring-mot-gold"
                                  />
                                  <div>
                                    <div className={`text-sm font-medium ${isDangerous ? 'text-red-400' : 'text-white'}`}>{name}</div>
                                    <div className="text-xs text-gray-400">{description}</div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {selectedRole.name !== '@everyone' && (
                        <div className="mt-6 pt-6 border-t border-white/10">
                          <Button
                            variant="danger"
                            onClick={() => deleteRole(selectedRole.id)}
                            className="flex items-center gap-2"
                            loading={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Role
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Channel Management</h3>
              <ChannelManager guildId={guildId} />
            </div>
          )}

          {activeTab === 'members' && (
            <div className="p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Member Management</h3>
              <MemberManager guildId={guildId} roles={roles} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Channel Manager Component
const ChannelManager: React.FC<{ guildId: string }> = ({ guildId }) => {
  const [channels, setChannels] = useState<any[]>([]);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'text' | 'voice'>('text');
  const [loading, setLoading] = useState(false);

  const fetchChannels = useCallback(async () => {
    try {
      const { data } = await api.get(`/guilds/${guildId}/channels`);
      setChannels(data);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    }
  }, [guildId]);

  const createChannel = useCallback(async () => {
    if (!newChannelName.trim()) return;

    setLoading(true);
    try {
      const { data } = await api.post(`/guilds/${guildId}/channels`, {
        name: newChannelName,
        type: newChannelType,
      });
      setChannels(prev => [...prev, data]);
      setNewChannelName('');
      toast.success('Channel created');
    } catch (error: any) {
      toast.error('Failed to create channel');
    } finally {
      setLoading(false);
    }
  }, [guildId, newChannelName, newChannelType]);

  const deleteChannel = useCallback(async (channelId: string) => {
    if (!confirm('Delete this channel?')) return;

    setLoading(true);
    try {
      await api.delete(`/channels/${channelId}`);
      setChannels(prev => prev.filter(c => c.id !== channelId));
      toast.success('Channel deleted');
    } catch (error) {
      toast.error('Failed to delete channel');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  return (
    <div className="space-y-6">
      {/* Create Channel */}
      <div className="p-4 bg-[#1e1f22] rounded-lg">
        <h4 className="text-lg font-semibold text-white mb-4">Create Channel</h4>
        <div className="flex gap-4">
          <Input
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            placeholder="Channel name"
            className="flex-1"
          />
          <select
            value={newChannelType}
            onChange={(e) => setNewChannelType(e.target.value as 'text' | 'voice')}
            className="h-11 px-4 bg-[#2b2d31] border border-white/10 rounded-lg text-white"
          >
            <option value="text">Text Channel</option>
            <option value="voice">Voice Channel</option>
          </select>
          <Button variant="primary" onClick={createChannel} loading={loading}>
            Create
          </Button>
        </div>
      </div>

      {/* Channel List */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">Channels</h4>
        <div className="space-y-2">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="flex items-center justify-between p-4 bg-[#1e1f22] rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                {channel.type === 'voice' ? (
                  <Volume2 className="w-5 h-5 text-gray-400" />
                ) : (
                  <Hash className="w-5 h-5 text-gray-400" />
                )}
                <span className="font-medium text-white">{channel.name}</span>
                <span className="text-sm text-gray-500">({channel.type})</span>
              </div>
              <button
                onClick={() => deleteChannel(channel.id)}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Member Manager Component
const MemberManager: React.FC<{ guildId: string; roles: Role[] }> = ({ guildId, roles }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      const { data } = await api.get(`/guilds/${guildId}/members`);
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  }, [guildId]);

  const assignRole = useCallback(async (memberId: string, roleId: string) => {
    setLoading(true);
    try {
      await api.post(`/guilds/${guildId}/members/${memberId}/roles/${roleId}`);
      toast.success('Role assigned');
      fetchMembers();
    } catch (error) {
      toast.error('Failed to assign role');
    } finally {
      setLoading(false);
    }
  }, [guildId, fetchMembers]);

  const kickMember = useCallback(async (memberId: string) => {
    if (!confirm('Kick this member?')) return;

    setLoading(true);
    try {
      await api.delete(`/guilds/${guildId}/members/${memberId}`);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast.success('Member kicked');
    } catch (error) {
      toast.error('Failed to kick member');
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-4 bg-[#1e1f22] rounded-lg"
        >
          <div className="flex items-center gap-3">
            <img
              src={member.avatar_url || `https://ui-avatars.com/api/?name=${member.username}`}
              alt={member.username}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <div className="font-medium text-white">{member.username}</div>
              <div className="text-sm text-gray-400">
                Joined {new Date(member.joined_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="h-9 px-3 bg-[#2b2d31] border border-white/10 rounded-lg text-white text-sm"
              onChange={(e) => assignRole(member.id, e.target.value)}
              disabled={loading}
            >
              <option value="">Assign Role</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
            <button
              onClick={() => kickMember(member.id)}
              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              disabled={loading}
            >
              <Ban className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServerSettings;
