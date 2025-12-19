import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, MessageCircle, Headphones } from 'lucide-react';
import { useGuildStore } from '../store/guildStore';

export const DefaultWelcome: React.FC = () => {
  const navigate = useNavigate();
  const { guilds } = useGuildStore();

  return (
    <div className="flex-1 flex items-center justify-center bg-mot-black relative overflow-hidden min-h-screen md:min-h-0 pb-24 md:pb-0">
      {/* Enhanced Mobile Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 right-10 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-mot-gold/8 rounded-full blur-[100px] md:blur-[150px]" />
        <div className="absolute bottom-20 left-10 w-[150px] md:w-[300px] h-[150px] md:h-[300px] bg-mot-gold/5 rounded-full blur-[80px] md:blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-mot-gold/3 rounded-full blur-[120px] md:blur-[200px]" />
      </div>

      <div className="text-center max-w-sm md:max-w-2xl mx-auto px-4 md:px-6 relative z-10 w-full">
        {/* Logo */}
        <div className="mb-6 md:mb-8">
          <div className="mb-4 md:mb-6">
            <img
              src="/MOT.gif"
              alt="MOT Platform"
              className="h-16 md:h-32 w-auto mx-auto drop-shadow-[0_0_25px_rgba(245,166,35,0.4)] animate-pulse"
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

        {/* Feature Highlights - Mobile Optimized */}
        <div className="space-y-3 md:grid md:grid-cols-3 md:gap-4 md:space-y-0 mb-6 md:mb-8">
          <div className="bg-gradient-to-br from-mot-surface/50 to-mot-surface/20 backdrop-blur-md rounded-xl p-4 md:p-6 border border-mot-gold/20 shadow-lg">
            <MessageCircle className="w-7 md:w-8 h-7 md:h-8 text-mot-gold mx-auto mb-2 md:mb-3 drop-shadow-md" />
            <h3 className="text-white font-bold mb-1 md:mb-2 text-sm md:text-base">Text Chat</h3>
            <p className="text-gray-300 text-xs md:text-sm leading-relaxed">Rich messaging with emojis, files, and more</p>
          </div>
          
          <div className="bg-gradient-to-br from-mot-surface/50 to-mot-surface/20 backdrop-blur-md rounded-xl p-4 md:p-6 border border-mot-gold/20 shadow-lg">
            <Headphones className="w-7 md:w-8 h-7 md:h-8 text-mot-gold mx-auto mb-2 md:mb-3 drop-shadow-md" />
            <h3 className="text-white font-bold mb-1 md:mb-2 text-sm md:text-base">Voice & Video</h3>
            <p className="text-gray-300 text-xs md:text-sm leading-relaxed">Crystal clear communication</p>
          </div>
          
          <div className="bg-gradient-to-br from-mot-surface/50 to-mot-surface/20 backdrop-blur-md rounded-xl p-4 md:p-6 border border-mot-gold/20 shadow-lg">
            <Users className="w-7 md:w-8 h-7 md:h-8 text-mot-gold mx-auto mb-2 md:mb-3 drop-shadow-md" />
            <h3 className="text-white font-bold mb-1 md:mb-2 text-sm md:text-base">Communities</h3>
            <p className="text-gray-300 text-xs md:text-sm leading-relaxed">Build and manage your servers</p>
          </div>
        </div>

        {/* Action Buttons - Mobile Enhanced */}
        <div className="space-y-3 w-full">
          {guilds.length > 0 ? (
            <>
              <p className="text-gray-200 md:text-gray-300 mb-3 md:mb-4 text-sm md:text-base font-medium md:font-normal px-2">
                Select a server from the sidebar to get started
              </p>
              <div className="w-full">
                <button
                  onClick={() => navigate('/app/friends')}
                  className="w-full md:w-auto px-6 md:px-8 py-4 md:py-3 bg-gradient-to-r from-mot-gold to-mot-gold-light hover:from-mot-gold-light hover:to-mot-gold text-mot-black font-bold rounded-xl md:rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm md:text-base"
                >
                  Browse Friends & DMs
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-200 md:text-gray-300 mb-4 md:mb-6 text-sm md:text-base font-medium md:font-normal px-2">
                Get started by creating your first server or joining one
              </p>
              <div className="space-y-2 md:space-y-3 w-full">
                <button
                  onClick={() => navigate('/app/friends')}
                  className="w-full md:w-auto px-6 md:px-8 py-4 md:py-3 bg-gradient-to-r from-mot-gold to-mot-gold-light hover:from-mot-gold-light hover:to-mot-gold text-mot-black font-bold rounded-xl md:rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <Plus className="w-4 md:w-5 h-4 md:h-5" />
                  Create Server
                </button>
                <button
                  onClick={() => navigate('/app/friends')}
                  className="w-full md:w-auto px-6 md:px-8 py-4 md:py-3 bg-mot-surface/60 backdrop-blur-sm hover:bg-mot-surface text-white font-bold rounded-xl md:rounded-lg transition-all border border-mot-gold/30 hover:border-mot-gold shadow-lg hover:shadow-xl transform hover:scale-105 text-sm md:text-base"
                >
                  Browse Friends
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Instructions */}
        <div className="mt-6 md:mt-8 md:hidden">
          <p className="text-gray-500 text-xs">
            Tap the menu button (☰) in the top-left to access servers and friends
          </p>
        </div>
      </div>
    </div>
  );
};

export default DefaultWelcome;