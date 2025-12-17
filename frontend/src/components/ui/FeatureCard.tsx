import React, { useState, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  onClick?: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  className,
  onClick,
}) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Calculate rotation
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (e.clientY - centerY) / 15;
    const y = -(e.clientX - centerX) / 15;
    setRotateX(x);
    setRotateY(y);
    
    // Calculate glow position
    const glowX = ((e.clientX - rect.left) / rect.width) * 100;
    const glowY = ((e.clientY - rect.top) / rect.height) * 100;
    setGlowPosition({ x: glowX, y: glowY });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'group relative p-6 rounded-2xl cursor-pointer',
        'bg-mot-surface border border-mot-border',
        'hover:border-mot-gold/40 transition-colors duration-300',
        'overflow-hidden',
        className
      )}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: 'preserve-3d',
        transition: 'transform 0.1s ease-out, border-color 0.3s ease',
      }}
    >
      {/* Glow effect following mouse */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at ${glowPosition.x}% ${glowPosition.y}%, rgba(245,166,35,0.15), transparent 50%)`
        }}
      />
      
      {/* Top gold accent line */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-mot-gold to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Icon container */}
      <div 
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
          'bg-mot-gold/10 text-mot-gold',
          'group-hover:bg-mot-gold/20 group-hover:shadow-gold-glow-sm',
          'transition-all duration-300'
        )}
        style={{ transform: 'translateZ(20px)' }}
      >
        {icon}
      </div>
      
      {/* Title */}
      <h3 
        className="text-lg font-semibold text-white mb-2"
        style={{ transform: 'translateZ(15px)' }}
      >
        {title}
      </h3>
      
      {/* Description */}
      <p 
        className="text-sm text-gray-400 leading-relaxed"
        style={{ transform: 'translateZ(10px)' }}
      >
        {description}
      </p>
      
      {/* Hover arrow */}
      <div 
        className="absolute bottom-6 right-6 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
        style={{ transform: 'translateZ(25px)' }}
      >
        <ArrowRight className="w-5 h-5 text-mot-gold" />
      </div>
      
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-mot-surface to-transparent pointer-events-none opacity-0 group-hover:opacity-50 transition-opacity" />
    </div>
  );
};
