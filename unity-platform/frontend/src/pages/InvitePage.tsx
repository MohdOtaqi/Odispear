import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Check, X, Loader2, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface InviteInfo {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  member_count: number;
  online_count: number;
}

export const InvitePage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const fetchInviteInfo = async () => {
      if (!code) {
        setError('Invalid invite link');
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get(`/invites/${code}`);
        setInviteInfo(data);
      } catch (err: any) {
        const message = err.response?.data?.error || err.response?.data?.message || 'Invalid or expired invite';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchInviteInfo();
  }, [code]);

  const handleJoin = async () => {
    if (!isAuthenticated) {
      // Save invite code and redirect to login
      localStorage.setItem('pendingInvite', code || '');
      navigate('/login');
      return;
    }

    setJoining(true);
    try {
      const { data } = await api.post(`/invites/${code}/use`);
      setJoined(true);
      toast.success(data.message || 'Successfully joined server!');
      
      // Redirect to the server after a short delay
      setTimeout(() => {
        navigate('/app');
        window.location.reload(); // Reload to fetch new guilds
      }, 1500);
    } catch (err: any) {
      const message = err.response?.data?.error || err.response?.data?.message || 'Failed to join server';
      toast.error(message);
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#313338] rounded-2xl shadow-2xl p-8 text-center animate-scale-in">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Invite Invalid</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button variant="primary" onClick={() => navigate('/app')}>
            Go to App
          </Button>
        </div>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#313338] rounded-2xl shadow-2xl p-8 text-center animate-scale-in">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
          <p className="text-gray-400">You've joined {inviteInfo?.name}. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md bg-[#313338] rounded-2xl shadow-2xl overflow-hidden animate-scale-in relative z-10">
        {/* Header */}
        <div className="h-24 bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
          {inviteInfo?.icon_url ? (
            <img 
              src={inviteInfo.icon_url} 
              alt={inviteInfo.name}
              className="w-16 h-16 rounded-full border-4 border-white/20 shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/20 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">{inviteInfo?.name}</h1>
            {inviteInfo?.description && (
              <p className="text-gray-400 text-sm mb-4">{inviteInfo.description}</p>
            )}
            
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-gray-400">{inviteInfo?.online_count || 0} Online</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">{inviteInfo?.member_count || 0} Members</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-center text-gray-400 text-sm">
              {isAuthenticated 
                ? `${user?.username}, you've been invited to join`
                : 'You need to login to join this server'}
            </p>
            
            <Button
              variant="primary"
              size="lg"
              onClick={handleJoin}
              loading={joining}
              className="w-full"
            >
              {isAuthenticated ? 'Join Server' : 'Login to Join'}
            </Button>

            {isAuthenticated && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/app')}
                className="w-full"
              >
                Cancel
              </Button>
            )}

            {!isAuthenticated && (
              <div className="text-center">
                <button
                  onClick={() => navigate('/register')}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Don't have an account? Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
