import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { ParticleBackground } from '../components/effects/ParticleBackground';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { scaleVariants, staggerContainer, staggerItem, magneticSpring, bouncySpring } from '../lib/animations';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-mot-surface">
      {/* Antigravity Particle Background */}
      <ParticleBackground particleCount={40} />

      {/* Login Card with Framer Motion */}
      <motion.div
        className="relative w-full max-w-md z-10"
        initial="hidden"
        animate="visible"
        variants={scaleVariants}
      >
        {/* Glass card with glow */}
        <motion.div
          className="relative bg-mot-surface-subtle/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-mot-gold/20"
          whileHover={{
            boxShadow: "0 0 60px rgba(212, 175, 55, 0.15)",
          }}
          transition={magneticSpring}
        >
          {/* Glow ring effect */}
          <div className="absolute -inset-px bg-gradient-to-r from-mot-gold/20 via-amber-500/10 to-mot-gold/20 rounded-3xl blur-sm" />

          <div className="relative">
            {/* Logo */}
            <motion.div
              className="text-center mb-8"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                variants={staggerItem}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-mot-gold to-amber-600 rounded-2xl mb-4 shadow-lg"
                whileHover={{
                  scale: 1.1,
                  rotate: 5,
                  boxShadow: "0 0 40px rgba(212, 175, 55, 0.5)"
                }}
                transition={bouncySpring}
              >
                <Sparkles className="w-10 h-10 text-mot-black" />
              </motion.div>
              <motion.h1
                variants={staggerItem}
                className="text-3xl font-bold bg-gradient-to-r from-mot-gold to-amber-400 bg-clip-text text-transparent mb-2"
              >
                Welcome Back!
              </motion.h1>
              <motion.p variants={staggerItem} className="text-gray-400">
                Login to continue your journey
              </motion.p>
            </motion.div>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-5"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {/* Email */}
              <motion.div variants={staggerItem}>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-mot-gold transition-colors" />
                  <motion.input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-mot-surface border border-mot-border rounded-xl pl-11 pr-4 py-3 text-white focus:border-mot-gold focus:ring-2 focus:ring-mot-gold/20 focus:outline-none transition-all"
                    placeholder="name@example.com"
                    required
                    whileFocus={{ scale: 1.01 }}
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div variants={staggerItem}>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-mot-gold transition-colors" />
                  <motion.input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-mot-surface border border-mot-border rounded-xl pl-11 pr-11 py-3 text-white focus:border-mot-gold focus:ring-2 focus:ring-mot-gold/20 focus:outline-none transition-all"
                    placeholder="••••••••"
                    required
                    whileFocus={{ scale: 1.01 }}
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-mot-gold transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </motion.button>
                </div>
              </motion.div>

              {/* Remember & Forgot */}
              <motion.div
                variants={staggerItem}
                className="flex items-center justify-between text-sm"
              >
                <label className="flex items-center cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-mot-border text-mot-gold focus:ring-mot-gold focus:ring-offset-0 bg-mot-surface transition-all" />
                  <span className="ml-2 text-gray-400 group-hover:text-gray-300 transition-colors">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-mot-gold hover:text-mot-gold-light transition-colors">
                  Forgot password?
                </Link>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                variants={staggerItem}
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-mot-gold to-amber-500 hover:from-mot-gold-light hover:to-amber-400 text-mot-black font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(212, 175, 55, 0.4)" }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      className="w-5 h-5 border-2 border-mot-black/20 border-t-mot-black rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Logging in...
                  </div>
                ) : (
                  'Login'
                )}
              </motion.button>
            </motion.form>

            {/* Divider */}
            <motion.div
              className="my-6 flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-mot-gold/30 to-transparent" />
              <span className="text-sm text-gray-500">OR</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-mot-gold/30 to-transparent" />
            </motion.div>

            {/* Social Login */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <motion.a
                href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/auth/google`}
                className="w-full bg-mot-surface hover:bg-mot-surface-subtle border border-mot-border text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02, borderColor: "rgba(212, 175, 55, 0.5)" }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </motion.a>
            </motion.div>

            {/* Sign Up Link */}
            <motion.div
              className="mt-6 text-center text-sm text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Don't have an account?{' '}
              <Link to="/register" className="text-mot-gold hover:text-mot-gold-light font-semibold transition-colors">
                Sign up for free
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
