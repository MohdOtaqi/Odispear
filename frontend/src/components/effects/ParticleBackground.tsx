import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Particle {
    id: number;
    size: number;
    x: number;
    y: number;
    duration: number;
    delay: number;
    opacity: number;
}

interface ParticleBackgroundProps {
    particleCount?: number;
    color?: string;
    className?: string;
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
    particleCount = 50,
    color = 'rgba(212, 175, 55, 0.3)', // MOT gold
    className = ''
}) => {
    // Generate random particles
    const particles = useMemo<Particle[]>(() => {
        return Array.from({ length: particleCount }, (_, i) => ({
            id: i,
            size: Math.random() * 4 + 1,
            x: Math.random() * 100,
            y: Math.random() * 100,
            duration: Math.random() * 20 + 15,
            delay: Math.random() * 5,
            opacity: Math.random() * 0.5 + 0.1
        }));
    }, [particleCount]);

    return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-mot-surface/50 to-mot-surface" />

            {/* Animated orbs */}
            <motion.div
                className="absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-3xl"
                style={{ background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)' }}
                animate={{
                    x: [0, 50, 0],
                    y: [0, 30, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.div
                className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full blur-3xl"
                style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%)' }}
                animate={{
                    x: [0, -40, 0],
                    y: [0, -20, 0],
                    scale: [1, 1.15, 1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
            />

            {/* Floating particles */}
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute rounded-full"
                    style={{
                        width: particle.size,
                        height: particle.size,
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        backgroundColor: color,
                        opacity: particle.opacity,
                        boxShadow: `0 0 ${particle.size * 2}px ${color}`
                    }}
                    animate={{
                        y: [0, -100, 0],
                        x: [0, Math.random() * 50 - 25, 0],
                        opacity: [particle.opacity, particle.opacity * 0.5, particle.opacity],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        delay: particle.delay,
                        ease: "easeInOut"
                    }}
                />
            ))}

            {/* Shimmer lines */}
            <motion.div
                className="absolute top-0 left-0 w-full h-px"
                style={{
                    background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                }}
                animate={{
                    x: ['-100%', '100%'],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />
        </div>
    );
};

export default ParticleBackground;
