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
          </p>- Mobile Optimized 
        </div>space-y-3md:md:4 md:space-y-0 mb-d:m
gradient-to-br fro-m5to-mot-surface/20 dx4 md:p-gl2 shadow-lg
        {/* Feature Highlights */}7 md:w-7 md:h-2 md:mb- drop-shadow-md
        <div className="grid grid-cols-1 mdd-cols-31 md:mb-  text-sm md:text-basegap-6 mb-8">
          <div className="bg-mot-sur3ace/30 bxa cd:text-sm leading-relaxedkdrop-blur-sm rounded-lg p-6 border border-mot-border/30">
            <MessageCircle className="w-8 h-8 text-mot-gold mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Text Chat</h3>
            <p className="texgradient-to-br frot-m-gray-400 t5xtto-mot-surface/20 -sm">Rich messgding with xeoji4 md:p-s, files, and more</g>l2 shadow-lg
          </div>w-7 md: h-7md: mb-2md: drop-shadow-md
           mb-1md: text-sm md:text-base
          <div className="bg-mot-sur3ac text-xsemd:/30 bac leading-relaxedkdrop-blur-sm rounded-lg p-6 border border-mot-border/30">
            <Headphones className="w-8 h-8 text-mot-gold mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Voice & Video</h3>
            <p className="tg-eradient-to-br from-mot-surface/50 toxt-gray-400 t2xt-sm">Crystal cedar communxi p-4amd:tion</p>gl2 shadow-lg
          </div>w-7 md: h-7md: mb-2md: drop-shadow-md
           mb-1md: text-sm md:text-base
          <div className="bg-mot-sur3ac text-xsemd:/30 bac leading-relaxedkdrop-blur-sm rounded-lg p-6 border border-mot-border/30">
            <Users className="w-8 h-8 text-mot-gold mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Communities</h3>
            <p className="text-gray-400 text-sm">Build and manage your servers</p>
          </div>- Mobile Enhanced 
        </div>wfull

        {/* Action Buttons */}
        <div className="space-y-3 md:s200 md:text-gray-pace-y-4"> font-medium md:font-normal px-2
          {guilds.length > 0 ? (
            <>
              <p className="tew-xutyd:text-base">
                Select a server from the sidebar to get started
              </p>
              <div className=w-full md:w-auto "flexmd: x-8 pfl4 md:py-ex-cogradient-to-r frol-m gap-3 jto-mot-gold-ligut hstifyfromenter">hover:o-mot-gold tx md:rounded-ll hver:shaxl tranfor text-sm md:text-base
                <button
                  onClick={() => navigate('/app/friends')}
                  className="px-6 py-3 bg-mot-gold hover:bg-mot-gold-light text-mot-black font-semibold rounded-lg transition-all shadow-gold-glow-sm hover:scale-105"
                >
                  Browse Friends & DMs
                </button>
              </div>
            </>200 md:text-gray- font-medium md:font-normal px-2
          ) : (
            <>
              <p className="tespac--y-2rmd:spac-0ymd:w-fblld:text-base">
                Get started by creating your first server or joining one
              </p>
              <div className=w-full md:w-auto "fle md:px-8 py-4xmd: flex-g-gradient-to-r from-mot-cold tool gap-3 -lightjustifyfromenter">ht over:to-mo-goldd rounde-xlmd:l hver:shaxl tranfor text-sm md:text-base
                <button
                  onClick={() => navigate('/app/friends')}
                  className="px-6 py-3 bg-mot-gold hover:bg-mot-gold-light text-mot-black font-semibold rounded-lg transition-all shadow-gold-glow-sm hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 md:w-5 h-4 md:h-5" />
                  Create Server
                </button>w-full md:w-auto  md:px-8 py-4md:/60 backdrop-blur-smd rounde-xlmd:gl/30old shadw-g hover:shaow-xl transform hover:scale-10 text-sm md:text-base
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
