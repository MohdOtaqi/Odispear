import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageCircle, Users, Mic, Video, Shield, Sparkles, ArrowRight, 
  Play, Globe, Headphones, Star, Heart, Github, Twitter, Menu, X, Zap
} from 'lucide-react';
import { GoldButton, MagneticGoldButton } from '../components/ui/GoldButton';
import { FeatureCard } from '../components/ui/FeatureCard';

const HomeMOT: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    // Global mouse tracking with accurate positioning
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Use viewport coordinates directly for more accurate tracking
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePosition({ 
        x: Math.max(0, Math.min(100, x)), 
        y: Math.max(0, Math.min(100, y)) 
      });
    };
    
    window.addEventListener('mousemove', handleGlobalMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, []);


  const features = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: 'Real-time Chat',
      description: 'Lightning-fast messaging with threads, reactions, mentions, and rich media embeds.',
    },
    {
      icon: <Mic className="w-6 h-6" />,
      title: 'Crystal Voice',
      description: 'Studio-quality voice chat with noise suppression and echo cancellation.',
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: 'HD Video',
      description: 'Face-to-face conversations with up to 50 participants in high definition.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Instant Sync',
      description: 'Real-time synchronization across all your devices, everywhere.',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Advanced Security',
      description: 'Role-based permissions, auto-mod, and comprehensive moderation tools.',
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Customization',
      description: 'Custom themes, emojis, roles, badges, and server templates.',
    },
  ];

  const stats = [
    { value: '50K+', label: 'Active Users', icon: Users },
    { value: '2K+', label: 'Communities', icon: Globe },
    { value: '99.9%', label: 'Uptime', icon: Zap },
    { value: '<50ms', label: 'Latency', icon: Headphones },
  ];

  return (
    <div 
      ref={pageRef}
      className="min-h-screen bg-mot-black text-white overflow-x-hidden"
    >
      {/* Premium Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Enhanced Mouse-following ambient glow */}
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-300 ease-out"
          style={{
            background: `radial-gradient(circle 800px at ${mousePosition.x}% ${mousePosition.y}%, rgba(245,166,35,0.12) 0%, transparent 50%)`
          }}
        />
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-500 ease-out"
          style={{
            background: `radial-gradient(circle 1200px at ${mousePosition.x}% ${mousePosition.y}%, rgba(245,166,35,0.04) 0%, transparent 70%)`
          }}
        />
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-200 ease-out"
          style={{
            background: `radial-gradient(circle 400px at ${mousePosition.x}% ${mousePosition.y}%, rgba(245,166,35,0.08) 0%, transparent 40%)`
          }}
        />
        
        {/* Pulsing highlight near cursor */}
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-150 ease-out animate-pulse"
          style={{
            background: `radial-gradient(circle 200px at ${mousePosition.x}% ${mousePosition.y}%, rgba(245,166,35,0.06) 0%, transparent 30%)`,
            animationDuration: '2s'
          }}
        />
        
        {/* Gradient Mesh */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_rgba(245,166,35,0.12)_0%,_transparent_50%)]" />
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(245,166,35,0.08)_0%,_transparent_40%)]" />
          <div className="absolute bottom-0 left-1/2 w-full h-full bg-[radial-gradient(ellipse_at_bottom,_rgba(245,166,35,0.06)_0%,_transparent_50%)]" />
        </div>
        
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(245,166,35,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(245,166,35,0.025)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />
        
        {/* Floating Orbs */}
        <div className="absolute top-[15%] left-[20%] w-2 h-2 bg-mot-gold/40 rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute top-[25%] right-[25%] w-1.5 h-1.5 bg-mot-gold/30 rounded-full animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute bottom-[30%] left-[35%] w-1 h-1 bg-mot-gold/50 rounded-full animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
        <div className="absolute top-[60%] right-[15%] w-1.5 h-1.5 bg-mot-gold/35 rounded-full animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '2s' }} />
        <div className="absolute bottom-[20%] right-[40%] w-1 h-1 bg-mot-gold/45 rounded-full animate-pulse" style={{ animationDuration: '2.8s', animationDelay: '1.5s' }} />
        <div className="absolute top-[40%] left-[10%] w-1.5 h-1.5 bg-mot-gold/25 rounded-full animate-pulse" style={{ animationDuration: '4.5s', animationDelay: '0.8s' }} />
        
        {/* Glow Lines */}
        <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-mot-gold/5 to-transparent" />
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-mot-gold/5 to-transparent" />
        <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-mot-gold/5 to-transparent" />
        
        {/* Corner Vignette */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-mot-gold/3 to-transparent" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-mot-gold/3 to-transparent" />
        
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.012] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />
      </div>

      {/* Floating Navigation */}
      <nav className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-mot-surface/90 backdrop-blur-xl border border-mot-border shadow-lg' 
          : 'bg-mot-surface/60 backdrop-blur-md border border-white/5'
      } rounded-2xl`}>
        <div className="px-2 py-2 flex items-center gap-1">
          {/* Logo */}
          <Link to="/" className="px-3 py-2 flex items-center gap-2 group">
            <img 
              src="/MOT.gif" 
              alt="MOT" 
              className="h-10 w-auto transition-all duration-300"
            />
          </Link>

          <div className="w-px h-6 bg-mot-border mx-1 hidden md:block" />

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {['Features', 'Pricing', 'About'].map((item) => (
              <a 
                key={item}
                href={`#${item.toLowerCase()}`} 
                className="relative px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors group"
              >
                {item}
                <span className="absolute bottom-1 left-4 right-4 h-px bg-mot-gold scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </a>
            ))}
          </div>

          <div className="w-px h-6 bg-mot-border mx-1 hidden md:block" />

          {/* CTA */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/login" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">
              Login
            </Link>
            <Link to="/register">
              <GoldButton size="sm">Get Started</GoldButton>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-mot-border mt-2 pt-2 pb-4 px-4 space-y-2">
            <a href="#features" className="block py-2 text-gray-400 hover:text-white">Features</a>
            <a href="#pricing" className="block py-2 text-gray-400 hover:text-white">Pricing</a>
            <Link to="/login" className="block py-2 text-gray-400 hover:text-white">Login</Link>
            <Link to="/register" className="block mt-2">
              <GoldButton size="sm" className="w-full">Get Started</GoldButton>
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-mot-gold/10 border border-mot-gold/20 rounded-full mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-mot-gold rounded-full animate-pulse" />
            <span className="text-sm text-mot-gold">Now with HD Video & Screen Share</span>
          </div>

          {/* Heading with gold accent */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 animate-slide-in-up tracking-tight">
            <span className="text-white">
              Where Ideas
            </span>
            <br />
            <span className="relative">
              <span className="bg-gradient-to-r from-mot-gold-light via-mot-gold to-mot-gold-deep bg-clip-text text-transparent">
                Come Alive
              </span>
              {/* Animated underline */}
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-mot-gold to-transparent opacity-60" />
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 animate-slide-in-up leading-relaxed" style={{ animationDelay: '100ms' }}>
            The all-in-one platform for voice, video, and text chat. 
            Create your community, invite your friends, and start connecting.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-in-up" style={{ animationDelay: '200ms' }}>
            <Link to="/register">
              <MagneticGoldButton size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                Start for Free
              </MagneticGoldButton>
            </Link>
            <button className="group flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-mot-border hover:border-mot-gold/30 rounded-2xl font-semibold transition-all hover:-translate-y-1">
              <div className="w-10 h-10 bg-mot-gold/10 rounded-full flex items-center justify-center group-hover:bg-mot-gold/20 group-hover:shadow-gold-glow-sm transition-all">
                <Play className="w-4 h-4 text-mot-gold ml-0.5" />
              </div>
              <span className="text-white">Watch Demo</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '400ms' }}>
            {stats.map((stat, idx) => (
              <div 
                key={idx} 
                className="group p-4 bg-mot-surface/50 backdrop-blur-sm border border-mot-border rounded-2xl hover:border-mot-gold/30 transition-all duration-300"
              >
                <stat.icon className="w-5 h-5 text-mot-gold mb-2 mx-auto group-hover:scale-110 transition-transform" />
                <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-mot-gold/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-mot-gold rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-mot-gold/10 border border-mot-gold/20 rounded-full text-sm text-mot-gold mb-4">
              Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Everything You Need
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Powerful features designed for modern communities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <FeatureCard
                key={idx}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                className="animate-slide-in-up"
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-12 md:p-16 bg-mot-surface rounded-3xl border border-mot-gold/20 overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-mot-gold/10 via-transparent to-mot-gold/5" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-mot-gold to-transparent" />
            
            <div className="relative z-10 text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto">
                Join thousands of users already using MOT. It's free to start.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register">
                  <GoldButton size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                    Create Your Community
                  </GoldButton>
                </Link>
                <Link to="/login">
                  <GoldButton size="lg" variant="outline">
                    Sign In
                  </GoldButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-mot-border py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img src="/MOT.gif" alt="MOT" className="h-10 w-auto" />
              </Link>
              <p className="text-sm text-gray-500 mb-4">The future of communication.</p>
              <div className="flex gap-3">
                <a href="#" className="p-2 bg-mot-surface hover:bg-mot-gold/10 border border-mot-border hover:border-mot-gold/30 rounded-lg transition-all">
                  <Twitter className="w-4 h-4 text-gray-400 hover:text-mot-gold" />
                </a>
                <a href="#" className="p-2 bg-mot-surface hover:bg-mot-gold/10 border border-mot-border hover:border-mot-gold/30 rounded-lg transition-all">
                  <Github className="w-4 h-4 text-gray-400 hover:text-mot-gold" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <a href="#" className="block hover:text-mot-gold transition-colors">Features</a>
                <a href="#" className="block hover:text-mot-gold transition-colors">Pricing</a>
                <a href="#" className="block hover:text-mot-gold transition-colors">Download</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <a href="#" className="block hover:text-mot-gold transition-colors">About</a>
                <a href="#" className="block hover:text-mot-gold transition-colors">Blog</a>
                <a href="#" className="block hover:text-mot-gold transition-colors">Careers</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <Link to="/terms" className="block hover:text-mot-gold transition-colors">Terms</Link>
                <Link to="/privacy" className="block hover:text-mot-gold transition-colors">Privacy</Link>
                <a href="#" className="block hover:text-mot-gold transition-colors">Cookies</a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-mot-border flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>© 2025 MOT. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-mot-gold fill-mot-gold" /> for creators
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeMOT;
