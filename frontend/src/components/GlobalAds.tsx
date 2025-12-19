import React from 'react';
import { useLocation } from 'react-router-dom';
import AdComponent from './ads/AdComponent';

interface GlobalAdsProps {
  className?: string;
}

export const GlobalAds: React.FC<GlobalAdsProps> = ({ className }) => {
  const location = useLocation();

  // Don't show ads on login/register pages  
  const hideAdsPages = ['/login', '/register', '/', '/welcome'];
  const shouldHideAds = hideAdsPages.includes(location.pathname);

  console.log('GlobalAds - Current path:', location.pathname, 'Should hide:', shouldHideAds);
  // Force build change v2 - smarter positioning

  if (shouldHideAds) {
    return null;
  }

  return (
    <>
      {/* Desktop Global Ad - Wider and Taller with Smart Positioning */}
      <div className={`hidden md:block fixed ${location.pathname.includes('/dms/') ? 'bottom-20 right-4' : 'bottom-4 right-4'} z-30 ${className}`}>
        <div className="bg-mot-surface/95 backdrop-blur-md border border-mot-gold/50 rounded-lg shadow-lg p-4 w-52">
          <AdComponent
            adFormat="rectangle"
            className="w-full"
            fallbackContent={
              <div className="bg-gradient-to-br from-mot-gold/20 via-mot-gold/15 to-mot-gold/10 rounded-lg p-4 text-center border border-mot-gold/40">
                <div className="w-10 h-10 mx-auto mb-2 bg-mot-gold/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💎</span>
                </div>
                <p className="text-sm text-mot-gold font-bold mb-1">MOT Premium</p>
                <p className="text-xs text-white/80 leading-tight mb-3">Enjoy an ad-free experience</p>
                <button className="w-full py-2 px-4 bg-gradient-to-r from-mot-gold to-mot-gold-light text-mot-black rounded-lg text-sm font-bold hover:scale-105 transition-transform shadow-gold-glow">
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
