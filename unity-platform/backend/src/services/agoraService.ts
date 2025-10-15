import crypto from 'crypto';

interface AgoraTokenConfig {
  appId: string;
  appCertificate: string;
  channelName: string;
  uid: number;
  role: 'publisher' | 'subscriber';
  expirationTimeInSeconds: number;
}

// Agora Token Builder (simplified - works without external package)
class AgoraTokenBuilder {
  private static readonly VERSION = '007';
  private static readonly ROLE_PUBLISHER = 1;
  private static readonly ROLE_SUBSCRIBER = 2;

  static buildToken(config: AgoraTokenConfig): string {
    const {
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      expirationTimeInSeconds,
    } = config;

    const salt = Math.floor(Math.random() * 99999999);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const expireTimestamp = currentTimestamp + expirationTimeInSeconds;

    const roleNum = role === 'publisher' ? this.ROLE_PUBLISHER : this.ROLE_SUBSCRIBER;

    const message = this.pack(appId, channelName, uid, salt, expireTimestamp, roleNum);
    const signature = this.sign(appCertificate, message);

    const content = Buffer.concat([
      Buffer.from([0, 0, 0, 0]), // crc
      this.packString(signature),
      this.packUint32(salt),
      this.packUint32(expireTimestamp),
    ]);

    const version = this.VERSION;
    const token = version + appId + Buffer.from(content).toString('base64');

    return token;
  }

  private static pack(
    appId: string,
    channelName: string,
    uid: number,
    salt: number,
    ts: number,
    role: number
  ): Buffer {
    const buffer = Buffer.concat([
      this.packString(appId),
      this.packString(channelName),
      this.packUint32(uid),
      this.packUint32(salt),
      this.packUint32(ts),
      this.packUint32(role),
    ]);
    return buffer;
  }

  private static sign(key: string, message: Buffer): string {
    return crypto.createHmac('sha256', key).update(message).digest('hex');
  }

  private static packString(str: string): Buffer {
    const bytes = Buffer.from(str, 'utf-8');
    return Buffer.concat([this.packUint16(bytes.length), bytes]);
  }

  private static packUint16(num: number): Buffer {
    const buffer = Buffer.alloc(2);
    buffer.writeUInt16LE(num, 0);
    return buffer;
  }

  private static packUint32(num: number): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32LE(num, 0);
    return buffer;
  }
}

// Service functions
export const generateVoiceToken = (
  channelId: string,
  userId: string,
  role: 'publisher' | 'subscriber' = 'publisher',
  expirationTimeInSeconds: number = 3600
): { token: string; appId: string; uid: number } => {
  const appId = process.env.AGORA_APP_ID!;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE!;

  if (!appId || !appCertificate) {
    throw new Error('Agora credentials not configured');
  }

  // Convert userId to numeric UID (use hash for consistency)
  const uid = generateNumericUid(userId);

  const token = AgoraTokenBuilder.buildToken({
    appId,
    appCertificate,
    channelName: channelId,
    uid,
    role,
    expirationTimeInSeconds,
  });

  return {
    token,
    appId,
    uid,
  };
};

// Generate numeric UID from string userId (consistent hashing)
function generateNumericUid(userId: string): number {
  const hash = crypto.createHash('sha256').update(userId).digest();
  // Use first 4 bytes as uint32
  return hash.readUInt32BE(0) % 2147483647; // Max 32-bit signed int
}

export const validateVoiceAccess = async (
  userId: string,
  channelId: string,
  db: any
): Promise<boolean> => {
  // Check if user has access to the channel
  const result = await db.query(
    `SELECT c.id FROM channels c
     JOIN guild_members gm ON c.guild_id = gm.guild_id
     WHERE c.id = $1 AND gm.user_id = $2 AND c.type = 'voice'`,
    [channelId, userId]
  );

  return result.rows.length > 0;
};
