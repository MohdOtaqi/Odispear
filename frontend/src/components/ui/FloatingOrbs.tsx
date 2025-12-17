import React from 'react';
import { cn } from '../../lib/utils';

interface FloatingOrbsProps {
  className?: string;
  variant?: 'default' | 'subtle' | 'vibrant';
}

export const FloatingOrbs: React.FC<FloatingOrbsProps> = ({ className, variant = 'default' }) => {
  const opacityMap = {
    default: { primary: '0.15', secondary: '0.12', tertiary: '0.08' },
    subtle: { primary: '0.08', secondary: '0.06', tertiary: '0.04' },
    vibrant: { primary: '0.25', secondary: '0.20', tertiary: '0.15' },
  };

  const opacity = opacityMap[variant];

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {/* Primary Orb - Purple */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[120px] animate-float-slow"
        style={{
          background: `radial-gradient(circle, rgba(139, 92, 246, ${opacity.primary}) 0%, transparent 70%)`,
          top: '10%',
          left: '20%',
        }}
      />
      
      {/* Secondary Orb - Blue */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[100px] animate-float-slow"
        style={{
          background: `radial-gradient(circle, rgba(59, 130, 246, ${opacity.secondary}) 0%, transparent 70%)`,
          bottom: '20%',
          right: '15%',
          animationDelay: '2s',
        }}
      />
      
      {/* Tertiary Orb - Cyan */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full blur-[80px] animate-float-slow"
        style={{
          background: `radial-gradient(circle, rgba(6, 182, 212, ${opacity.tertiary}) 0%, transparent 70%)`,
          top: '50%',
          left: '60%',
          animationDelay: '4s',
        }}
      />

      {/* Small accent orbs */}
      <div
        className="absolute w-[200px] h-[200px] rounded-full blur-[60px] animate-pulse-slow"
        style={{
          background: `radial-gradient(circle, rgba(236, 72, 153, ${opacity.tertiary}) 0%, transparent 70%)`,
          top: '70%',
          left: '10%',
        }}
      />
      <div
        className="absolute w-[150px] h-[150px] rounded-full blur-[50px] animate-pulse-slow"
        style={{
          background: `radial-gradient(circle, rgba(168, 85, 247, ${opacity.tertiary}) 0%, transparent 70%)`,
          top: '20%',
          right: '25%',
          animationDelay: '1s',
        }}
      />
    </div>
  );
};

// Grid background pattern
export const GridPattern: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn('absolute inset-0 pointer-events-none opacity-[0.02]', className)}
    style={{
      backgroundImage: `
        linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
      `,
      backgroundSize: '50px 50px',
    }}
  />
);

// Noise texture overlay
export const NoiseTexture: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn('absolute inset-0 pointer-events-none opacity-[0.03]', className)}
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
    }}
  />
);
