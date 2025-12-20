import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Video, X } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { motion, AnimatePresence } from 'framer-motion';

interface IncomingCallModalProps {
    isOpen: boolean;
    callerName: string;
    callerAvatar?: string;
    hasVideo: boolean;
    onAccept: (withVideo: boolean) => void;
    onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
    isOpen,
    callerName,
    callerAvatar,
    hasVideo,
    onAccept,
    onDecline,
}) => {
    const [ringtone, setRingtone] = useState<HTMLAudioElement | null>(null);

    // Play ringtone when call comes in
    useEffect(() => {
        if (isOpen) {
            // Create a simple ringtone using Web Audio API tone
            try {
                const audio = new Audio('/ringtone.mp3'); // If you have a ringtone file
                audio.loop = true;
                audio.volume = 0.5;
                audio.play().catch(() => {
                    // Fallback: No ringtone if file not found
                    console.log('No ringtone file available');
                });
                setRingtone(audio);
            } catch (e) {
                console.log('Could not play ringtone');
            }
        }

        return () => {
            if (ringtone) {
                ringtone.pause();
                ringtone.currentTime = 0;
            }
        };
    }, [isOpen]);

    const stopRingtone = () => {
        if (ringtone) {
            ringtone.pause();
            ringtone.currentTime = 0;
        }
    };

    const handleAccept = (withVideo: boolean) => {
        stopRingtone();
        onAccept(withVideo);
    };

    const handleDecline = () => {
        stopRingtone();
        onDecline();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-gradient-to-br from-mot-surface to-mot-background rounded-2xl p-8 shadow-2xl border border-mot-gold/30 max-w-sm w-full mx-4"
                    >
                        {/* Caller Info */}
                        <div className="text-center mb-8">
                            <div className="relative inline-block mb-4">
                                {/* Pulsing ring animation */}
                                <div className="absolute inset-0 rounded-full bg-mot-gold/30 animate-ping" />
                                <div className="absolute inset-0 rounded-full bg-mot-gold/20 animate-pulse" />
                                <Avatar
                                    src={callerAvatar}
                                    alt={callerName}
                                    fallback={callerName.charAt(0).toUpperCase()}
                                    size="xl"
                                    className="relative w-24 h-24 ring-4 ring-mot-gold"
                                />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-1">{callerName}</h2>
                            <p className="text-gray-400 flex items-center justify-center gap-2">
                                {hasVideo ? (
                                    <>
                                        <Video className="w-4 h-4" />
                                        Incoming video call...
                                    </>
                                ) : (
                                    <>
                                        <Phone className="w-4 h-4" />
                                        Incoming voice call...
                                    </>
                                )}
                            </p>
                        </div>

                        {/* Call Actions */}
                        <div className="flex items-center justify-center gap-6">
                            {/* Decline */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleDecline}
                                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 transition-colors"
                                title="Decline"
                            >
                                <PhoneOff className="w-7 h-7 text-white" />
                            </motion.button>

                            {/* Accept with Audio */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleAccept(false)}
                                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg shadow-green-500/30 transition-colors"
                                title="Accept"
                            >
                                <Phone className="w-7 h-7 text-white" />
                            </motion.button>

                            {/* Accept with Video (if caller has video) */}
                            {hasVideo && (
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleAccept(true)}
                                    className="w-16 h-16 rounded-full bg-mot-gold hover:bg-mot-gold-dark flex items-center justify-center shadow-lg shadow-mot-gold/30 transition-colors"
                                    title="Accept with Video"
                                >
                                    <Video className="w-7 h-7 text-mot-black" />
                                </motion.button>
                            )}
                        </div>

                        {/* Dismiss hint */}
                        <p className="text-center text-gray-500 text-xs mt-6">
                            Press Escape to dismiss
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default IncomingCallModal;
