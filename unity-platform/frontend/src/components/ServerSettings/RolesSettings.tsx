import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, Users, Lock, Eye, EyeOff, Crown } from 'lucide-react';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';
import api from '../../lib/api';

interface Role {
  id: string;
  name: string;
  color: string;
  position: number;
  permissions: string;
  mentionable: boolean;
  hoisted: boolean;
  member_count?: number;
}

interface RolesSettingsProps {
  guildId: string;
}

const PERMISSION_FLAGS = {
  ADMINISTRATOR: 0x1,
  MANAGE_GUILD: 0x2,
  MANAGE_ROLES: 0x4,
  MANAGE_CHANNELS: 0x8,
  KICK_MEMBERS: 0x10,
  BAN_MEMBERS: 0x20,
  CREATE_INVITES: 0x40,
  MANAGE_MESSAGES: 0x80,
  SEND_MESSAGES: 0x100,
  ATTACH_FILES: 0x200,
  MENTION_EVERYONE: 0x400,
  VIEW_CHANNELS: 0x800,
  CONNECT_VOICE: 0x1000,
  SPEAK_VOICE: 0x2000,
  MUTE_MEMBERS: 0x4000,
  DEAFEN_MEMBERS: 0x8000,
  MOVE_MEMBERS: 0x10000,
};

const PERMISSION_NAMES: Record<number, { name: string; description: string; dangerous?: boolean }> = {
  [PERMISSION_FLAGS.ADMINISTRATOR]: { name: 'Administrator', description: 'All permissions', dangerous: true },
  [PERMISSION_FLAGS.MANAGE_GUILD]: { name: 'Manage Server', description: 'Change server settings', dangerous: true },
  [PERMISSION_FLAGS.MANAGE_ROLES]: { name: 'Manage Roles', description: 'Create, edit, delete roles', dangerous: true },
  [PERMISSION_FLAGS.MANAGE_CHANNELS]: { name: 'Manage Channels', description: 'Create, edit, delete channels' },
  [PERMISSION_FLAGS.KICK_MEMBERS]: { name: 'Kick Members', description: 'Kick members from server', dangerous: true },
  [PERMISSION_FLAGS.BAN_MEMBERS]: { name: 'Ban Members', description: 'Ban members from server', dangerous: true },
  [PERMISSION_FLAGS.CREATE_INVITES]: { name: 'Create Invites', description: 'Create invitation links' },
  [PERMISSION_FLAGS.MANAGE_MESSAGES]: { name: 'Manage Messages', description: 'Delete and pin messages' },
  [PERMISSION_FLAGS.SEND_MESSAGES]: { name: 'Send Messages', description: 'Send messages in channels' },
  [PERMISSION_FLAGS.ATTACH_FILES]: { name: 'Attach Files', description: 'Upload files and media' },
  [PERMISSION_FLAGS.MENTION_EVERYONE]: { name: 'Mention @everyone', description: 'Mention all members' },
  [PERMISSION_FLAGS.VIEW_CHANNELS]: { name: 'View Channels', description: 'View channels' },
  [PERMISSION_FLAGS.CONNECT_VOICE]: { name: 'Connect to Voice', description: 'Join voice channels' },
  [PERMISSION_FLAGS.SPEAK_VOICE]: { name: 'Speak in Voice', description: 'Speak in voice channels' },
  [PERMISSION_FLAGS.MUTE_MEMBERS]: { name: 'Mute Members', description: 'Mute members in voice' },
  [PERMISSION_FLAGS.DEAFEN_MEMBERS]: { name: 'Deafen Members', description: 'Deafen members in voice' },
  [PERMISSION_FLAGS.MOVE_MEMBERS]: { name: 'Move Members', description: 'Move members between voice channels' },
};

const COLORS = [
  '#5865f2', '#57f287', '#fee75c', '#f23f43', '#eb459e',
  '#ed4245', '#f26522', '#f0b232', '#1abc9c', '#3498db',
  '#9b59b6', '#e91e63', '#ff9800', '#607d8b', '#795548'
];

