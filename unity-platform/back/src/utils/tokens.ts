import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export const generateAccessToken = (userId: string, email: string, username: string): string => {
  return jwt.sign({ userId, email, username }, process.env.JWT_SECRET! as unknown as jwt.Secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });
};

export const generateRefreshToken = (): string => {
  return uuidv4();
};

export const generateInviteCode = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export const generateWebhookToken = (): string => {
  return uuidv4().replace(/-/g, '');
};

export const generateBotToken = (): string => {
  const prefix = 'Bot';
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `${prefix}.${timestamp}.${random}`;
};
