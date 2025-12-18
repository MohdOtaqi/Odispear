import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { query } from './database';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback';

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const displayName = profile.displayName || email?.split('@')[0] || 'User';
        const avatarUrl = profile.photos?.[0]?.value;

        if (!email) {
          return done(new Error('No email found in Google profile'), undefined);
        }

        // Check if user exists with this Google ID
        let result = await query(
          'SELECT * FROM users WHERE google_id = $1',
          [googleId]
        );

        let user;
        if (result.rows.length > 0) {
          // User exists, update last login
          user = result.rows[0];
          await query(
            'UPDATE users SET last_login = NOW(), avatar_url = COALESCE($1, avatar_url) WHERE id = $2',
            [avatarUrl, user.id]
          );
        } else {
          // Check if email already exists (link accounts)
          result = await query(
            'SELECT * FROM users WHERE email = $1',
            [email]
          );

          if (result.rows.length > 0) {
            // Link Google account to existing user
            user = result.rows[0];
            await query(
              'UPDATE users SET google_id = $1, avatar_url = COALESCE($2, avatar_url) WHERE id = $3',
              [googleId, avatarUrl, user.id]
            );
          } else {
            // Create new user
            const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
            const insertResult = await query(
              `INSERT INTO users (email, username, display_name, google_id, avatar_url, status)
               VALUES ($1, $2, $3, $4, $5, 'online')
               RETURNING *`,
              [email, username, displayName, googleId, avatarUrl]
            );
            user = insertResult.rows[0];
          }
        }

        return done(null, user);
      } catch (error) {
        console.error('[Passport] Google OAuth error:', error);
        return done(error as Error, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