export const RolesSettings: React.FC<RolesSettingsProps> = ({ guildId }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  useEffect(() => {
    fetchRoles();
  }, [guildId]);

  const fetchRoles = async () => {
    try {
      const { data } = await api.get(`/roles/guilds/${guildId}/roles`);
      setRoles(data.sort((a: Role, b: Role) => b.position - a.position));
      if (data.length > 0 && !selectedRole) {
        setSelectedRole(data[0]);
      }
    } catch (error) {
      toast.error('Failed to load roles');
    }
  };

  const hasPermission = (permissions: string | number, flag: number): boolean => {
    const perms = typeof permissions === 'string' ? parseInt(permissions) : permissions;
    return (perms & flag) === flag;
  };

  const togglePermission = (flag: number) => {
    if (!selectedRole) return;
    
    const currentPerms = parseInt(selectedRole.permissions);
    const newPerms = (currentPerms & flag) === flag 
      ? currentPerms & ~flag 
      : currentPerms | flag;
    
    setSelectedRole({ ...selectedRole, permissions: newPerms.toString() });
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    
    setLoading(true);
    try {
      const { data } = await api.post(`/roles/guilds/${guildId}/roles`, {
        name: newRoleName,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        permissions: PERMISSION_FLAGS.VIEW_CHANNELS | PERMISSION_FLAGS.SEND_MESSAGES | PERMISSION_FLAGS.CONNECT_VOICE | PERMISSION_FLAGS.SPEAK_VOICE,
      });
      
      setRoles(prev => [...prev, data]);
      setSelectedRole(data);
      setNewRoleName('');
      setCreating(false);
      toast.success('Role created');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;
    
    setLoading(true);
    try {
      const { data } = await api.patch(`/roles/${selectedRole.id}`, {
        name: selectedRole.name,
        color: selectedRole.color,
        permissions: parseInt(selectedRole.permissions),
        mentionable: selectedRole.mentionable,
        hoisted: selectedRole.hoisted,
      });
      
      setRoles(prev => prev.map(r => r.id === data.id ? data : r));
      toast.success('Role updated');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    setLoading(true);
    try {
      await api.delete(`/roles/${roleId}`);
      setRoles(prev => prev.filter(r => r.id !== roleId));
      if (selectedRole?.id === roleId) {
        setSelectedRole(roles[0] || null);
      }
      toast.success('Role deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[600px]">
      {/* Roles List */}
      <div className="w-64 border-r border-white/10 overflow-y-auto">
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Roles</h3>
            <button
              onClick={() => setCreating(true)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Create Role"
            >
              <Plus className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {creating && (
            <div className="p-3 bg-[#2b2d31] rounded-lg space-y-2">
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Role name"
                className="w-full px-3 py-2 bg-[#1e1f22] border border-white/10 rounded text-white text-sm focus:outline-none focus:border-purple-500"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleCreateRole()}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={handleCreateRole} loading={loading}>
                  Create
                </Button>
                <Button size="sm" variant="secondary" onClick={() => { setCreating(false); setNewRoleName(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role)}
              className={`w-full p-3 rounded-lg text-left transition-all ${
                selectedRole?.id === role.id
                  ? 'bg-purple-500/20 border-2 border-purple-500'
                  : 'bg-[#2b2d31] hover:bg-[#383a40] border-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" style={{ color: role.color }} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{role.name}</div>
                  {role.member_count !== undefined && (
                    <div className="text-xs text-gray-400">{role.member_count} members</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Role Editor */}
      <div className="flex-1 overflow-y-auto">
        {selectedRole ? (
          <div className="p-6 space-y-6">
            {/* Role Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: selectedRole.color + '20' }}
                >
                  <Shield className="w-6 h-6" style={{ color: selectedRole.color }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedRole.name}</h3>
                  <p className="text-sm text-gray-400">{selectedRole.member_count || 0} members</p>
                </div>
              </div>
              <button
                onClick={() => handleDeleteRole(selectedRole.id)}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                title="Delete Role"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Role Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Role Name
                </label>
                <input
                  type="text"
                  value={selectedRole.name}
                  onChange={(e) => setSelectedRole({ ...selectedRole, name: e.target.value })}
                  className="w-full px-4 py-2 bg-[#2b2d31] border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Role Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedRole({ ...selectedRole, color })}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        selectedRole.color === color 
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-[#313338]' 
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  <input
                    type="color"
                    value={selectedRole.color}
                    onChange={(e) => setSelectedRole({ ...selectedRole, color: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer"
                    title="Custom color"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#2b2d31] rounded-lg">
                <div>
                  <div className="font-medium text-white">Display role members separately</div>
                  <div className="text-sm text-gray-400">Show members with this role separately in the member list</div>
                </div>
                <button
                  onClick={() => setSelectedRole({ ...selectedRole, hoisted: !selectedRole.hoisted })}
                  className={`w-12 h-6 rounded-full transition-all ${
                    selectedRole.hoisted ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    selectedRole.hoisted ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#2b2d31] rounded-lg">
                <div>
                  <div className="font-medium text-white">Allow anyone to @mention this role</div>
                  <div className="text-sm text-gray-400">Members can mention this role to notify all members</div>
                </div>
                <button
                  onClick={() => setSelectedRole({ ...selectedRole, mentionable: !selectedRole.mentionable })}
                  className={`w-12 h-6 rounded-full transition-all ${
                    selectedRole.mentionable ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    selectedRole.mentionable ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>

            {/* Permissions */}
            <div className="pt-6 border-t border-white/10">
              <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Permissions
              </h4>
              <div className="space-y-2">
                {Object.entries(PERMISSION_FLAGS).map(([key, flag]) => {
                  const info = PERMISSION_NAMES[flag];
                  if (!info) return null;
                  
                  const isEnabled = hasPermission(selectedRole.permissions, flag);
                  
                  return (
                    <button
                      key={key}
                      onClick={() => togglePermission(flag)}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        isEnabled
                          ? info.dangerous
                            ? 'bg-red-500/20 border border-red-500/50'
                            : 'bg-green-500/20 border border-green-500/50'
                          : 'bg-[#2b2d31] border border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-medium ${isEnabled ? 'text-white' : 'text-gray-300'}`}>
                            {info.name}
                            {info.dangerous && <Crown className="w-4 h-4 inline ml-2 text-yellow-500" />}
                          </div>
                          <div className="text-sm text-gray-400">{info.description}</div>
                        </div>
                        {isEnabled ? (
                          <Eye className="w-5 h-5 text-green-400" />
                        ) : (
                          <EyeOff className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-white/10">
              <Button
                variant="primary"
                onClick={handleUpdateRole}
                loading={loading}
                className="flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a role to edit</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
