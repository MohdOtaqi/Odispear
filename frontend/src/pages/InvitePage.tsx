import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useGuildStore } from '../store/guildStore';
import api from '../lib/api';
import { Users, Zap, AlertCircle, CheckCircle2, Loader2, ArrowRight, Sparkles, Shield } from 'lucide-react';

interface InviteInfo {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  member_count: number;
  online_count: number;
}

// Floating particles component
const FloatingParticles = () => (
  <>
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1.5 h-1.5 bg-mot-gold/40 rounded-full"
        style={{
          top: `${20 + Math.random() * 60}%`,
          left: `${10 + Math.random() * 80}%`,
        }}
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: i * 0.5,
          ease: "easeInOut"
        }}
      />
    ))}
  </>
);

export const InvitePage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { joinGuildByInvite } = useGuildStore();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  const loadInvite = useCallback(async () => {
    if (!code) {
      setError('Invalid invite link');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get<InviteInfo>(`/invites/${code}`);
      setInvite(data);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Invalid or expired invite';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadInvite();
  }, [loadInvite]);

  const handleAccept = async () => {
    if (!code) return;

    if (!isAuthenticated) {
      const redirectPath = location.pathname + location.search;
      navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }

    try {
      setIsJoining(true);
      await joinGuildByInvite(code);
      setJoined(true);
      setTimeout(() => navigate('/app'), 1500);
    } catch {
      // Error handled by store
    } finally {
      setIsJoining(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mot-black relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_rgba(245,166,35,0.12)_0%,_transparent_50%)]" />
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(245,166,35,0.08)_0%,_transparent_40%)]" />
          </div>
          <FloatingParticles />
        </div>

        <motion.div
          className="relative z-10 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <motion.div
            className="w-24 h-24 mx-auto mb-6 relative"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-mot-gold-light to-mot-gold rounded-3xl" />
            <div className="absolute inset-1 bg-mot-black rounded-2xl flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-10 h-10 text-mot-gold" />
              </motion.div>
            </div>
          </motion.div>
          <motion.p
            className="text-gray-400 text-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading invite...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Error State
  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mot-black px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-25">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_rgba(245,166,35,0.1)_0%,_transparent_50%)]" />
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(239,68,68,0.05)_0%,_transparent_40%)]" />
          </div>
          <FloatingParticles />
        </div>

        <motion.div
          className="relative z-10 max-w-md w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <motion.div
            className="bg-mot-surface/60 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 text-center"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
          >
            <motion.div
              className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-2xl flex items-center justify-center"
              initial={{ rotate: -10 }}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <AlertCircle className="w-10 h-10 text-red-400" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-3">Invite Invalid</h1>
            <p className="text-gray-400 mb-8">{error || 'This invite may have expired or is no longer valid.'}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/"
                  className="block px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-colors"
                >
                  Go Home
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/register"
                  className="block px-6 py-3 bg-gradient-to-r from-mot-gold-light to-mot-gold rounded-xl font-semibold text-mot-black"
                >
                  Create Account
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Success State
  if (joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mot-black px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-35">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_rgba(245,166,35,0.15)_0%,_transparent_50%)]" />
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(245,166,35,0.12)_0%,_transparent_40%)]" />
          </div>
          <FloatingParticles />
        </div>

        <motion.div
          className="relative z-10 max-w-md w-full"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <motion.div className="bg-mot-surface/60 backdrop-blur-xl border border-mot-gold/20 rounded-3xl p-8 text-center">
            <motion.div
              className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-mot-gold-light to-mot-gold rounded-2xl flex items-center justify-center shadow-xl"
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              style={{ boxShadow: '0 0 40px rgba(212, 175, 55, 0.5)' }}
            >
              <CheckCircle2 className="w-12 h-12 text-mot-black" />
            </motion.div>
            <motion.h1
              className="text-2xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Welcome to {invite.name}!
            </motion.h1>
            <motion.p
              className="text-gray-400 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              You've successfully joined the server.
            </motion.p>
            <motion.div
              className="flex items-center justify-center gap-2 text-mot-gold"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Redirecting you now...</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Main Invite View
  return (
    <div className="min-h-screen flex items-center justify-center bg-mot-black px-4 py-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <motion.div
            className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_rgba(245,166,35,0.15)_0%,_transparent_50%)]"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.4, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(245,166,35,0.1)_0%,_transparent_40%)]"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 6, repeat: Infinity, delay: 1 }}
          />
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(rgba(245,166,35,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,166,35,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />

        <FloatingParticles />
      </div>

      {/* Navigation */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 p-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <motion.img
              src="/MOT.gif"
              alt="MOT"
              className="h-14 w-auto"
              whileHover={{ scale: 1.1 }}
            />
          </Link>
          {!isAuthenticated && (
            <motion.div whileHover={{ scale: 1.02 }}>
              <Link
                to="/login"
                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Main Card */}
      <motion.div
        className="relative z-10 max-w-lg w-full"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
      >
        <motion.div
          className="bg-mot-surface/60 backdrop-blur-xl border border-mot-border rounded-3xl overflow-hidden shadow-2xl"
          whileHover={{ borderColor: "rgba(212, 175, 55, 0.3)" }}
        >
          {/* Server Banner */}
          <div className="relative h-32 bg-gradient-to-br from-mot-gold/20 via-mot-gold-deep/15 to-mot-gold/25">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }}
            />

            {/* Server Icon */}
            <motion.div
              className="absolute -bottom-12 left-1/2 -translate-x-1/2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <motion.div
                className="w-28 h-28 rounded-3xl bg-gradient-to-br from-mot-gold-light to-mot-gold p-1 shadow-xl"
                style={{ boxShadow: '0 0 40px rgba(212, 175, 55, 0.4)' }}
                whileHover={{ scale: 1.05, rotate: 3 }}
              >
                <div className="w-full h-full rounded-[22px] bg-mot-black flex items-center justify-center overflow-hidden">
                  {invite.icon_url ? (
                    <img src={invite.icon_url} alt={invite.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-12 h-12 text-mot-gold" />
                  )}
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Content */}
          <div className="pt-16 pb-8 px-8">
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-xs uppercase tracking-widest text-mot-gold mb-2 font-medium">You've been invited to join</p>
              <h1 className="text-3xl font-bold text-white mb-2">{invite.name}</h1>
              {invite.description && (
                <p className="text-gray-400 text-sm max-w-sm mx-auto">{invite.description}</p>
              )}
            </motion.div>

            {/* Stats */}
            <motion.div
              className="flex items-center justify-center gap-6 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <motion.span
                  className="w-3 h-3 rounded-full bg-emerald-500"
                  animate={{ scale: [1, 1.2, 1], boxShadow: ['0 0 10px #10B981', '0 0 20px #10B981', '0 0 10px #10B981'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-gray-300 font-medium">{invite.online_count} Online</span>
              </div>
              <div className="w-px h-5 bg-white/10" />
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-300 font-medium">{invite.member_count} Members</span>
              </div>
            </motion.div>

            {/* Action Button */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <motion.button
                onClick={handleAccept}
                disabled={isJoining}
                className="w-full group relative px-6 py-4 bg-gradient-to-r from-mot-gold-light to-mot-gold rounded-xl font-semibold text-lg overflow-hidden text-mot-black disabled:opacity-60 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(212, 175, 55, 0.5)" }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isJoining ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="w-5 h-5" />
                      </motion.div>
                      Joining...
                    </>
                  ) : (
                    <>
                      Accept Invite
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    </>
                  )}
                </span>
              </motion.button>

              {!isAuthenticated && (
                <p className="text-center text-sm text-gray-500">
                  Don't have an account?{' '}
                  <Link to={`/register?redirect=${encodeURIComponent(location.pathname)}`} className="text-mot-gold hover:text-mot-gold-light font-medium">
                    Sign up
                  </Link>
                </p>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Secure
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Powered by MOT
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
};
