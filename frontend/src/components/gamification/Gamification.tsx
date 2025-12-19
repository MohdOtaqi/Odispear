import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Star, Crown, Trophy, Flame, Shield, Sparkles } from 'lucide-react';
import { bouncySpring, antigravitySpring } from '../../lib/animations';

// =============================================================================
// XP BAR WITH LIQUID FILL
// =============================================================================

interface XPBarProps {
    currentXP: number;
    maxXP: number;
    level: number;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    animated?: boolean;
}

export const XPBar: React.FC<XPBarProps> = ({
    currentXP,
    maxXP,
    level,
    showLabel = true,
    size = 'md',
    animated = true
}) => {
    const [displayedXP, setDisplayedXP] = useState(0);
    const percentage = (currentXP / maxXP) * 100;

    // Animate XP counter
    useEffect(() => {
        if (!animated) {
            setDisplayedXP(currentXP);
            return;
        }

        const duration = 1000;
        const steps = 30;
        const increment = currentXP / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= currentXP) {
                setDisplayedXP(currentXP);
                clearInterval(timer);
            } else {
                setDisplayedXP(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [currentXP, animated]);

    const heights = {
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4'
    };

    return (
        <div className="w-full">
            {showLabel && (
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <LevelBadge level={level} size="sm" />
                        <span className="text-sm font-medium text-gray-300">Level {level}</span>
                    </div>
                    <span className="text-sm text-gray-400">
                        {displayedXP.toLocaleString()} / {maxXP.toLocaleString()} XP
                    </span>
                </div>
            )}

            <div className={`relative w-full ${heights[size]} bg-mot-surface-subtle rounded-full overflow-hidden`}>
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-mot-gold/10 to-amber-500/10" />

                {/* Liquid fill */}
                <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-mot-gold via-amber-500 to-mot-gold-light rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                >
                    {/* Shimmer effect */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                    />

                    {/* Bubbles effect */}
                    {animated && (
                        <>
                            <motion.div
                                className="absolute right-2 top-0 w-1 h-1 bg-white/50 rounded-full"
                                animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <motion.div
                                className="absolute right-6 top-0 w-0.5 h-0.5 bg-white/40 rounded-full"
                                animate={{ y: [0, -6, 0], opacity: [0.3, 0.8, 0.3] }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                            />
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

// =============================================================================
// LEVEL BADGE WITH SHINE EFFECT
// =============================================================================

interface LevelBadgeProps {
    level: number;
    size?: 'sm' | 'md' | 'lg';
    showAnimation?: boolean;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({
    level,
    size = 'md',
    showAnimation = true
}) => {
    const sizes = {
        sm: 'w-6 h-6 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-14 h-14 text-lg'
    };

    const getBadgeColor = () => {
        if (level >= 100) return 'from-purple-500 via-pink-500 to-purple-500';
        if (level >= 50) return 'from-mot-gold via-yellow-400 to-mot-gold';
        if (level >= 25) return 'from-blue-500 via-cyan-400 to-blue-500';
        if (level >= 10) return 'from-green-500 via-emerald-400 to-green-500';
        return 'from-gray-500 via-gray-400 to-gray-500';
    };

    const getIcon = () => {
        if (level >= 100) return <Crown className="w-3 h-3" />;
        if (level >= 50) return <Star className="w-3 h-3" />;
        if (level >= 25) return <Flame className="w-3 h-3" />;
        return null;
    };

    return (
        <motion.div
            className={`relative ${sizes[size]} rounded-full bg-gradient-to-br ${getBadgeColor()} flex items-center justify-center font-bold text-white shadow-lg`}
            whileHover={showAnimation ? { scale: 1.1, rotate: 5 } : undefined}
            transition={bouncySpring}
        >
            {/* Shine effect */}
            <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent"
                animate={showAnimation ? {
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.05, 1]
                } : undefined}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Glow ring */}
            {showAnimation && level >= 25 && (
                <motion.div
                    className={`absolute -inset-1 rounded-full bg-gradient-to-br ${getBadgeColor()} opacity-50 blur-sm`}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
            )}

            <span className="relative z-10 flex items-center gap-0.5">
                {getIcon()}
                {level}
            </span>
        </motion.div>
    );
};

// =============================================================================
// ACHIEVEMENT POPUP
// =============================================================================

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: 'trophy' | 'star' | 'shield' | 'flame' | 'crown' | 'sparkles';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    xpReward?: number;
}

interface AchievementPopupProps {
    achievement: Achievement | null;
    onClose: () => void;
}

export const AchievementPopup: React.FC<AchievementPopupProps> = ({
    achievement,
    onClose
}) => {
    useEffect(() => {
        if (achievement) {
            const timer = setTimeout(onClose, 5000);
            return () => clearTimeout(timer);
        }
    }, [achievement, onClose]);

    const icons = {
        trophy: Trophy,
        star: Star,
        shield: Shield,
        flame: Flame,
        crown: Crown,
        sparkles: Sparkles
    };

    const rarityColors = {
        common: 'from-gray-500 to-gray-600',
        rare: 'from-blue-500 to-blue-600',
        epic: 'from-purple-500 to-pink-500',
        legendary: 'from-mot-gold to-amber-500'
    };

    const rarityGlow = {
        common: 'rgba(107, 114, 128, 0.5)',
        rare: 'rgba(59, 130, 246, 0.5)',
        epic: 'rgba(168, 85, 247, 0.5)',
        legendary: 'rgba(212, 175, 55, 0.5)'
    };

    return (
        <AnimatePresence>
            {achievement && (
                <motion.div
                    initial={{ opacity: 0, y: -100, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 0.9 }}
                    transition={bouncySpring}
                    className="fixed top-6 left-1/2 -translate-x-1/2 z-50"
                >
                    <motion.div
                        className={`relative bg-gradient-to-r ${rarityColors[achievement.rarity]} p-1 rounded-2xl`}
                        animate={{
                            boxShadow: [
                                `0 0 20px ${rarityGlow[achievement.rarity]}`,
                                `0 0 40px ${rarityGlow[achievement.rarity]}`,
                                `0 0 20px ${rarityGlow[achievement.rarity]}`
                            ]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <div className="bg-mot-surface rounded-xl p-4 flex items-center gap-4 min-w-[300px]">
                            {/* Icon */}
                            <motion.div
                                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${rarityColors[achievement.rarity]} flex items-center justify-center`}
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                {React.createElement(icons[achievement.icon], { className: 'w-7 h-7 text-white' })}
                            </motion.div>

                            {/* Content */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                        Achievement Unlocked!
                                    </span>
                                    <Sparkles className="w-3 h-3 text-mot-gold" />
                                </div>
                                <h3 className="font-bold text-white text-lg">{achievement.title}</h3>
                                <p className="text-sm text-gray-400">{achievement.description}</p>
                                {achievement.xpReward && (
                                    <motion.div
                                        className="flex items-center gap-1 mt-1 text-mot-gold text-sm font-medium"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <Zap className="w-4 h-4" />
                                        +{achievement.xpReward} XP
                                    </motion.div>
                                )}
                            </div>

                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
                            >
                                ×
                            </button>
                        </div>
                    </motion.div>

                    {/* Particles burst */}
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-mot-gold"
                            initial={{ x: 0, y: 0, opacity: 1 }}
                            animate={{
                                x: Math.cos((i / 8) * Math.PI * 2) * 100,
                                y: Math.sin((i / 8) * Math.PI * 2) * 100,
                                opacity: 0,
                                scale: 0
                            }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// =============================================================================
// NUMBER TICKER / COUNTER
// =============================================================================

interface NumberTickerProps {
    value: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
}

export const NumberTicker: React.FC<NumberTickerProps> = ({
    value,
    duration = 1000,
    prefix = '',
    suffix = '',
    className = ''
}) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const steps = 30;
        const increment = value / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value, duration]);

    return (
        <motion.span
            className={`font-bold tabular-nums ${className}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={antigravitySpring}
        >
            {prefix}{displayValue.toLocaleString()}{suffix}
        </motion.span>
    );
};

// =============================================================================
// STATS CARD
// =============================================================================

interface Stat {
    label: string;
    value: number;
    prefix?: string;
    suffix?: string;
    icon: React.ReactNode;
    color: string;
}

interface StatsCardProps {
    stats: Stat[];
}

export const StatsCard: React.FC<StatsCardProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, ...antigravitySpring }}
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="relative bg-mot-surface rounded-xl p-4 border border-mot-border overflow-hidden group"
                >
                    {/* Background glow */}
                    <motion.div
                        className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`}
                    />

                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                        {stat.icon}
                    </div>

                    {/* Value */}
                    <NumberTicker
                        value={stat.value}
                        prefix={stat.prefix}
                        suffix={stat.suffix}
                        className="text-2xl text-white"
                    />

                    {/* Label */}
                    <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                </motion.div>
            ))}
        </div>
    );
};

export default {
    XPBar,
    LevelBadge,
    AchievementPopup,
    NumberTicker,
    StatsCard
};
