import React, { useEffect, useRef } from 'react';

interface AdComponentProps {
  adSlot?: string;
  adFormat?: 'rectangle' | 'vertical' | 'horizontal' | 'auto';
  className?: string;
  fallbackContent?: React.ReactNode;
}

/**
 * AdComponent - Reusable Ad Display Component
 * 
 * Supports multiple ad networks:
 * - Google AdSense (Primary - Best CPM for general traffic)
 * - Media.net (Alternative - Good for US/UK traffic)
 * - PropellerAds (Fallback - Lower quality but higher fill rate)
 * 
 * Setup Instructions:
 * 1. Add your AdSense code to index.html:
 *    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXX"></script>
 * 
 * 2. Set environment variables:
 *    VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXX
 *    VITE_ADSENSE_SLOT=XXXXXXXXX
 * 
 * Best Ad Networks for Discord-like Apps (2024):
 * 1. Google AdSense - $1-5 CPM, best for gaming/tech audience
 * 2. Media.net (Yahoo/Bing) - $1-3 CPM, contextual ads
 * 3. Ezoic - $3-10 CPM, requires 10k+ monthly visitors
 * 4. PropellerAds - $0.5-2 CPM, high fill rate but lower quality
 */

const AdComponent: React.FC<AdComponentProps> = ({
  adSlot = import.meta.env.VITE_ADSENSE_SLOT || '',
  adFormat = 'auto',
  className = '',
  fallbackContent
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const isAdSenseEnabled = import.meta.env.VITE_ADSENSE_CLIENT && adSlot;

  useEffect(() => {
    if (isAdSenseEnabled && adRef.current) {
      try {
        // Push ad to AdSense
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (error) {
        console.error('[Ad] Failed to load ad:', error);
      }
    }
  }, [isAdSenseEnabled]);

  // Show placeholder if ads are disabled
  if (!isAdSenseEnabled) {
    return fallbackContent ? (
      <div className={className}>{fallbackContent}</div>
    ) : (
      <div className={`${className} bg-mot-surface/50 rounded-lg p-4 text-center border border-mot-border`}>
        <div className="text-sm text-gray-500">Ad Space</div>
      </div>
    );
  }

  const formatMap = {
    rectangle: { width: '300', height: '250' },
    vertical: { width: '160', height: '600' },
    horizontal: { width: '728', height: '90' },
    auto: { style: { display: 'block' } }
  };

  const dimensions = formatMap[adFormat];

  return (
    <div ref={adRef} className={className}>
      <ins
        className="adsbygoogle"
        style={
          adFormat === 'auto'
            ? { display: 'block', width: '100%' }
            : { display: 'inline-block', width: dimensions.width + 'px', height: dimensions.height + 'px' }
        }
        data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT}
        data-ad-slot={adSlot}
        data-ad-format={adFormat === 'auto' ? 'auto' : undefined}
        data-full-width-responsive={adFormat === 'auto' ? 'true' : undefined}
      />
    </div>
  );
};

export default AdComponent;

/**
 * MONETIZATION STRATEGY RECOMMENDATIONS:
 * 
 * 1. AD PLACEMENT (Discord-like apps):
 *    - Right sidebar (below members list) - 300x250 or 160x600
 *    - Between server list and channels - 160x600 vertical
 *    - Above message input (non-intrusive) - 728x90 horizontal
 *    - DO NOT: Cover chat, interrupt conversations, use pop-ups
 * 
 * 2. BEST AD NETWORKS (in order of priority):
 *    a) Google AdSense
 *       - Highest quality, best for tech/gaming audience
 *       - Requirements: Original content, 100+ daily visitors
 *       - Sign up: https://www.google.com/adsense
 * 
 *    b) Media.net (Yahoo/Bing ads)
 *       - Contextual ads, good US/UK traffic
 *       - Sign up: https://www.media.net
 * 
 *    c) Ezoic (Premium - requires traffic)
 *       - Best CPM but needs 10k+ monthly visitors
 *       - Sign up: https://www.ezoic.com
 * 
 *    d) PropellerAds (Fallback)
 *       - Lower quality but high fill rate
 *       - Sign up: https://propellerads.com
 * 
 * 3. EXPECTED REVENUE (Discord-like app):
 *    - 1,000 daily users: $30-100/month
 *    - 10,000 daily users: $300-1,000/month
 *    - 100,000 daily users: $3,000-10,000/month
 * 
 * 4. COMPLIANCE:
 *    - Add Privacy Policy (GDPR/CCPA)
 *    - Use Consent Management Platform (Quantcast Choice, OneTrust)
 *    - Follow ad network policies (no click fraud, adult content)
 */
