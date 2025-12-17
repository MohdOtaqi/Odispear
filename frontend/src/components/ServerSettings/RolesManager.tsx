import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Shield, Trash2, GripVertical, Users, Crown } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import api from '../../lib/api';
import toast from 'react-hot-toast';

// Permission bits matching backend
export const Permission = {
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

const PERMISSION_LABELS: Record<number, { name: string; description: string }> = {
  [Permission.VIEW_CHANNEL]: { name: 'View Channels', description: 'Allows viewing channels' },
  [Permission.SEND_MESSAGES]: { name: 'Send Messages', description: 'Allows sending messages in channels' },
  [Permission.MANAGE_MESSAGES]: { name: 'Manage Messages', description: 'Allows deleting and editing other messages' },
  [Permission.MANAGE_CHANNELS]: { name: 'Manage Channels', description: 'Allows creating, editing, and deleting channels' },
  [Permission.MANAGE_GUILD]: { name: 'Manage Server', description: 'Allows editing server settings' },
  [Permission.KICK_MEMBERS]: { name: 'Kick Members', description: 'Allows kicking members from the server' },
  [Permission.BAN_MEMBERS]: { name: 'Ban Members', description: 'Allows banning members from the server' },
  [Permission.MANAGE_ROLES]: { name: 'Manage Roles', description: 'Allows creating, editing, and deleting roles' },
  [Permission.MANAGE_WEBHOOKS]: { name: 'Manage Webhooks', description: 'Allows managing webhooks' },
  [Permission.CONNECT_VOICE]: { name: 'Connect to Voice', description: 'Allows connecting to voice channels' },
  [Permission.SPEAK_VOICE]: { name: 'Speak in Voice', description: 'Allows speaking in voice channels' },
  [Permission.MUTE_MEMBERS]: { name: 'Mute Members', description: 'Allows muting other members in voice' },
  [Permission.MANAGE_EVENTS]: { name: 'Manage Events', description: 'Allows creating and managing events' },
  [Permission.ADMINISTRATOR]: { name: 'Administrator', description: 'Full access to all permissions' },
};

interface Role {
  id: string;
  name: string;
  color: string | null;
  permissions: number;
  mentionable: boolean;
  hoisted: boolean;
  position: number;
  member_count?: number;
}

interface RolesManagerProps {
  guildId: string;
}

export const RolesManager: React.FC<RolesManagerProps> = ({ guildId }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedRole, setEditedRole] = useState<Partial<Role>>({});

  const fetchRoles = useCallback(async () => {
    try {
      const { data } = await api.get(`/guilds/${guildId}/roles`);
      setRoles(data);
      if (data.length > 0 && !selectedRole) {
        setSelectedRole(data[0]);
        setEditedRole(data[0]);
      }
    } catch (error) {
      toast.error('Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  }, [guildId, selectedRole]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleCreateRole = async () => {
    try {
      const { data } = await api.post(`/guilds/${guildId}/roles`, {
        name: 'New Role',
        color: '#F5A623',
        permissions: Permission.VIEW_CHANNEL | Permission.SEND_MESSAGES | Permission.CONNECT_VOICE | Permission.SPEAK_VOICE,
      });
      setRoles(prev => [data, ...prev]);
      setSelectedRole(data);
      setEditedRole(data);
      toast.success('Role created');
    } catch (error) {
      toast.error('Failed to create role');
    }
  };

  const handleSaveRole = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    try {
      await api.patch(`/roles/${selectedRole.id}`, editedRole);
      setRoles(prev => prev.map(r => r.id === selectedRole.id ? { ...r, ...editedRole } : r));
      toast.success('Role saved');
    } catch (error) {
      toast.error('Failed to save role');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole || selectedRole.name === '@everyone') return;
    if (!confirm(`Delete role "${selectedRole.name}"?`)) return;
    
    try {
      await api.delete(`/roles/${selectedRole.id}`);
      setRoles(prev => prev.filter(r => r.id !== selectedRole.id));
      setSelectedRole(roles[0] || null);
      toast.success('Role deleted');
    } catch (error) {
      toast.error('Failed to delete role');
    }
  };

  const togglePermission = (perm: number) => {
    const current = editedRole.permissions || 0;
    const newPerms = (current & perm) ? current & ~perm : current | perm;
    setEditedRole(prev => ({ ...prev, permissions: newPerms }));
  };

  const hasPermission = (perm: number) => ((editedRole.permissions || 0) & perm) !== 0;

  if (isLoading) {
    return <div className="text-gray-400 text-center py-8">Loading roles...</div>;
  }

  return (
    <div className="flex h-full -m-6">
      {/* Roles List */}
      <div className="w-64 border-r border-mot-border p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase">Roles</h3>
          <button
            onClick={handleCreateRole}
            className="p-1 text-gray-400 hover:text-mot-gold transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-1">
          {roles.map(role => (
            <button
              key={role.id}
              onClick={() => {
                setSelectedRole(role);
                setEditedRole(role);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedRole?.id === role.id
                  ? 'bg-mot-gold/20 text-mot-gold'
                  : 'text-gray-300 hover:bg-mot-gold/10'
              }`}
            >
              <GripVertical className="w-3 h-3 text-gray-500" />
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: role.color || '#99AAB5' }}
              />
              <span className="flex-1 text-left truncate">{role.name}</span>
              {role.name === '@everyone' && <Crown className="w-3 h-3 text-yellow-500" />}
              <span className="text-xs text-gray-500">{role.member_count || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Role Editor */}
      <div className="flex-1 p-6 overflow-y-auto">
        {selectedRole ? (
          <div className="space-y-6">
            {/* Role Name & Color */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  label="Role Name"
                  value={editedRole.name || ''}
                  onChange={(e) => setEditedRole(prev => ({ ...prev, name: e.target.value }))}
                  disabled={selectedRole.name === '@everyone'}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Color</label>
                <input
                  type="color"
                  value={editedRole.color && editedRole.color.startsWith('#') ? editedRole.color : '#99AAB5'}
                  onChange={(e) => setEditedRole(prev => ({ ...prev, color: e.target.value }))}
                  className="w-11 h-11 rounded-lg border border-mot-border cursor-pointer"
                  disabled={selectedRole.name === '@everyone'}
                />
              </div>
            </div>

            {/* Options */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editedRole.hoisted || false}
                  onChange={(e) => setEditedRole(prev => ({ ...prev, hoisted: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-600 text-mot-gold focus:ring-mot-gold"
                />
                <span className="text-sm text-gray-300">Display separately</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editedRole.mentionable || false}
                  onChange={(e) => setEditedRole(prev => ({ ...prev, mentionable: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-600 text-mot-gold focus:ring-mot-gold"
                />
                <span className="text-sm text-gray-300">Allow mentioning</span>
              </label>
            </div>

            {/* Permissions */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Permissions
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(PERMISSION_LABELS).map(([perm, { name, description }]) => (
                  <label
                    key={perm}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      hasPermission(Number(perm))
                        ? 'border-mot-gold/50 bg-mot-gold/10'
                        : 'border-mot-border hover:border-mot-gold/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={hasPermission(Number(perm))}
                      onChange={() => togglePermission(Number(perm))}
                      className="w-4 h-4 mt-0.5 rounded border-gray-600 text-mot-gold focus:ring-mot-gold"
                    />
                    <div>
                      <div className="text-sm font-medium text-white">{name}</div>
                      <div className="text-xs text-gray-400">{description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-mot-border">
              {selectedRole.name !== '@everyone' && (
                <button
                  onClick={handleDeleteRole}
                  className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Role
                </button>
              )}
              <div className="flex-1" />
              <Button variant="primary" onClick={handleSaveRole} loading={isSaving}>
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Users className="w-12 h-12 mb-4" />
            <p>Select a role to edit</p>
          </div>
        )}
      </div>
    </div>
  );
};
