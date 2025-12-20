import React, { useRef, useState } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CardProps extends Omit<HTMLMotionProps<"div">, 'children'> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'spotlight' | 'elevated';
  hover?: boolean;
  onClick?: () => void;
  glow?: boolean;
  glowColor?: string;
}

export const Card = React.memo<CardProps>(({
  children,
  className,
  variant = 'default',
  hover = false,
  glow = false,
  glowColor = 'rgba(212, 175, 55, 0.3)',
  onClick,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || variant !== 'spotlight') return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const variants = {
    default: 'bg-mot-surface border-mot-border',
    glass: 'bg-white/5 backdrop-blur-xl border-white/10',
    spotlight: 'bg-mot-surface border-mot-border',
    elevated: 'bg-gradient-to-br from-mot-surface to-mot-surface-subtle border-mot-gold/10 shadow-xl',
  };

  const hoverEffects = hover ? {
    scale: 1.02,
    y: -4,
    boxShadow: glow
      ? `0 20px 40px ${glowColor}`
      : "0 20px 40px rgba(0, 0, 0, 0.3)"
  } : {};

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        'relative rounded-2xl p-6 border overflow-hidden',
        variants[variant],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={hoverEffects}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      {...props}
    >
      {/* Spotlight effect */}
      {variant === 'spotlight' && (
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${glowColor}, transparent 40%)`,
            opacity: isHovered ? 1 : 0
          }}
        />
      )}

      {/* Glow border on hover */}
      {glow && isHovered && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            boxShadow: `inset 0 0 20px ${glowColor}`
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
});

Card.displayName = 'Card';
