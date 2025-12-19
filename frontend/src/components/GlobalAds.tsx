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
  
  if (shouldHideAds) {
    return null;
  }

  return (
    <>
      {/* Desktop Global Ad - Bottom Right Corner */}
      <div className={`hidden md:block fixed bottom-4 right-4 z-40 ${className}`}>
        <div className="bg-mot-surface/95 backdrop-blur-md rounded-lg border border-mot-border/50 shadow-xl p-3 w-64">
          <AdComponent 
            adFormat="rectangle"
            className="w-full"
            fallbackContent={
              <div className="bg-gradient-to-br from-mot-gold/20 to-mot-gold/10 rounded-lg p-4 text-center border border-mot-gold/30">
                <p className="text-xs text-mot-gold font-medium mb-1">Support MOT Platform</p>
                <p className="text-[10px] text-gray-400">Premium ad-free experience available</p>
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
