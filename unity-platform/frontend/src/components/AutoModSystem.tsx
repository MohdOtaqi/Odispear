import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Ban, Clock, MessageSquare, Link, Image, Users, Hash, Settings, Plus, Trash2, Edit, Save, X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../lib/api';

interface AutoModRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger_type: 'keyword' | 'spam' | 'mention_spam' | 'link' | 'attachment' | 'caps';
  trigger_metadata: {
    keywords?: string[];
    allow_list?: string[];
    mention_threshold?: number;
    max_mentions?: number;
    max_messages_per_minute?: number;
    max_duplicates?: number;
    caps_percentage?: number;
    regex_patterns?: string[];
  };
  actions: AutoModAction[];
  exempt_roles: string[];
  exempt_channels: string[];
}

interface AutoModAction {
  type: 'block_message' | 'send_alert' | 'timeout' | 'kick' | 'ban';
  duration?: number;
  channel_id?: string;
  custom_message?: string;
}

interface AutoModLog {
  id: string;
  rule_id: string;
  rule_name: string;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  channel: {
    id: string;
    name: string;
  };
  message_content: string;
  triggered_at: Date;
  action_taken: string;
  matched_content?: string;
}

interface AutoModSystemProps {
  guildId: string;
}

export const AutoModSystem: React.FC<AutoModSystemProps> = ({ guildId }) => {
  const [rules, setRules] = useState<AutoModRule[]>([]);
  const [logs, setLogs] = useState<AutoModLog[]>([]);
  const [selectedRule, setSelectedRule] = useState<AutoModRule | null>(null);
  const [editingRule, setEditingRule] = useState<AutoModRule | null>(null);
  const [creatingRule, setCreatingRule] = useState(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'logs'>('rules');
  const [stats, setStats] = useState({
    blockedToday: 0,
    timeoutsToday: 0,
    flaggedUsers: 0,
    activeRules: 0
  });

  const PRESET_RULES: Partial<AutoModRule>[] = [
    {
      name: 'Profanity Filter',
      trigger_type: 'keyword',
      trigger_metadata: {
        keywords: ['badword1', 'badword2', 'badword3']
      },
      actions: [{ type: 'block_message' }, { type: 'send_alert' }]
    },
    {
      name: 'Spam Prevention',
      trigger_type: 'spam',
      trigger_metadata: {
        max_messages_per_minute: 5,
        max_duplicates: 3
      },
      actions: [{ type: 'block_message' }, { type: 'timeout', duration: 60 }]
    },
    {
      name: 'Mass Mention Protection',
      trigger_type: 'mention_spam',
      trigger_metadata: {
        max_mentions: 5
      },
      actions: [{ type: 'block_message' }, { type: 'send_alert' }]
    },
    {
      name: 'Suspicious Links',
      trigger_type: 'link',
      trigger_metadata: {
        allow_list: ['discord.com', 'youtube.com', 'twitter.com']
      },
      actions: [{ type: 'block_message' }, { type: 'send_alert' }]
    }
  ];

  useEffect(() => {
    fetchRules();
    fetchLogs();
    fetchStats();
  }, [guildId]);

  const fetchRules = async () => {
    try {
      const response = await api.get(`/guilds/${guildId}/automod/rules`);
      setRules(response.data);
    } catch (error) {
      // Mock data
      const mockRules: AutoModRule[] = [
        {
          id: '1',
          name: 'No Profanity',
          enabled: true,
          trigger_type: 'keyword',
          trigger_metadata: {
            keywords: ['badword', 'inappropriate'],
            regex_patterns: ['b[a@]dw[o0]rd']
          },
          actions: [
            { type: 'block_message' },
            { type: 'send_alert', channel_id: 'mod-log' }
          ],
          exempt_roles: ['admin', 'moderator'],
          exempt_channels: []
        },
        {
          id: '2',
          name: 'Anti-Spam',
          enabled: true,
          trigger_type: 'spam',
          trigger_metadata: {
            max_messages_per_minute: 5,
            max_duplicates: 3
          },
          actions: [
            { type: 'timeout', duration: 300 },
            { type: 'send_alert' }
          ],
          exempt_roles: ['trusted'],
          exempt_channels: ['spam-allowed']
        }
      ];
      setRules(mockRules);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await api.get(`/guilds/${guildId}/automod/logs`);
      setLogs(response.data);
    } catch (error) {
      // Mock data
      const mockLogs: AutoModLog[] = [
        {
          id: '1',
          rule_id: '1',
          rule_name: 'No Profanity',
          user: {
            id: '1',
            username: 'TroubleMaker',
            avatar: 'https://ui-avatars.com/api/?name=TroubleMaker'
          },
          channel: {
            id: '1',
            name: 'general'
          },
          message_content: 'This message contained [FILTERED]',
          triggered_at: new Date(Date.now() - 3600000),
          action_taken: 'Message blocked',
          matched_content: 'badword'
        },
        {
          id: '2',
          rule_id: '2',
          rule_name: 'Anti-Spam',
          user: {
            id: '2',
            username: 'Spammer',
            avatar: 'https://ui-avatars.com/api/?name=Spammer'
          },
          channel: {
            id: '1',
            name: 'general'
          },
          message_content: 'Repeated message spam',
          triggered_at: new Date(Date.now() - 7200000),
          action_taken: 'User timed out for 5 minutes',
          matched_content: '5 messages in 30 seconds'
        }
      ];
      setLogs(mockLogs);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get(`/guilds/${guildId}/automod/stats`);
      setStats(response.data);
    } catch (error) {
      setStats({
        blockedToday: 47,
        timeoutsToday: 12,
        flaggedUsers: 8,
        activeRules: rules.filter(r => r.enabled).length
      });
    }
  };

  const saveRule = async () => {
    if (!editingRule) return;

    try {
      if (creatingRule) {
        const response = await api.post(`/guilds/${guildId}/automod/rules`, editingRule);
        setRules([...rules, response.data]);
      } else {
        await api.patch(`/guilds/${guildId}/automod/rules/${editingRule.id}`, editingRule);
        setRules(rules.map(r => r.id === editingRule.id ? editingRule : r));
      }
      setEditingRule(null);
      setCreatingRule(false);
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!window.confirm('Are you sure you want to delete this AutoMod rule?')) return;

    try {
      await api.delete(`/guilds/${guildId}/automod/rules/${ruleId}`);
      setRules(rules.filter(r => r.id !== ruleId));
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const toggleRule = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    try {
      await api.patch(`/guilds/${guildId}/automod/rules/${ruleId}`, {
        enabled: !rule.enabled
      });
      setRules(rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const createNewRule = (preset?: Partial<AutoModRule>) => {
    const newRule: AutoModRule = {
      id: 'new',
      name: preset?.name || 'New Rule',
      enabled: false,
      trigger_type: preset?.trigger_type || 'keyword',
      trigger_metadata: preset?.trigger_metadata || { keywords: [] },
      actions: preset?.actions || [{ type: 'block_message' }],
      exempt_roles: [],
      exempt_channels: []
    };
    setEditingRule(newRule);
    setCreatingRule(true);
  };

  const getTriggerTypeIcon = (type: string) => {
    switch (type) {
      case 'keyword': return MessageSquare;
      case 'spam': return AlertTriangle;
      case 'mention_spam': return Users;
      case 'link': return Link;
      case 'attachment': return Image;
      case 'caps': return Hash;
      default: return Shield;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'block_message': return XCircle;
      case 'send_alert': return AlertCircle;
      case 'timeout': return Clock;
      case 'kick': return Ban;
      case 'ban': return Ban;
      default: return Shield;
    }
  };

  return (
    <div className="flex h-full bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">AutoMod</h2>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-400">{stats.blockedToday}</div>
              <div className="text-xs text-gray-400">Blocked Today</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-400">{stats.timeoutsToday}</div>
              <div className="text-xs text-gray-400">Timeouts</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-400">{stats.flaggedUsers}</div>
              <div className="text-xs text-gray-400">Flagged Users</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-400">{stats.activeRules}</div>
              <div className="text-xs text-gray-400">Active Rules</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'rules'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Rules
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'logs'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Logs
            </button>
          </div>
        </div>

        {activeTab === 'rules' && (
          <>
            {/* Quick Setup */}
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Quick Setup</h3>
              <div className="space-y-2">
                {PRESET_RULES.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => createNewRule(preset)}
                    className="w-full text-left px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-300">{preset.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rules List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-400">Active Rules</h3>
                <button
                  onClick={() => createNewRule()}
                  className="p-1.5 bg-purple-600 rounded hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="space-y-2">
                {rules.map(rule => {
                  const Icon = getTriggerTypeIcon(rule.trigger_type);
                  return (
                    <div
                      key={rule.id}
                      className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        selectedRule?.id === rule.id
                          ? 'bg-gray-800 border border-purple-500'
                          : 'hover:bg-gray-800 border border-transparent'
                      }`}
                      onClick={() => {
                        setSelectedRule(rule);
                        setEditingRule(null);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-gray-500'}`} />
                        <Icon className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-300">{rule.name}</div>
                          <div className="text-xs text-gray-500">{rule.actions.length} actions</div>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRule(rule.id);
                          }}
                          className="p-1 hover:bg-gray-700 rounded"
                        >
                          {rule.enabled ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRule(rule.id);
                          }}
                          className="p-1 hover:bg-red-900/50 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'rules' && (selectedRule || editingRule) && (
          <div className="p-6">
            <div className="max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingRule ? (creatingRule ? 'Create Rule' : 'Edit Rule') : 'Rule Details'}
                </h2>
                <div className="flex items-center gap-2">
                  {!editingRule && (
                    <button
                      onClick={() => setEditingRule(selectedRule)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Rule
                    </button>
                  )}
                  {editingRule && (
                    <>
                      <button
                        onClick={() => {
                          setEditingRule(null);
                          setCreatingRule(false);
                        }}
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveRule}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Rule Configuration */}
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Rule Name</label>
                      <input
                        type="text"
                        value={editingRule?.name || selectedRule?.name || ''}
                        onChange={(e) => editingRule && setEditingRule({ ...editingRule, name: e.target.value })}
                        disabled={!editingRule}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Trigger Type</label>
                      <select
                        value={editingRule?.trigger_type || selectedRule?.trigger_type || 'keyword'}
                        onChange={(e) => editingRule && setEditingRule({ 
                          ...editingRule, 
                          trigger_type: e.target.value as AutoModRule['trigger_type']
                        })}
                        disabled={!editingRule}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                      >
                        <option value="keyword">Keyword Filter</option>
                        <option value="spam">Spam Detection</option>
                        <option value="mention_spam">Mention Spam</option>
                        <option value="link">Link Filter</option>
                        <option value="attachment">Attachment Filter</option>
                        <option value="caps">Excessive Caps</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Trigger Configuration */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Trigger Configuration</h3>
                  <div className="text-sm text-gray-400">
                    Configure what will trigger this AutoMod rule
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
                  <div className="space-y-2">
                    {(editingRule?.actions || selectedRule?.actions || []).map((action, idx) => {
                      const ActionIcon = getActionIcon(action.type);
                      return (
                        <div key={idx} className="flex items-center gap-3 px-3 py-2 bg-gray-900 rounded-lg">
                          <ActionIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-300">{action.type.replace('_', ' ')}</span>
                          {action.duration && (
                            <span className="text-xs text-gray-500">({action.duration}s)</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">AutoMod Activity Log</h2>
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <img src={log.user.avatar} alt={log.user.username} className="w-10 h-10 rounded-full" />
                      <div>
                        <div className="font-medium text-white">{log.user.username}</div>
                        <div className="text-sm text-gray-400">in #{log.channel.name}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(log.triggered_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded p-3 mb-2">
                    <p className="text-sm text-gray-300">{log.message_content}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-xs bg-purple-900/50 text-purple-400 px-2 py-1 rounded">
                        {log.rule_name}
                      </span>
                      {log.matched_content && (
                        <span className="text-xs text-gray-500">
                          Matched: <span className="text-red-400">{log.matched_content}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-yellow-400">{log.action_taken}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoModSystem;
