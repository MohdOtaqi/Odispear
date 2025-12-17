import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Eye, EyeOff, Check } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const { register, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return strength;
  };

  const strength = passwordStrength(password);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-mot-gold', 'bg-green-500'];
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
      toast.success('Welcome to MOT! 🎉');
      navigate('/app', { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-mot-black">
      {/* Premium Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Mesh */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(245,166,35,0.15)_0%,_transparent_50%)]" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_rgba(245,166,35,0.1)_0%,_transparent_40%)]" />
          <div className="absolute bottom-0 right-1/2 w-full h-full bg-[radial-gradient(ellipse_at_bottom,_rgba(245,166,35,0.08)_0%,_transparent_50%)]" />
        </div>
        
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(245,166,35,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,166,35,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        
        {/* Floating Orbs */}
        <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-mot-gold/40 rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute top-1/3 left-1/3 w-1.5 h-1.5 bg-mot-gold/30 rounded-full animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-mot-gold/50 rounded-full animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
        <div className="absolute top-2/3 left-1/4 w-1.5 h-1.5 bg-mot-gold/35 rounded-full animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 right-1/2 w-1 h-1 bg-mot-gold/45 rounded-full animate-pulse" style={{ animationDuration: '2.8s', animationDelay: '1.5s' }} />
        
        {/* Subtle Glow Lines */}
        <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-mot-gold/10 to-transparent" />
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-mot-gold/10 to-transparent" />
        
        {/* Corner Accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-mot-gold/5 to-transparent" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-mot-gold/5 to-transparent" />
      </div>

      {/* Register Card */}
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="bg-mot-surface/90 backdrop-blur-xl rounded-2xl shadow-lg p-8 border border-mot-border">
          {/* Logo */}
          <div className="text-center mb-6">
            <img 
              src="/MOT.gif" 
              alt="MOT" 
              className="h-20 w-auto mx-auto mb-4 transition-all"
            />
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-gray-400">Join the MOT Community</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Username
              </label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-mot-gold transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-mot-surface-subtle border border-mot-border rounded-xl pl-11 pr-4 py-3 text-white focus:border-mot-gold focus:ring-2 focus:ring-mot-gold/20 focus:outline-none transition-all"
                  placeholder="YourUsername"
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
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-mot-gold transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-mot-surface-subtle border border-mot-border rounded-xl pl-11 pr-4 py-3 text-white focus:border-mot-gold focus:ring-2 focus:ring-mot-gold/20 focus:outline-none transition-all"
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
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-mot-gold transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-mot-surface-subtle border border-mot-border rounded-xl pl-11 pr-11 py-3 text-white focus:border-mot-gold focus:ring-2 focus:ring-mot-gold/20 focus:outline-none transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-mot-gold transition-colors"
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
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-mot-gold transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-mot-surface-subtle border border-mot-border rounded-xl pl-11 pr-4 py-3 text-white focus:border-mot-gold focus:ring-2 focus:ring-mot-gold/20 focus:outline-none transition-all"
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
                  className="w-4 h-4 mt-0.5 rounded border-mot-border text-mot-gold focus:ring-mot-gold focus:ring-offset-0 bg-mot-surface-subtle transition-all"
                  required
                />
                <span className="ml-2 text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                  I agree to the{' '}
                  <Link to="/terms" className="text-mot-gold hover:text-mot-gold-light">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-mot-gold hover:text-mot-gold-light">Privacy Policy</Link>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !agreedToTerms || password !== confirmPassword}
              className="w-full bg-gradient-to-b from-mot-gold-light via-mot-gold to-mot-gold-deep text-mot-black font-bold py-3 rounded-xl transition-all shadow-gold-glow-sm hover:shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed animate-slide-in-up"
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
            <Link to="/login" className="text-mot-gold hover:text-mot-gold-light font-semibold transition-colors">
              Login here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
