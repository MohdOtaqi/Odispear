import React from 'react';
import { useLocation } from 'react-router-dom';
import { Gem } from 'lucide-react';
import AdComponent from './ads/AdComponent';

interface GlobalAdsProps {
  className?: string;
}

export const GlobalAds: React.FC<GlobalAdsProps> = ({ className }) => {
  const location = useLocation();

  // Don't show ads on login/register pages  
  const hideAdsPages = ['/login', '/register', '/', '/welcome'];
  const shouldHideAds = hideAdsPages.includes(location.pathname);

  if (shouldHideAds) {
    return null;
  }

  return (
    <>
      {/* Desktop Global Ad - Same style as sidebar ad, shows everywhere */}
      <div className={`hidden md:block fixed bottom-4 right-4 z-30 ${className}`}>
        <div className="bg-mot-surface/95 backdrop-blur-md border border-mot-gold/50 rounded-xl shadow-lg overflow-hidden w-[240px]">
          <AdComponent
            adFormat="rectangle"
            className="w-full"
            fallbackContent={
              <div className="bg-gradient-to-br from-mot-gold/20 via-mot-gold/15 to-mot-gold/10 p-4 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-mot-gold/20 rounded-full flex items-center justify-center">
                  <Gem className="w-6 h-6 text-mot-gold" />
                </div>
                <p className="text-sm text-mot-gold font-bold mb-1">MOT Premium</p>
                <p className="text-xs text-white/80 leading-tight mb-3">Enjoy an ad-free experience</p>
                <button className="w-full py-2.5 px-4 bg-gradient-to-r from-mot-gold to-mot-gold-light text-mot-black rounded-lg text-sm font-bold hover:scale-105 transition-transform shadow-gold-glow">
                  Upgrade Now
                </button>
              </div>
            }
          />
        </div>
      </div>

      {/* Mobile Global Ad - Bottom Banner */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 ${className}`}>
        <div className="bg-mot-surface/95 backdrop-blur-md border-t border-mot-border/50 p-3 safe-area-inset-bottom">
          <AdComponent
            adFormat="horizontal"
            className="w-full max-w-sm mx-auto"
            fallbackContent={
              <div className="bg-gradient-to-r from-mot-gold/15 to-mot-gold/25 rounded-xl p-3 text-center border border-mot-gold/40">
                <p className="text-xs text-mot-gold font-bold mb-1">💎 Support MOT Platform</p>
                <p className="text-[10px] text-gray-300">Join Premium for ad-free experience</p>
              </div>
            }
          />
        </div>
      </div>
    </>
  );
};

export default GlobalAds;
