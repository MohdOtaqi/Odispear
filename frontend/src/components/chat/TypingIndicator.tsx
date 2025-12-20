import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TypingIndicatorProps {
  users: string[];
}

const DotsAnimation = () => (
  <div className="flex gap-1 items-center">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-2 h-2 bg-mot-gold rounded-full"
        animate={{
          y: [-2, 2, -2],
          opacity: [0.5, 1, 0.5],
          scale: [0.9, 1.1, 0.9]
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          delay: i * 0.15,
          ease: "easeInOut"
        }}
      />
    ))}
  </div>
);

export const TypingIndicator = React.memo<TypingIndicatorProps>(({ users }) => {
  if (users.length === 0) return null;

  const displayText = () => {
    if (users.length === 1) {
      return <><strong className="text-mot-gold">{users[0]}</strong> is typing</>;
    } else if (users.length === 2) {
      return <><strong className="text-mot-gold">{users[0]}</strong> and <strong className="text-mot-gold">{users[1]}</strong> are typing</>;
    } else if (users.length === 3) {
      return <><strong className="text-mot-gold">{users[0]}</strong>, <strong className="text-mot-gold">{users[1]}</strong>, and <strong className="text-mot-gold">{users[2]}</strong> are typing</>;
    } else {
      return <><strong className="text-mot-gold">Several people</strong> are typing</>;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="px-4 py-2 text-sm text-gray-400 flex items-center gap-3"
        initial={{ opacity: 0, y: 10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <DotsAnimation />
        <motion.span
          className="font-medium"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {displayText()}
        </motion.span>
      </motion.div>
    </AnimatePresence>
  );
});

TypingIndicator.displayName = 'TypingIndicator';
