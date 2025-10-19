import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Configure AWS SDK
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'unity-platform-uploads';

export const uploadToS3 = async (
  buffer: Buffer,
  key: string,
  mimeType: string
): Promise<string> => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: 'public-read'
    };

    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
};

export const deleteFromS3 = async (key: string): Promise<void> => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Failed to delete file from S3');
  }
};

export const uploadFile = async (
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<{ url: string; key: string }> => {
  const fileExtension = file.originalname.split('.').pop();
  const key = `${folder}/${uuidv4()}.${fileExtension}`;
  
  const url = await uploadToS3(file.buffer, key, file.mimetype);
  
  return { url, key };
};

export const uploadAvatar = async (
  file: Express.Multer.File,
  userId: string
): Promise<string> => {
  const key = `avatars/${userId}/${uuidv4()}.${file.originalname.split('.').pop()}`;
  return uploadToS3(file.buffer, key, file.mimetype);
};

export const uploadMessageAttachment = async (
  file: Express.Multer.File,
  channelId: string,
  messageId: string
): Promise<{ url: string; key: string; size: number; type: string }> => {
  const key = `messages/${channelId}/${messageId}/${file.originalname}`;
  const url = await uploadToS3(file.buffer, key, file.mimetype);
  
  return {
    url,
    key,
    size: file.size,
    type: file.mimetype
  };
};

export const uploadGuildAsset = async (
  file: Express.Multer.File,
  guildId: string,
  assetType: 'icon' | 'banner' | 'splash'
): Promise<string> => {
  const key = `guilds/${guildId}/${assetType}/${uuidv4()}.${file.originalname.split('.').pop()}`;
  return uploadToS3(file.buffer, key, file.mimetype);
};

export const uploadEmoji = async (
  file: Express.Multer.File,
  guildId: string,
  emojiName: string
): Promise<string> => {
  const key = `emojis/${guildId}/${emojiName}.${file.originalname.split('.').pop()}`;
  return uploadToS3(file.buffer, key, file.mimetype);
};

export const getSignedUrl = async (
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expiresIn
    };

    return s3.getSignedUrl('getObject', params);
  } catch (error) {
    console.error('Get signed URL error:', error);
    throw new Error('Failed to generate signed URL');
  }
};

// Check if S3 is configured
export const isS3Configured = (): boolean => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET
  );
};

// Fallback to local storage if S3 not configured
export const uploadLocally = async (
  file: Express.Multer.File,
  folder: string
): Promise<string> => {
  // In production, you'd save to local disk
  // For now, return a mock URL
  const mockUrl = `/uploads/${folder}/${uuidv4()}-${file.originalname}`;
  console.log('Would save file locally:', mockUrl);
  return mockUrl;
};
