import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, MessageCircle, Headphones, Sparkles, ArrowRight, Zap, Shield, Globe } from 'lucide-react';
import { useGuildStore } from '../store/guildStore';

// Floating orbs/particles background
const FloatingOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Large gradient orbs */}
    <motion.div
      className="absolute top-10 right-10 w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)' }}
      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute bottom-10 left-10 w-[200px] md:w-[400px] h-[200px] md:h-[400px] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)' }}
      animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
    />
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[800px] h-[400px] md:h-[800px] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 60%)' }}
      animate={{ rotate: 360 }}
      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
    />

    {/* Floating particles */}
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 md:w-2 md:h-2 rounded-full bg-mot-gold/40"
        style={{
          top: `${15 + Math.random() * 70}%`,
          left: `${5 + Math.random() * 90}%`,
        }}
        animate={{
          y: [0, -30, 0],
          opacity: [0.2, 0.6, 0.2],
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: 4 + Math.random() * 4,
          repeat: Infinity,
          delay: i * 0.3,
          ease: "easeInOut"
        }}
      />
    ))}

    {/* Grid overlay */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: any; title: string; description: string; delay: number }) => (
  <motion.div
    className="relative group"
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: "spring", stiffness: 200, damping: 20 }}
  >
    {/* Glow effect on hover */}
    <motion.div
      className="absolute -inset-0.5 bg-gradient-to-r from-mot-gold/40 to-amber-500/40 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
    />

    <div className="relative bg-mot-surface/40 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-mot-gold/20 hover:border-mot-gold/50 transition-all duration-300 h-full">
      {/* Icon container with glow */}
      <motion.div
        className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-mot-gold/20 to-amber-500/10 flex items-center justify-center mx-auto mb-4 md:mb-5"
        whileHover={{ scale: 1.1, rotate: 5 }}
      >
        <Icon className="w-7 h-7 md:w-8 md:h-8 text-mot-gold" />
      </motion.div>

      <h3 className="text-white font-bold text-lg md:text-xl mb-2 md:mb-3">{title}</h3>
      <p className="text-gray-400 text-sm md:text-base leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

export const DefaultWelcome: React.FC = () => {
  const navigate = useNavigate();
  const { guilds } = useGuildStore();

  return (
    <div className="flex-1 flex items-center justify-center bg-mot-black relative overflow-hidden min-h-screen md:min-h-0">
      <FloatingOrbs />

      <div className="text-center max-w-sm md:max-w-4xl mx-auto px-4 md:px-8 relative z-10 w-full py-8 md:py-12">
        {/* Logo Section */}
        <motion.div
          className="mb-8 md:mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Animated Logo */}
          <motion.div
            className="relative inline-block mb-6 md:mb-8"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.img
              src="/MOT.gif"
              alt="MOT Platform"
              className="h-20 md:h-32 w-auto mx-auto"
              style={{ filter: 'drop-shadow(0 0 40px rgba(212, 175, 55, 0.5))' }}
            />
            {/* Glow ring */}
            <motion.div
              className="absolute -inset-4 rounded-full border-2 border-mot-gold/30"
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Welcome to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-mot-gold via-amber-400 to-mot-gold-light animate-gradient">
              MOT Platform
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-gray-400 text-base md:text-xl max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            The ultimate destination for modern voice, video, and text chat designed for thriving communities
          </motion.p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
          <FeatureCard
            icon={MessageCircle}
            title="Rich Text Chat"
            description="Express yourself with reactions, threads, rich embeds, and file sharing"
            delay={0.5}
          />
          <FeatureCard
            icon={Headphones}
            title="Crystal Clear Audio"
            description="Low-latency voice chat with noise suppression and spatial audio"
            delay={0.6}
          />
          <FeatureCard
            icon={Users}
            title="Build Communities"
            description="Create servers, manage roles, and cultivate your community"
            delay={0.7}
          />
        </div>

        {/* Action Section */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {guilds.length > 0 ? (
            <>
              <p className="text-gray-300 mb-4 md:mb-6 text-sm md:text-base">
                Select a server from the sidebar to get started
              </p>
              <motion.button
                onClick={() => navigate('/app/friends')}
                className="group relative px-8 md:px-10 py-4 md:py-5 bg-gradient-to-r from-mot-gold to-amber-500 text-mot-black font-bold rounded-2xl text-base md:text-lg overflow-hidden"
                whileHover={{ scale: 1.02, boxShadow: "0 0 50px rgba(212, 175, 55, 0.5)" }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2 md:gap-3">
                  <Sparkles className="w-5 h-5" />
                  Browse Friends & DMs
                  <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                </span>
              </motion.button>
            </>
          ) : (
            <>
              <p className="text-gray-300 mb-6 text-sm md:text-base">
                Get started by creating your first server or exploring friends
              </p>
              <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center">
                <motion.button
                  onClick={() => navigate('/app/friends')}
                  className="group px-8 py-4 bg-gradient-to-r from-mot-gold to-amber-500 text-mot-black font-bold rounded-2xl text-base overflow-hidden"
                  whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(212, 175, 55, 0.5)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" />
                    Create Server
                  </span>
                </motion.button>

                <motion.button
                  onClick={() => navigate('/app/friends')}
                  className="px-8 py-4 bg-mot-surface/60 backdrop-blur-md text-white font-bold rounded-2xl border border-mot-gold/30 hover:border-mot-gold text-base"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Users className="w-5 h-5" />
                    Browse Friends
                  </span>
                </motion.button>
              </div>
            </>
          )}
        </motion.div>

        {/* Trust badges */}
        <motion.div
          className="mt-10 md:mt-16 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-xs md:text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-mot-gold/50" />
            End-to-End Encrypted
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-mot-gold/50" />
            Low Latency
          </span>
          <span className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-mot-gold/50" />
            Global CDN
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default DefaultWelcome;