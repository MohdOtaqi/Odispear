import React, { useState, useEffect } from 'react';
import { Search, Users, Gaming, Music, Code, BookOpen, Palette, Film, Sparkles, TrendingUp, Star, Shield, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

interface DiscoverServer {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  banner_url?: string;
  member_count: number;
  online_count: number;
  category: string;
  tags: string[];
  verified: boolean;
  partnered: boolean;
  boost_level: number;
  features: string[];
}

const CATEGORIES = [
  { id: 'gaming', name: 'Gaming', icon: Gaming, color: 'from-red-500 to-orange-500' },
  { id: 'music', name: 'Music', icon: Music, color: 'from-purple-500 to-pink-500' },
  { id: 'education', name: 'Education', icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
  { id: 'science', name: 'Science & Tech', icon: Code, color: 'from-green-500 to-emerald-500' },
  { id: 'entertainment', name: 'Entertainment', icon: Film, color: 'from-yellow-500 to-amber-500' },
  { id: 'art', name: 'Art & Design', icon: Palette, color: 'from-indigo-500 to-purple-500' },
];

export const ServerDiscovery: React.FC = () => {
  const navigate = useNavigate();
  const [servers, setServers] = useState<DiscoverServer[]>([]);
  const [filteredServers, setFilteredServers] = useState<DiscoverServer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'members' | 'active' | 'new'>('members');

  useEffect(() => {
    fetchDiscoverServers();
  }, []);

  useEffect(() => {
    filterAndSortServers();
  }, [servers, selectedCategory, searchQuery, sortBy]);

  const fetchDiscoverServers = async () => {
    try {
      const response = await api.get('/guilds/discover');
      setServers(response.data);
    } catch (error) {
      console.error('Failed to fetch discover servers:', error);
      // Use mock data for demo
      setServers(generateMockServers());
    } finally {
      setLoading(false);
    }
  };

  const generateMockServers = (): DiscoverServer[] => {
    return [
      {
        id: '1',
        name: 'Unity Gaming Hub',
        description: 'The ultimate gaming community for all platforms. Join us for game nights, tournaments, and more!',
        icon_url: 'https://ui-avatars.com/api/?name=Unity+Gaming&background=8b5cf6&color=fff',
        banner_url: 'https://source.unsplash.com/800x200/?gaming',
        member_count: 45230,
        online_count: 12450,
        category: 'gaming',
        tags: ['fps', 'mmorpg', 'esports'],
        verified: true,
        partnered: true,
        boost_level: 3,
        features: ['COMMUNITY', 'NEWS', 'ANIMATED_ICON']
      },
      {
        id: '2',
        name: 'Code & Coffee',
        description: 'A community for developers, programmers, and tech enthusiasts. Share knowledge, get help, and collaborate!',
        icon_url: 'https://ui-avatars.com/api/?name=Code+Coffee&background=3b82f6&color=fff',
        member_count: 28500,
        online_count: 8900,
        category: 'science',
        tags: ['programming', 'webdev', 'opensource'],
        verified: true,
        partnered: false,
        boost_level: 2,
        features: ['COMMUNITY', 'DISCOVERABLE']
      },
      {
        id: '3',
        name: 'Music Makers United',
        description: 'For music producers, artists, and enthusiasts. Share your work, collaborate, and discover new sounds!',
        icon_url: 'https://ui-avatars.com/api/?name=Music+Makers&background=ec4899&color=fff',
        member_count: 19200,
        online_count: 5400,
        category: 'music',
        tags: ['production', 'edm', 'hip-hop'],
        verified: false,
        partnered: true,
        boost_level: 2,
        features: ['COMMUNITY', 'STAGE_CHANNELS']
      },
      {
        id: '4',
        name: 'Study Together',
        description: 'Virtual study rooms, homework help, and academic support for students of all levels.',
        icon_url: 'https://ui-avatars.com/api/?name=Study+Together&background=10b981&color=fff',
        member_count: 32100,
        online_count: 9800,
        category: 'education',
        tags: ['study', 'homework', 'tutoring'],
        verified: true,
        partnered: false,
        boost_level: 1,
        features: ['COMMUNITY', 'VOICE_CHANNELS']
      },
      {
        id: '5',
        name: 'Digital Artists Guild',
        description: 'A creative space for digital artists, illustrators, and designers. Weekly challenges and feedback!',
        icon_url: 'https://ui-avatars.com/api/?name=Artists+Guild&background=f59e0b&color=fff',
        member_count: 15600,
        online_count: 4200,
        category: 'art',
        tags: ['illustration', 'design', '3d'],
        verified: false,
        partnered: false,
        boost_level: 1,
        features: ['COMMUNITY', 'GALLERY']
      },
      {
        id: '6',
        name: 'Movie & TV Central',
        description: 'Discuss your favorite movies, TV shows, and streaming series. Spoiler-free zones available!',
        icon_url: 'https://ui-avatars.com/api/?name=Movie+Central&background=ef4444&color=fff',
        member_count: 22300,
        online_count: 6700,
        category: 'entertainment',
        tags: ['movies', 'tv-shows', 'anime'],
        verified: true,
        partnered: true,
        boost_level: 3,
        features: ['COMMUNITY', 'NEWS', 'EVENTS']
      }
    ];
  };

  const filterAndSortServers = () => {
    let filtered = [...servers];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sort
    switch (sortBy) {
      case 'members':
        filtered.sort((a, b) => b.member_count - a.member_count);
        break;
      case 'active':
        filtered.sort((a, b) => b.online_count - a.online_count);
        break;
      case 'new':
        filtered.sort((a, b) => parseInt(b.id) - parseInt(a.id));
        break;
    }

    setFilteredServers(filtered);
  };

  const joinServer = async (serverId: string) => {
    try {
      await api.post(`/guilds/${serverId}/join`);
      navigate(`/app/servers/${serverId}`);
    } catch (error) {
      console.error('Failed to join server:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 backdrop-blur-sm bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-purple-400" />
                Discover Amazing Communities
              </h1>
              <p className="text-gray-400">Find your perfect server from thousands of communities</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="members">Most Members</option>
                <option value="active">Most Active</option>
                <option value="new">Recently Added</option>
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for communities..."
              className="w-full pl-12 pr-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r ' + category.color + ' text-white shadow-lg'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Server Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
                  <div className="w-20 h-20 bg-gray-700 rounded-xl mb-4"></div>
                  <div className="h-6 bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServers.map((server) => (
                <div
                  key={server.id}
                  className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:shadow-2xl transition-all hover:scale-[1.02] hover:border-purple-500 group"
                >
                  {/* Banner */}
                  {server.banner_url && (
                    <div className="h-32 overflow-hidden">
                      <img
                        src={server.banner_url}
                        alt={server.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    {/* Server Icon and Badges */}
                    <div className="flex items-start justify-between mb-4">
                      <img
                        src={server.icon_url}
                        alt={server.name}
                        className="w-16 h-16 rounded-xl"
                      />
                      <div className="flex items-center gap-2">
                        {server.verified && (
                          <Shield className="w-5 h-5 text-green-400" title="Verified" />
                        )}
                        {server.partnered && (
                          <Star className="w-5 h-5 text-purple-400" title="Partnered" />
                        )}
                        {server.boost_level > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-purple-900/50 rounded-lg">
                            <Crown className="w-4 h-4 text-purple-400" />
                            <span className="text-xs text-purple-300">Lvl {server.boost_level}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Server Info */}
                    <h3 className="text-lg font-bold text-white mb-2">{server.name}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{server.description}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {server.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-lg"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-300">
                            {(server.member_count / 1000).toFixed(1)}k
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-gray-300">
                            {(server.online_count / 1000).toFixed(1)}k online
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Join Button */}
                    <button
                      onClick={() => joinServer(server.id)}
                      className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg transition-all hover:scale-105"
                    >
                      Join Server
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredServers.length === 0 && !loading && (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-400 mb-2">No servers found</h3>
              <p className="text-gray-500">Try adjusting your filters or search query</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServerDiscovery;
