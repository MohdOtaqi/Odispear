import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Eye, EyeOff, Zap, Check } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return strength;
  };

  const strength = passwordStrength(password);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsLoading(true);

    try {
      await register(email, username, password);
      toast.success('Account created successfully!');
      navigate('/app');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 animate-shimmer" />
      
      {/* Floating Orbs */}
      <div className="absolute top-10 right-20 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-10 left-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

      {/* Register Card */}
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="glass-effect rounded-2xl shadow-2xl p-8 border border-purple-600/20">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-3 animate-glow">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Create Account</h1>
            <p className="text-gray-400">Join the Unity Gaming Community</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Username
              </label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#2b2d31] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-all hover-lift"
                  placeholder="ProGamer123"
                  required
                  minLength={3}
                  maxLength={50}
                />
              </div>
            </div>

            {/* Email */}
            <div className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#2b2d31] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-all hover-lift"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#2b2d31] border border-white/10 rounded-xl pl-11 pr-11 py-3 text-white focus:border-purple-500 focus:outline-none transition-all hover-lift"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Strength */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i < strength ? strengthColors[strength - 1] : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  {strength > 0 && (
                    <p className="text-xs text-gray-400">
                      Password strength: <span className={strength >= 3 ? 'text-green-400' : 'text-yellow-400'}>
                        {strengthLabels[strength - 1]}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#2b2d31] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-all hover-lift"
                  placeholder="••••••••"
                  required
                />
                {confirmPassword && password === confirmPassword && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
              )}
            </div>

            {/* Terms */}
            <div className="animate-slide-in-up" style={{ animationDelay: '0.5s' }}>
              <label className="flex items-start cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 bg-[#2b2d31] transition-all"
                  required
                />
                <span className="ml-2 text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                  I agree to the{' '}
                  <Link to="/terms" className="text-purple-400 hover:text-purple-300">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-purple-400 hover:text-purple-300">Privacy Policy</Link>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !agreedToTerms || password !== confirmPassword}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all hover-lift disabled:opacity-50 disabled:cursor-not-allowed animate-slide-in-up"
              style={{ animationDelay: '0.6s' }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-sm text-gray-400 animate-fade-in" style={{ animationDelay: '0.7s' }}>
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              Login here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
