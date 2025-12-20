import { io, Socket } from 'socket.io-client';

// Use current origin for WebSocket - works for both local dev and tunnel
const WS_URL = typeof window !== 'undefined' ? window.location.origin : '';

class SocketManager {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Set up event forwarding
    this.setupEventForwarding();

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  private setupEventForwarding() {
    if (!this.socket) return;

    // Debug: Log ALL incoming events
    this.socket.onAny((event: string, ...args: any[]) => {
      if (event.startsWith('voice.')) {
        console.log(`[Socket] Voice event received: ${event}`, args);
      }
    });

    const events = [
      'message.create',
      'message.update',
      'message.delete',
      'dm.message.create',
      'dm.message.update',
      'dm.message.delete',
      'dm.typing.start',
      'dm.typing.stop',
      'presence.update',
      'typing.start',
      'typing.stop',
      'voice.user_joined',
      'voice.user_left',
      'voice.state_update',
      'voice.participants',
      'channel.joined',
      'dm.joined',
      'dm:call-started',
      'friend.request',
      'friend.accepted',
    ];

    events.forEach((event) => {
      this.socket!.on(event, (data) => {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
          callbacks.forEach((callback) => callback(data));
        }
      });
    });
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  joinGuild(guildId: string) {
    this.emit('guild.join', { guild_id: guildId });
  }

  leaveGuild(guildId: string) {
    this.emit('guild.leave', { guild_id: guildId });
  }

  joinChannel(channelId: string) {
    this.emit('channel.join', { channel_id: channelId });
  }

  leaveChannel(channelId: string) {
    this.emit('channel.leave', { channel_id: channelId });
  }

  startTyping(channelId: string) {
    this.emit('typing.start', { channel_id: channelId });
  }

  stopTyping(channelId: string) {
    this.emit('typing.stop', { channel_id: channelId });
  }

  joinVoice(channelId: string) {
    this.emit('voice.join', { channel_id: channelId });
  }

  leaveVoice(channelId: string) {
    this.emit('voice.leave', { channel_id: channelId });
  }

  updateVoiceState(channelId: string, state: { muted?: boolean; deafened?: boolean }) {
    this.emit('voice.state_update', { channel_id: channelId, ...state });
  }

  // DM methods
  joinDM(dmChannelId: string) {
    this.emit('dm.join', { dm_channel_id: dmChannelId });
  }

  leaveDM(dmChannelId: string) {
    this.emit('dm.leave', { dm_channel_id: dmChannelId });
  }

  startDMTyping(dmChannelId: string) {
    this.emit('dm.typing.start', { dm_channel_id: dmChannelId });
  }

  stopDMTyping(dmChannelId: string) {
    this.emit('dm.typing.stop', { dm_channel_id: dmChannelId });
  }
}

export const socketManager = new SocketManager();
