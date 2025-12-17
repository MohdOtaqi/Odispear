import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

export const isS3Configured = (): boolean => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET
  );
};

export const uploadToS3 = async (
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read' as const
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
};

export const deleteFromS3 = async (key: string): Promise<void> => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key
  };

  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Failed to delete file from S3');
  }
};

export const uploadLocally = async (
  file: Express.Multer.File,
  folder: string
): Promise<string> => {
  try {
    const uploadDir = path.join(process.cwd(), 'uploads', folder);
    
    // Create directory if it doesn't exist
    await mkdir(uploadDir, { recursive: true });
    
    const filename = `${uuidv4()}-${file.originalname}`;
    const filepath = path.join(uploadDir, filename);
    
    await writeFile(filepath, file.buffer);
    
    // Return relative URL path
    return `/uploads/${folder}/${filename}`;
  } catch (error) {
    console.error('Local upload error:', error);
    throw new Error('Failed to upload file locally');
  }
};

export const getSignedUrl = async (
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Expires: expiresIn
  };

  try {
    return await s3.getSignedUrlPromise('getObject', params);
  } catch (error) {
    console.error('S3 signed URL error:', error);
    throw new Error('Failed to generate signed URL');
  }
};