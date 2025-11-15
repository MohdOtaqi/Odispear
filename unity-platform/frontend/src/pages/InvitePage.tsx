import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useGuildStore } from '../store/guildStore';
import api from '../lib/api';
import { Users } from 'lucide-react';

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
      navigate('/app');
    } catch {
    } finally {
      setIsJoining(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-4">
        <div className="max-w-md w-full bg-[#313338] rounded-2xl shadow-2xl p-8 text-center border border-red-500/20">
          <h1 className="text-2xl font-bold text-white mb-3">Invite Invalid</h1>
          <p className="text-gray-400 mb-6">{error || 'This invite may have expired or is no longer valid.'}</p>
          <button
            onClick={handleBack}
            className="px-6 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-gray-200 font-medium transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-4">
      <div className="max-w-md w-full bg-[#313338] rounded-2xl shadow-2xl p-8 border border-white/10">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mb-4 overflow-hidden">
            {invite.icon_url ? (
              <img src={invite.icon_url} alt={invite.name} className="w-full h-full object-cover" />
            ) : (
              <Users className="w-8 h-8 text-white" />
            )}
          </div>
          <p className="text-sm uppercase tracking-wide text-gray-400 mb-1">You have been invited to join</p>
          <h1 className="text-2xl font-bold text-white mb-2">{invite.name}</h1>
          {invite.description && (
            <p className="text-sm text-gray-400 text-center max-w-sm">{invite.description}</p>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 mb-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>{invite.online_count} Online</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div>{invite.member_count} Members</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleAccept}
            disabled={isJoining}
            className="flex-1 px-6 py-3 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isJoining ? 'Joining...' : 'Accept Invite'}
          </button>
          <button
            onClick={handleBack}
            className="px-6 py-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-gray-200 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
