import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, MessageCircle, Headphones } from 'lucide-react';
import { useGuildStore } from '../store/guildStore';

export const DefaultWelcome: React.FC = () => {
  const navigate = useNavigate();
  const { guilds } = useGuildStore();

  return (
    <div className="flex-1 flex items-center justify-center bg-mot-black relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-[400px] h-[400px] bg-mot-gold/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] bg-mot-gold/3 rounded-full blur-[100px]" />
      </div>

      <div className="text-center max-w-sm md:max-w-2xl mx-auto px-6 md:px-6 relative z-10 w-full">
        {/* Logo */}
        <div className="mb-8 md:mb-8">
          <div className="mb-6 md:mb-8">
            <img
              src="/MOT.gif"
              alt="MOT Platform"
              className="h-20 md:h-32 w-auto mx-auto drop-shadow-[0_0_25px_rgba(245,166,35,0.4)] animate-pulse"
            />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-3 leading-tight">
            Welcome to <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-mot-gold to-mot-gold-light">MOT Platform</span>
          </h1>
          <p className="text-gray-300 md:text-gray-400 text-sm md:text-lg font-medium md:font-normal">
            Modern voice, video, and text chat for communities
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-mot-surface/30 backdrop-blur-sm rounded-lg p-6 border border-mot-border/30">
            <MessageCircle className="w-8 h-8 text-mot-gold mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Text Chat</h3>
            <p className="text-gray-400 text-sm">Rich messaging with emojis, files, and more</p>
          </div>
          
          <div className="bg-mot-surface/30 backdrop-blur-sm rounded-lg p-6 border border-mot-border/30">
            <Headphones className="w-8 h-8 text-mot-gold mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Voice & Video</h3>
            <p className="text-gray-400 text-sm">Crystal clear communication</p>
          </div>
          
          <div className="bg-mot-surface/30 backdrop-blur-sm rounded-lg p-6 border border-mot-border/30">
            <Users className="w-8 h-8 text-mot-gold mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Communities</h3>
            <p className="text-gray-400 text-sm">Build and manage your servers</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 md:space-y-4">
          {guilds.length > 0 ? (
            <>
              <p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">
                Select a server from the sidebar to get started
              </p>
              <div className="flex flex-col gap-3 justify-center">
                <button
                  onClick={() => navigate('/app/friends')}
                  className="px-6 py-3 bg-mot-gold hover:bg-mot-gold-light text-mot-black font-semibold rounded-lg transition-all shadow-gold-glow-sm hover:scale-105"
                >
                  Browse Friends & DMs
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-300 mb-4 md:mb-6 text-sm md:text-base">
                Get started by creating your first server or joining one
              </p>
              <div className="flex flex-col gap-3 justify-center">
                <button
                  onClick={() => navigate('/app/friends')}
                  className="px-6 py-3 bg-mot-gold hover:bg-mot-gold-light text-mot-black font-semibold rounded-lg transition-all shadow-gold-glow-sm hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 md:w-5 h-4 md:h-5" />
                  Create Server
                </button>
                <button
                  onClick={() => navigate('/app/friends')}
                  className="px-6 py-3 bg-mot-surface hover:bg-mot-surface-subtle text-white font-semibold rounded-lg transition-all border border-mot-border hover:border-mot-gold/50"
                >
                  Browse Friends
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Instructions */}
        <div className="mt-8 md:hidden">
          <p className="text-gray-500 text-sm">
            Tap the menu button (☰) in the top-left to access servers and friends
          </p>
        </div>
      </div>
    </div>
  );
};

export default DefaultWelcome;
