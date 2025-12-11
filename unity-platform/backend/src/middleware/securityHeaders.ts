import { Request, Response, NextFunction } from 'express';

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content Security Policy - Allow Daily.co for voice/video and Google Fonts
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.daily.co https://c.daily.co; " +
    "script-src-elem 'self' 'unsafe-inline' blob: https://*.daily.co https://c.daily.co; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' data: https://fonts.gstatic.com; " +
    "connect-src 'self' wss: ws: https://*.daily.co https://c.daily.co https://*.ingest.sentry.io https://api.daily.co; " +
    "frame-src 'self' https://*.daily.co; " +
    "media-src 'self' blob: https://*.daily.co; " +
    "worker-src 'self' blob:; " +
    "frame-ancestors 'none';"
  );

  next();
};
