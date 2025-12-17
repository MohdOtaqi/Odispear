import React, { useState, useEffect } from 'react';
import { Zap, Crown, Star, Gift, TrendingUp, Shield, Sparkles, Heart, Gem, Trophy, Target, Award } from 'lucide-react';
import { useGuildStore } from '../store/guildStore';
import api from '../lib/api';

interface BoostPerks {
  level: number;
  perks: string[];
  emoji_slots: number;
  upload_limit: number;
  audio_quality: number;
  video_quality: string;
  vanity_url: boolean;
  banner: boolean;
  animated_icon: boolean;
  splash: boolean;
  member_limit: number;
}

const BOOST_LEVELS: BoostPerks[] = [
  {
    level: 0,
    perks: ['Basic features'],
    emoji_slots: 50,
    upload_limit: 8,
    audio_quality: 96,
    video_quality: '720p',
    vanity_url: false,
    banner: false,
    animated_icon: false,
    splash: false,
    member_limit: 100000,
  },
  {
    level: 1,
    perks: ['+50 emoji slots', 'Better audio quality', 'Animated server icon', 'Server banner'],
    emoji_slots: 100,
    upload_limit: 8,
    audio_quality: 128,
    video_quality: '720p',
    vanity_url: false,
    banner: true,
    animated_icon: true,
    splash: false,
    member_limit: 250000,
  },
  {
    level: 2,
    perks: ['All Level 1 perks', '+50 more emoji slots', 'Higher upload limit', 'HD video', 'Server banner'],
    emoji_slots: 150,
    upload_limit: 50,
    audio_quality: 256,
    video_quality: '1080p',
    vanity_url: false,
    banner: true,
    animated_icon: true,
    splash: false,
    member_limit: 500000,
  },
  {
    level: 3,
    perks: ['All Level 2 perks', 'Vanity URL', '+100 more emoji slots', 'Maximum upload limit', 'Ultra HD video'],
    emoji_slots: 250,
    upload_limit: 100,
    audio_quality: 384,
    video_quality: '4K',
    vanity_url: true,
    banner: true,
    animated_icon: true,
    splash: true,
    member_limit: 1000000,
  },
];

