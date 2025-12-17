import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, MessageCircle, Users, Mic, Video, Shield, Sparkles, ArrowRight, 
  Play, ChevronRight, Globe, Headphones, Monitor, Star, Heart,
  Github, Twitter, Menu, X
} from 'lucide-react';

const Home: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: MessageCircle,
      title: 'Real-time Chat',
      description: 'Lightning-fast messaging with threads, reactions, mentions, and rich media embeds.',
      color: 'from-violet-500 to-purple-600',
      delay: 0,
    },
    {
      icon: Mic,
      title: 'Crystal Voice',
      description: 'Studio-quality voice chat with noise suppression and echo cancellation.',
      color: 'from-blue-500 to-cyan-500',
      delay: 100,
    },
    {
      icon: Video,
      title: 'HD Video',
      description: 'Face-to-face conversations with up to 50 participants in high definition.',
      color: 'from-emerald-500 to-teal-500',
      delay: 200,
    },
    {
      icon: Monitor,
      title: 'Screen Share',
      description: 'Stream your gameplay or presentations with ultra-low latency.',
      color: 'from-orange-500 to-amber-500',
      delay: 300,
    },
    {
      icon: Shield,
      title: 'Advanced Security',
      description: 'Role-based permissions, auto-mod, and comprehensive moderation tools.',
      color: 'from-red-500 to-pink-500',
      delay: 400,
    },
    {
      icon: Sparkles,
      title: 'Customization',
      description: 'Custom themes, emojis, roles, badges, and server templates.',
      color: 'from-pink-500 to-rose-500',
      delay: 500,
    },
  ];

  const testimonials = [
    {
      name: 'Alex Chen',
      role: 'Pro Gamer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      quote: 'Unity Platform transformed how our team communicates. The voice quality is unmatched.',
    },
    {
      name: 'Sarah Kim',
      role: 'Community Manager',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      quote: 'Managing 10,000+ members has never been easier. The moderation tools are incredible.',
    },
    {
      name: 'Marcus Johnson',
      role: 'Streamer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
      quote: 'Screen sharing with my community while gaming is seamless. Best platform out there.',
    },
  ];

  const stats = [
    { value: '50K+', label: 'Active Users', icon: Users },
    { value: '2K+', label: 'Communities', icon: Globe },
    { value: '99.9%', label: 'Uptime', icon: Zap },
    { value: '<50ms', label: 'Latency', icon: Headphones },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-violet-600/5 rounded-full blur-[200px]" />
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/25">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Unity</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
              <a href="#testimonials" className="text-sm text-gray-400 hover:text-white transition-colors">Testimonials</a>
              <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a>
              <Link to="/login" className="text-sm text-gray-300 hover:text-white transition-colors">Login</Link>
              <Link
                to="/register"
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block py-2 text-gray-400 hover:text-white">Features</a>
              <a href="#testimonials" className="block py-2 text-gray-400 hover:text-white">Testimonials</a>
              <Link to="/login" className="block py-2 text-gray-400 hover:text-white">Login</Link>
              <Link to="/register" className="block w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-center font-semibold">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-300">Now with HD Video & Screen Share</span>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 animate-slide-in-up">
            <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
              Where Gaming
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Communities Thrive
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
            The all-in-one platform for voice, video, and text chat. 
            Create your community, invite your friends, and start connecting.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-in-up" style={{ animationDelay: '200ms' }}>
            <Link
              to="/register"
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl font-semibold text-lg transition-all hover:shadow-2xl hover:shadow-purple-500/30 hover:-translate-y-1 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start for Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <button className="group flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl font-semibold transition-all hover:-translate-y-1">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Play className="w-4 h-4 ml-0.5" />
              </div>
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '400ms' }}>
            {stats.map((stat, idx) => (
              <div key={idx} className="p-4 bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl hover:border-purple-500/30 transition-colors group">
                <stat.icon className="w-5 h-5 text-purple-400 mb-2 mx-auto group-hover:scale-110 transition-transform" />
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-purple-500/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-purple-500 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm text-purple-400 mb-4">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Everything You Need</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Powerful features designed for modern gaming communities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group relative p-6 bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-1 overflow-hidden animate-slide-in-up"
                style={{ animationDelay: `${feature.delay}ms` }}
              >
                {/* Glow effect on hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${feature.color} blur-3xl -z-10`} style={{ opacity: 0.05 }} />
                
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 mb-4">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Loved by Gamers</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="p-6 bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl hover:border-white/10 transition-all animate-slide-in-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full bg-gray-800" />
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-12 md:p-16 bg-gradient-to-br from-purple-900/30 via-[#0f0f15] to-blue-900/30 rounded-3xl border border-purple-500/20 overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-transparent to-blue-600/10" />
            
            <div className="relative z-10 text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">Ready to Get Started?</span>
              </h2>
              <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto">
                Join thousands of gamers and communities already using Unity Platform. It's free to start.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="group px-8 py-4 bg-white text-gray-900 rounded-2xl font-semibold text-lg transition-all hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-1 flex items-center gap-2"
                >
                  Create Your Community
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-semibold transition-all hover:-translate-y-1"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">Unity</span>
              </Link>
              <p className="text-sm text-gray-500 mb-4">The future of gaming communities.</p>
              <div className="flex gap-3">
                <a href="#" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                  <Twitter className="w-4 h-4 text-gray-400" />
                </a>
                <a href="#" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                  <Github className="w-4 h-4 text-gray-400" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <a href="#" className="block hover:text-white transition-colors">Features</a>
                <a href="#" className="block hover:text-white transition-colors">Pricing</a>
                <a href="#" className="block hover:text-white transition-colors">Download</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <a href="#" className="block hover:text-white transition-colors">About</a>
                <a href="#" className="block hover:text-white transition-colors">Blog</a>
                <a href="#" className="block hover:text-white transition-colors">Careers</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <Link to="/terms" className="block hover:text-white transition-colors">Terms</Link>
                <Link to="/privacy" className="block hover:text-white transition-colors">Privacy</Link>
                <a href="#" className="block hover:text-white transition-colors">Cookies</a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>© 2025 Unity Platform. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for gamers
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
