import React, { useState, useEffect } from 'react';
import { Calendar, Users, ChevronRight, UserCircle, Gem } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar } from '../ui/Avatar';
import { UserProfileModal } from '../UserProfileModal';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

interface DMParticipant {
    id: string;
    user_id?: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
    status?: 'online' | 'idle' | 'dnd' | 'offline';
    created_at?: string;
}

interface DMChannel {
    id: string;
    type?: 'dm' | 'group_dm';
    name?: string;
    participants: DMParticipant[];
}

interface DMProfileSidebarProps {
    channel: DMChannel;
    className?: string;
}

export const DMProfileSidebar: React.FC<DMProfileSidebarProps> = ({ channel, className = '' }) => {
    const { user } = useAuthStore();
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [mutualServers, setMutualServers] = useState<number>(0);
    const [mutualFriends, setMutualFriends] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    // Find the other participant (not the current user)
    const otherParticipant = channel.participants?.find(
        (p) => (p.id !== user?.id && p.user_id !== user?.id)
    ) || channel.participants?.[0];

    const isGroupDM = channel.type === 'group_dm' || (channel.participants?.length || 0) > 2;

    useEffect(() => {
        if (otherParticipant && !isGroupDM) {
            fetchUserDetails();
        }
    }, [otherParticipant?.id, otherParticipant?.user_id]);

    const fetchUserDetails = async () => {
        if (!otherParticipant) return;

        try {
            setLoading(true);
            const userId = otherParticipant.user_id || otherParticipant.id;
            const response = await api.get(`/users/${userId}`);
            setUserProfile(response.data);

            // Fetch real mutual data from API
            try {
                const mutualResponse = await api.get(`/users/${userId}/mutuals`);
                setMutualServers(mutualResponse.data.mutualServers || 0);
                setMutualFriends(mutualResponse.data.mutualFriends || 0);
            } catch (mutualError) {
                // Fallback if mutuals endpoint doesn't exist yet
                console.log('Mutuals endpoint not available, using defaults');
                setMutualServers(0);
                setMutualFriends(0);
            }
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'idle': return 'bg-yellow-500';
            case 'dnd': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    // Helper to get full image URL
    const getImageUrl = (url?: string): string | undefined => {
        if (!url) return undefined;
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        const apiUrl = (import.meta as any).env?.VITE_API_URL || ((import.meta as any).env?.PROD ? 'https://n0tmot.com/api' : 'http://localhost:5000');
        return `${apiUrl}${url.startsWith('/') ? url : `/${url}`}`;
    };

    if (isGroupDM) {
        return null; // Don't show sidebar for group DMs
    }

    if (!otherParticipant) {
        return null;
    }

    const displayName = otherParticipant.display_name || otherParticipant.username;
    const avatarUrl = getImageUrl(userProfile?.avatar_url || otherParticipant.avatar_url);
    const memberSince = userProfile?.created_at ? new Date(userProfile.created_at) : null;

    return (
        <>
            <div className={`w-[280px] bg-mot-surface border-l border-mot-border flex flex-col ${className}`}>
                {/* Header with avatar and status */}
                <div className="p-4">
                    {/* User Card - Matches Discord style */}
                    <div className="bg-mot-surface-subtle rounded-xl overflow-hidden border border-mot-border">
                        {/* Banner area with gradient */}
                        <div className="h-16 bg-gradient-to-r from-mot-gold-deep via-mot-gold to-mot-gold-light relative">
                            {userProfile?.banner_url && (
                                <img
                                    src={getImageUrl(userProfile.banner_url)}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>

                        {/* Avatar overlapping banner */}
                        <div className="relative px-4 pb-4">
                            <div className="relative -mt-8 mb-2">
                                <div className="w-16 h-16 rounded-full border-4 border-mot-surface-subtle overflow-hidden bg-mot-surface">
                                    <Avatar
                                        src={avatarUrl}
                                        alt={displayName}
                                        size="lg"
                                        fallback={displayName.charAt(0)}
                                        className="w-full h-full"
                                    />
                                </div>
                                {/* Status indicator */}
                                <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-4 border-mot-surface-subtle ${getStatusColor(userProfile?.status || otherParticipant.status)}`} />
                            </div>

                            {/* User info */}
                            <div>
                                <h3 className="font-bold text-white text-lg">{displayName}</h3>
                                <p className="text-sm text-gray-400">@{otherParticipant.username}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="mx-4 h-px bg-mot-border" />

                {/* Info sections */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    {/* Member Since */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            Member Since
                        </h4>
                        <p className="text-sm text-gray-300">
                            {memberSince ? format(memberSince, 'MMM d, yyyy') : 'Unknown'}
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-mot-border" />

                    {/* Mutual Servers */}
                    <button className="w-full flex items-center justify-between p-3 bg-mot-surface-subtle hover:bg-mot-gold/10 rounded-lg transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-mot-gold/20 rounded-lg flex items-center justify-center">
                                <Users className="w-4 h-4 text-mot-gold" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-medium text-white">Mutual Servers</p>
                                <p className="text-xs text-gray-400">
                                    {loading ? '...' : `${mutualServers} server${mutualServers !== 1 ? 's' : ''}`}
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-mot-gold transition-colors" />
                    </button>

                    {/* Mutual Friends */}
                    <button className="w-full flex items-center justify-between p-3 bg-mot-surface-subtle hover:bg-mot-gold/10 rounded-lg transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-mot-gold/20 rounded-lg flex items-center justify-center">
                                <Users className="w-4 h-4 text-mot-gold" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-medium text-white">Mutual Friends</p>
                                <p className="text-xs text-gray-400">
                                    {loading ? '...' : `${mutualFriends} friend${mutualFriends !== 1 ? 's' : ''}`}
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-mot-gold transition-colors" />
                    </button>

                    {/* Divider before ad */}
                    <div className="h-px bg-mot-border" />

                    {/* Ad Section - Inside Sidebar */}
                    <div className="bg-gradient-to-br from-mot-gold/20 via-mot-gold/15 to-mot-gold/10 rounded-lg p-4 text-center border border-mot-gold/40">
                        <div className="w-10 h-10 mx-auto mb-2 bg-mot-gold/20 rounded-full flex items-center justify-center">
                            <Gem className="w-5 h-5 text-mot-gold" />
                        </div>
                        <p className="text-sm text-mot-gold font-bold mb-1">MOT Premium</p>
                        <p className="text-xs text-white/80 leading-tight mb-3">Enjoy an ad-free experience</p>
                        <button className="w-full py-2 px-4 bg-gradient-to-r from-mot-gold to-mot-gold-light text-mot-black rounded-lg text-sm font-bold hover:scale-105 transition-transform shadow-gold-glow">
                            Upgrade Now
                        </button>
                    </div>
                </div>

                {/* View Full Profile Button */}
                <div className="p-4 border-t border-mot-border">
                    <button
                        onClick={() => setShowProfileModal(true)}
                        className="w-full py-2.5 px-4 bg-mot-surface-subtle hover:bg-mot-gold/10 border border-mot-border hover:border-mot-gold/30 rounded-lg text-sm font-medium text-gray-300 hover:text-mot-gold transition-all flex items-center justify-center gap-2"
                    >
                        <UserCircle className="w-4 h-4" />
                        View Full Profile
                    </button>
                </div>
            </div>

            {/* Profile Modal */}
            {showProfileModal && (
                <UserProfileModal
                    userId={otherParticipant.user_id || otherParticipant.id}
                    onClose={() => setShowProfileModal(false)}
                />
            )}
        </>
    );
};

export default DMProfileSidebar;
