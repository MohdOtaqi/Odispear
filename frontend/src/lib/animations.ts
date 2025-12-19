/**
 * Antigravity Animation Presets
 * Zero-gravity physics animations for the MOT platform
 */

import { Variants, Transition } from 'framer-motion';

// =============================================================================
// SPRING PHYSICS PRESETS
// =============================================================================

/** Antigravity spring - feels weightless and floaty */
export const antigravitySpring: Transition = {
    type: "spring",
    stiffness: 100,
    damping: 15,
    mass: 0.8
};

/** Snappy spring - quick and responsive */
export const snappySpring: Transition = {
    type: "spring",
    stiffness: 400,
    damping: 25,
    mass: 0.5
};

/** Magnetic spring - feels like it's being pulled */
export const magneticSpring: Transition = {
    type: "spring",
    stiffness: 150,
    damping: 12,
    mass: 0.6
};

/** Bouncy spring - playful feel */
export const bouncySpring: Transition = {
    type: "spring",
    stiffness: 300,
    damping: 10,
    mass: 0.8
};

// =============================================================================
// FLOATING ANIMATIONS
// =============================================================================

/** Continuous floating animation - for ambient movement */
export const floatAnimation: Variants = {
    initial: { y: 0 },
    animate: {
        y: [-5, 5, -5],
        transition: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
};

/** Subtle breathing animation - for cards */
export const breatheAnimation: Variants = {
    initial: { scale: 1 },
    animate: {
        scale: [1, 1.02, 1],
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
};

/** Orbit animation - for loading states */
export const orbitAnimation: Variants = {
    initial: { rotate: 0 },
    animate: {
        rotate: 360,
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "linear"
        }
    }
};

// =============================================================================
// HOVER EFFECTS
// =============================================================================

/** Magnetic hover - lifts and attracts */
export const magneticHover = {
    scale: 1.05,
    y: -8,
    transition: magneticSpring
};

/** Glow hover - for buttons and interactive elements */
export const glowHover = {
    scale: 1.02,
    boxShadow: "0 0 30px rgba(212, 175, 55, 0.5), 0 0 60px rgba(212, 175, 55, 0.3)",
    transition: antigravitySpring
};

/** Lift hover - subtle rise effect */
export const liftHover = {
    y: -4,
    transition: snappySpring
};

/** Tilt hover - 3D tilt effect */
export const tiltHover = {
    rotateX: 5,
    rotateY: 5,
    transition: antigravitySpring
};

// =============================================================================
// ENTRANCE ANIMATIONS
// =============================================================================

/** Fade up entrance */
export const fadeUpVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 30
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: antigravitySpring
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: { duration: 0.2 }
    }
};

/** Scale entrance - for modals */
export const scaleVariants: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.8,
        y: 20
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: bouncySpring
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        transition: { duration: 0.15 }
    }
};

/** Slide in from right */
export const slideRightVariants: Variants = {
    hidden: {
        opacity: 0,
        x: 50
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: antigravitySpring
    },
    exit: {
        opacity: 0,
        x: -30,
        transition: { duration: 0.2 }
    }
};

/** Stagger children animation */
export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

/** Individual stagger item */
export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: antigravitySpring
    }
};

// =============================================================================
// SPECIAL EFFECTS
// =============================================================================

/** Pulse glow - for notifications/badges */
export const pulseGlowVariants: Variants = {
    initial: {
        boxShadow: "0 0 0 0 rgba(212, 175, 55, 0.4)"
    },
    animate: {
        boxShadow: [
            "0 0 0 0 rgba(212, 175, 55, 0.4)",
            "0 0 0 10px rgba(212, 175, 55, 0)",
            "0 0 0 0 rgba(212, 175, 55, 0)"
        ],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
};

/** Shimmer effect - for loading states */
export const shimmerVariants: Variants = {
    initial: { x: "-100%" },
    animate: {
        x: "100%",
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 0.5
        }
    }
};

/** Spotlight follow - for cursor tracking */
export const spotlightVariants: Variants = {
    initial: { opacity: 0 },
    hover: { opacity: 1 }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate 3D tilt based on mouse position
 * @param x Mouse X relative to element center (-1 to 1)
 * @param y Mouse Y relative to element center (-1 to 1)
 * @param intensity Tilt intensity (default 15deg)
 */
export const calculate3DTilt = (x: number, y: number, intensity = 15) => ({
    rotateX: y * intensity,
    rotateY: -x * intensity,
    transformPerspective: 1000
});

/**
 * Create staggered delay for children
 * @param index Child index
 * @param baseDelay Base delay in seconds
 */
export const staggerDelay = (index: number, baseDelay = 0.05) => ({
    transition: { delay: index * baseDelay }
});

// =============================================================================
// COMPONENT PRESETS
// =============================================================================

/** Card preset - floating with hover effects */
export const cardMotion = {
    initial: "hidden",
    animate: "visible",
    exit: "exit",
    variants: fadeUpVariants,
    whileHover: magneticHover
};

/** Button preset - interactive with glow */
export const buttonMotion = {
    whileHover: { scale: 1.05, ...glowHover },
    whileTap: { scale: 0.95 },
    transition: snappySpring
};

/** Modal preset - scale entrance */
export const modalMotion = {
    initial: "hidden",
    animate: "visible",
    exit: "exit",
    variants: scaleVariants
};

/** List item preset - staggered entrance */
export const listItemMotion = {
    variants: staggerItem,
    whileHover: liftHover
};

export default {
    // Springs
    antigravitySpring,
    snappySpring,
    magneticSpring,
    bouncySpring,
    // Animations
    floatAnimation,
    breatheAnimation,
    orbitAnimation,
    // Hovers
    magneticHover,
    glowHover,
    liftHover,
    tiltHover,
    // Variants
    fadeUpVariants,
    scaleVariants,
    slideRightVariants,
    staggerContainer,
    staggerItem,
    pulseGlowVariants,
    shimmerVariants,
    spotlightVariants,
    // Presets
    cardMotion,
    buttonMotion,
    modalMotion,
    listItemMotion,
    // Utils
    calculate3DTilt,
    staggerDelay
};