export const ServerBoost: React.FC<{ guildId: string }> = ({ guildId }) => {
  const { selectedGuild } = useGuildStore();
  const [boostLevel, setBoostLevel] = useState(0);
  const [boostCount, setBoostCount] = useState(0);
  const [boosters, setBoosters] = useState<any[]>([]);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [userHasBoosted, setUserHasBoosted] = useState(false);
  const [boostHistory, setBoostHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchBoostInfo();
  }, [guildId]);

  const fetchBoostInfo = async () => {
    try {
      const response = await api.get(`/guilds/${guildId}/boosts`);
      setBoostLevel(response.data.level);
      setBoostCount(response.data.count);
      setBoosters(response.data.boosters);
      setUserHasBoosted(response.data.userHasBoosted);
      setBoostHistory(response.data.history || []);
    } catch (error) {
      // Mock data for demo
      setBoostLevel(2);
      setBoostCount(7);
      setBoosters([
        { id: '1', username: 'Alex', avatar: 'https://ui-avatars.com/api/?name=Alex&background=6366f1&color=fff', boostingSince: new Date(Date.now() - 30 * 86400000) },
        { id: '2', username: 'Sarah', avatar: 'https://ui-avatars.com/api/?name=Sarah&background=ec4899&color=fff', boostingSince: new Date(Date.now() - 15 * 86400000) },
        { id: '3', username: 'Mike', avatar: 'https://ui-avatars.com/api/?name=Mike&background=10b981&color=fff', boostingSince: new Date(Date.now() - 7 * 86400000) },
      ]);
    }
  };

  const boostServer = async () => {
    try {
      await api.post(`/guilds/${guildId}/boost`);
      setBoostCount(prev => prev + 1);
      setUserHasBoosted(true);
      
      // Check if level increased
      const newLevel = getBoostLevel(boostCount + 1);
      if (newLevel > boostLevel) {
        setBoostLevel(newLevel);
        // Show level up animation
      }
    } catch (error) {
      console.error('Failed to boost server:', error);
    }
  };

  const getBoostLevel = (count: number): number => {
    if (count >= 14) return 3;
    if (count >= 7) return 2;
    if (count >= 2) return 1;
    return 0;
  };

  const getNextLevelRequirement = (): number => {
    if (boostLevel === 0) return 2;
    if (boostLevel === 1) return 7;
    if (boostLevel === 2) return 14;
    return 0;
  };

  const getProgressPercentage = (): number => {
    const nextReq = getNextLevelRequirement();
    const prevReq = boostLevel === 0 ? 0 : boostLevel === 1 ? 2 : boostLevel === 2 ? 7 : 14;
    if (boostLevel === 3) return 100;
    return ((boostCount - prevReq) / (nextReq - prevReq)) * 100;
  };

  return (
    <>
      {/* Boost Button */}
      <button
        onClick={() => setShowBoostModal(true)}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all hover:scale-105"
      >
        <Zap className="w-4 h-4" />
        <span className="font-medium">Server Boost</span>
      </button>

      {/* Boost Modal */}
      {showBoostModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="relative h-48 bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-600 p-6">
              <button
                onClick={() => setShowBoostModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white"
              >
                ×
              </button>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Zap className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Boost {selectedGuild?.name || 'This Server'}
                  </h2>
                  <p className="text-white/80">
                    Help unlock awesome perks for everyone in the server!
                  </p>
                </div>
              </div>

              {/* Current Level Badge */}
              <div className="absolute bottom-4 right-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Crown className="w-5 h-5 text-yellow-300" />
                  <span className="text-white font-bold">Level {boostLevel}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Progress to Level {Math.min(boostLevel + 1, 3)}</span>
                  <span className="text-sm text-gray-400">
                    {boostCount}/{getNextLevelRequirement()} Boosts
                  </span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  {[0, 1, 2, 3].map(level => (
                    <div
                      key={level}
                      className={`flex items-center gap-1 ${
                        level <= boostLevel ? 'text-purple-400' : 'text-gray-600'
                      }`}
                    >
                      {level <= boostLevel ? (
                        <Star className="w-4 h-4 fill-current" />
                      ) : (
                        <Star className="w-4 h-4" />
                      )}
                      <span className="text-xs">Level {level}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Perks */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Current Perks</h3>
                  <div className="space-y-3">
                    {BOOST_LEVELS[boostLevel].perks.map((perk, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Sparkles className="w-3 h-3 text-green-400" />
                        </div>
                        <span className="text-sm text-gray-300">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Level Perks */}
                {boostLevel < 3 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Next Level Unlocks</h3>
                    <div className="space-y-3 opacity-60">
                      {BOOST_LEVELS[boostLevel + 1].perks.slice(0, 3).map((perk, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Gift className="w-3 h-3 text-gray-400" />
                          </div>
                          <span className="text-sm text-gray-400">{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Boosters List */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Server Boosters ({boosters.length})</h3>
                <div className="grid grid-cols-3 gap-3">
                  {boosters.map(booster => (
                    <div key={booster.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                      <img src={booster.avatar} alt={booster.username} className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{booster.username}</p>
                        <p className="text-xs text-gray-400">
                          {Math.floor((Date.now() - booster.boostingSince.getTime()) / 86400000)} days
                        </p>
                      </div>
                      <Gem className="w-5 h-5 text-purple-400" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Boost Benefits Grid */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Emoji Slots</p>
                  <p className="text-lg font-bold text-white">{BOOST_LEVELS[boostLevel].emoji_slots}</p>
                </div>
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Upload Limit</p>
                  <p className="text-lg font-bold text-white">{BOOST_LEVELS[boostLevel].upload_limit}MB</p>
                </div>
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <Award className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Audio Quality</p>
                  <p className="text-lg font-bold text-white">{BOOST_LEVELS[boostLevel].audio_quality}kbps</p>
                </div>
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <Shield className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Video Quality</p>
                  <p className="text-lg font-bold text-white">{BOOST_LEVELS[boostLevel].video_quality}</p>
                </div>
              </div>

              {/* Boost Button */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  {userHasBoosted ? (
                    <span className="text-green-400">✓ You're boosting this server!</span>
                  ) : (
                    <span>Boost to help reach the next level</span>
                  )}
                </div>
                <button
                  onClick={() => {
                    boostServer();
                    setShowBoostModal(false);
                  }}
                  disabled={userHasBoosted}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    userHasBoosted
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                  }`}
                >
                  {userHasBoosted ? 'Already Boosting' : 'Boost This Server'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ServerBoost;
