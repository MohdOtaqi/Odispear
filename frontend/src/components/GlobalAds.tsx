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
  // Force build change for smaller ads
  
  if (shouldHideAds) {
    return null;
  }

  return (
    <>
      {/* Desktop Global Ad - Smart Positioning */}
      <div className={`hidden md:block fixed ${location.pathname.includes('/dm/') ? 'top-20 right-4' : 'bottom-4 right-4'} z-40 ${className}`}>
        <div className="bg-mot-surface border border-mot-gold rounded-lg shadow-lg p-2 w-44">
          <AdComponent 
            adFormat="rectangle"
            className="w-full"
            fallbackContent={
              <div className="bg-gradient-to-br from-mot-gold/25 to-mot-gold/15 rounded p-2 text-center border border-mot-gold/40">
                <p className="text-xs text-mot-gold font-bold mb-1">💎 MOT Premium</p>
                <p className="text-[10px] text-white/90 leading-tight">Ad-free experience</p>
                <button className="mt-1 px-2 py-0.5 bg-mot-gold text-mot-black rounded text-[10px] font-bold">
                  Upgrade
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
            adFormat="banner"
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
