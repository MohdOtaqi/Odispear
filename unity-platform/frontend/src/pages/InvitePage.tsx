import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useGuildStore } from '../store/guildStore';
import api from '../lib/api';
import { Users, Zap, AlertCircle, CheckCircle2, Loader2, ArrowRight, Sparkles } from 'lucide-react';

interface InviteInfo {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  member_count: number;
  online_count: number;
}

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
        {/* Premium Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient Mesh */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_rgba(245,166,35,0.12)_0%,_transparent_50%)]" />
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(245,166,35,0.08)_0%,_transparent_40%)]" />
            <div className="absolute bottom-0 left-1/2 w-full h-full bg-[radial-gradient(ellipse_at_bottom,_rgba(245,166,35,0.06)_0%,_transparent_50%)]" />
          </div>
          
          {/* Animated Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(245,166,35,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(245,166,35,0.025)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
          
          {/* Floating Orbs */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-mot-gold/40 rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-mot-gold/30 rounded-full animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
          <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-mot-gold/50 rounded-full animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-mot-gold/35 rounded-full animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '2s' }} />
        </div>
        
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-mot-gold-light to-mot-gold rounded-2xl animate-pulse" />
            <div className="absolute inset-1 bg-mot-black rounded-xl flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-mot-gold animate-spin" />
            </div>
          </div>
          <p className="text-gray-400 text-lg">Loading invite...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mot-black px-4 relative overflow-hidden">
        {/* Premium Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient Mesh */}
          <div className="absolute inset-0 opacity-25">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_rgba(245,166,35,0.1)_0%,_transparent_50%)]" />
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(239,68,68,0.05)_0%,_transparent_40%)]" />
            <div className="absolute bottom-0 left-1/2 w-full h-full bg-[radial-gradient(ellipse_at_bottom,_rgba(245,166,35,0.06)_0%,_transparent_50%)]" />
          </div>
          
          {/* Floating Orbs */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-500/40 rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-mot-gold/30 rounded-full animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        </div>
        
        <div className="relative z-10 max-w-md w-full">
          <div className="bg-mot-surface/60 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-500/10 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Invite Invalid</h1>
            <p className="text-gray-400 mb-8">{error || 'This invite may have expired or is no longer valid.'}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/"
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all hover:-translate-y-0.5"
              >
                Go Home
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 bg-gradient-to-r from-mot-gold-light to-mot-gold rounded-xl font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold-glow-sm text-mot-black"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success State
  if (joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mot-black px-4 relative overflow-hidden">
        {/* Premium Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient Mesh */}
          <div className="absolute inset-0 opacity-35">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_rgba(245,166,35,0.15)_0%,_transparent_50%)]" />
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(245,166,35,0.12)_0%,_transparent_40%)]" />
            <div className="absolute bottom-0 left-1/2 w-full h-full bg-[radial-gradient(ellipse_at_bottom,_rgba(245,166,35,0.1)_0%,_transparent_50%)]" />
          </div>
          
          {/* Animated Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(245,166,35,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,166,35,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
          
          {/* Floating Orbs */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-mot-gold/50 rounded-full animate-pulse" style={{ animationDuration: '2s' }} />
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-mot-gold/40 rounded-full animate-pulse" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
        </div>
        
        <div className="relative z-10 max-w-md w-full">
          <div className="bg-mot-surface/60 backdrop-blur-xl border border-mot-gold/20 rounded-3xl p-8 text-center animate-scale-in">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-mot-gold-light to-mot-gold rounded-2xl flex items-center justify-center shadow-lg shadow-gold-glow">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome to {invite.name}!</h1>
            <p className="text-gray-400 mb-4">You've successfully joined the server.</p>
            <div className="flex items-center justify-center gap-2 text-mot-gold">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Redirecting you now...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Invite View
  return (
    <div className="min-h-screen flex items-center justify-center bg-mot-black px-4 py-8 relative overflow-hidden max-h-screen">
      {/* Premium Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Mesh */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_rgba(245,166,35,0.15)_0%,_transparent_50%)]" />
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(245,166,35,0.1)_0%,_transparent_40%)]" />
          <div className="absolute bottom-0 left-1/2 w-full h-full bg-[radial-gradient(ellipse_at_bottom,_rgba(245,166,35,0.08)_0%,_transparent_50%)]" />
        </div>
        
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(245,166,35,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,166,35,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-mot-gold/40 rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-mot-gold/30 rounded-full animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-mot-gold/50 rounded-full animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
        <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-mot-gold/35 rounded-full animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-mot-gold/45 rounded-full animate-pulse" style={{ animationDuration: '2.8s', animationDelay: '1.5s' }} />
        
        {/* Subtle Glow Lines */}
        <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-mot-gold/10 to-transparent" />
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-mot-gold/10 to-transparent" />
        
        {/* Corner Accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-mot-gold/5 to-transparent" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-mot-gold/5 to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src="/MOT.gif" 
              alt="MOT" 
              className="h-14 w-auto group-hover:scale-110 transition-transform"
            />
          </Link>
          {!isAuthenticated && (
            <Link
              to="/login"
              className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* Main Card */}
      <div className="relative z-10 max-w-lg w-full">
        <div className="bg-mot-surface/60 backdrop-blur-xl border border-mot-border rounded-3xl overflow-hidden shadow-2xl">
          {/* Server Banner/Header */}
          <div className="relative h-32 bg-gradient-to-br from-mot-gold/20 via-mot-gold-deep/15 to-mot-gold/25">
            {/* Decorative pattern overlay */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }}
            />
            
            {/* Server Icon */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-mot-gold-light to-mot-gold p-1 shadow-xl shadow-gold-glow">
                <div className="w-full h-full rounded-[20px] bg-mot-black flex items-center justify-center overflow-hidden">
                  {invite.icon_url ? (
                    <img src={invite.icon_url} alt={invite.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-10 h-10 text-mot-gold" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="pt-14 pb-8 px-8">
            <div className="text-center mb-8">
              <p className="text-xs uppercase tracking-widest text-mot-gold mb-2 font-medium">You've been invited to join</p>
              <h1 className="text-3xl font-bold text-white mb-2">{invite.name}</h1>
              {invite.description && (
                <p className="text-gray-400 text-sm max-w-sm mx-auto">{invite.description}</p>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                <span className="text-gray-300 font-medium">{invite.online_count} Online</span>
              </div>
              <div className="w-px h-5 bg-white/10" />
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-300 font-medium">{invite.member_count} Members</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleAccept}
                disabled={isJoining}
                className="w-full group relative px-6 py-4 bg-gradient-to-r from-mot-gold-light to-mot-gold rounded-xl font-semibold text-lg transition-all hover:shadow-xl hover:shadow-gold-glow hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none overflow-hidden text-mot-black"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isJoining ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      Accept Invite
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-mot-gold to-mot-gold-deep opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {!isAuthenticated && (
                <p className="text-center text-sm text-gray-500">
                  Don't have an account?{' '}
                  <Link to={`/register?redirect=${encodeURIComponent(location.pathname)}`} className="text-mot-gold hover:text-mot-gold-light font-medium">
                    Sign up
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Powered by MOT
          </span>
          <span>•</span>
          <span>Secure & Fast</span>
        </div>
      </div>
    </div>
  );
};
