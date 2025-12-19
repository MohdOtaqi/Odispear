import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Rocket } from 'lucide-react';
import { useGuildStore } from '../../store/guildStore';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';
import { scaleVariants, staggerContainer, staggerItem, magneticSpring } from '../../lib/animations';

interface CreateGuildModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateGuildModal: React.FC<CreateGuildModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateType, setTemplateType] = useState<string>('community');
  const [isLoading, setIsLoading] = useState(false);

  const { createGuild } = useGuildStore();

  const templates = [
    {
      type: 'community',
      label: 'Community',
      description: 'For friends and communities',
      icon: '👥',
      gradient: 'from-blue-500 to-purple-500',
    },
    {
      type: 'esports',
      label: 'Gaming & Esports',
      description: 'For competitive gaming',
      icon: '🎮',
      gradient: 'from-green-500 to-teal-500',
    },
    {
      type: 'study',
      label: 'Study Group',
      description: 'For learning together',
      icon: '📚',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      type: 'custom',
      label: 'Custom',
      description: 'Start from scratch',
      icon: '⚡',
      gradient: 'from-mot-gold to-amber-500',
    },
  ];

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a server name');
      return;
    }

    setIsLoading(true);
    try {
      await createGuild({
        name: name.trim(),
        description: description.trim() || undefined,
        template_type: templateType,
      });
      onClose();
      setName('');
      setDescription('');
      setTemplateType('community');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create server');
    } finally {
      setIsLoading(false);
    }
  }, [name, description, templateType, createGuild, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={scaleVariants}
            className="relative w-full max-w-md bg-mot-surface-subtle rounded-3xl shadow-2xl border border-mot-gold/20 overflow-hidden"
          >
            {/* Animated glow border */}
            <motion.div
              className="absolute -inset-0.5 bg-gradient-to-r from-mot-gold via-amber-500 to-mot-gold-deep rounded-3xl opacity-30 blur-sm"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: '200% 200%' }}
            />

            <div className="relative bg-mot-surface-subtle rounded-3xl">
              {/* Header */}
              <div className="relative p-6 border-b border-mot-border overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-mot-gold/10 via-transparent to-mot-gold-deep/5" />
                <motion.div
                  className="absolute top-0 right-0 w-32 h-32 bg-mot-gold/10 rounded-full blur-3xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-mot-gold to-amber-500 flex items-center justify-center shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      transition={magneticSpring}
                    >
                      <Rocket className="w-6 h-6 text-mot-black" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Create Server</h2>
                      <p className="text-sm text-gray-400">Build your community</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Body */}
              <motion.form
                onSubmit={handleSubmit}
                className="p-6 space-y-6"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {/* Template Selection */}
                <motion.div variants={staggerItem}>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Choose a Template
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {templates.map((template, index) => (
                      <motion.button
                        key={template.type}
                        type="button"
                        onClick={() => setTemplateType(template.type)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, ...magneticSpring }}
                        whileHover={{
                          scale: 1.05,
                          y: -4,
                          boxShadow: templateType === template.type
                            ? "0 0 30px rgba(212, 175, 55, 0.4)"
                            : "0 10px 30px rgba(0, 0, 0, 0.3)"
                        }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-4 rounded-xl border-2 transition-colors text-left ${templateType === template.type
                            ? 'border-mot-gold bg-mot-gold/10'
                            : 'border-mot-border bg-mot-surface hover:border-mot-gold/30'
                          }`}
                      >
                        <motion.div
                          className="text-3xl mb-2"
                          animate={templateType === template.type ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          {template.icon}
                        </motion.div>
                        <div className="font-semibold text-white mb-1">
                          {template.label}
                        </div>
                        <div className="text-xs text-gray-400">
                          {template.description}
                        </div>
                        {templateType === template.type && (
                          <motion.div
                            layoutId="selectedTemplate"
                            className="absolute inset-0 border-2 border-mot-gold rounded-xl"
                            initial={false}
                            transition={magneticSpring}
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Server Name */}
                <motion.div variants={staggerItem}>
                  <Input
                    label="Server Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Awesome Server"
                    maxLength={100}
                    disabled={isLoading}
                    required
                  />
                </motion.div>

                {/* Server Description */}
                <motion.div variants={staggerItem}>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's your server about?"
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 bg-mot-surface border border-mot-border rounded-xl text-white placeholder-gray-500 focus:border-mot-gold focus:ring-2 focus:ring-mot-gold/20 focus:outline-none transition-all resize-none"
                    disabled={isLoading}
                  />
                </motion.div>

                {/* Footer */}
                <motion.div
                  variants={staggerItem}
                  className="flex gap-3 pt-4"
                >
                  <Button
                    type="button"
                    onClick={onClose}
                    variant="secondary"
                    size="lg"
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <motion.div className="flex-1">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      loading={isLoading}
                      disabled={!name.trim()}
                      className="w-full bg-gradient-to-r from-mot-gold to-amber-500 hover:from-mot-gold-light hover:to-amber-400"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Server
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
