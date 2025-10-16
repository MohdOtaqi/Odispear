import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, MessageCircle, Users, Calendar, Trophy, Shield, Sparkles, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  const features = [
    {
      icon: MessageCircle,
      title: 'Real-time Chat',
      description: 'Lightning-fast messaging with threads, reactions, and rich embeds',
      gradient: 'from-primary-500 to-accent-500',
    },
    {
      icon: Users,
      title: 'Voice Channels',
      description: 'Crystal-clear voice chat with video and screen sharing',
      gradient: 'from-primary-400 to-primary-600',
    },
    {
      icon: Calendar,
      title: 'Events & Calendar',
      description: 'Built-in event scheduling with RSVP and reminders',
      gradient: 'from-primary-500 via-accent-400 to-success',
    },
    {
      icon: Trophy,
      title: 'Tournaments',
      description: 'Integrated tournament system with brackets and scheduling',
      gradient: 'from-success to-warning',
    },
    {
      icon: Shield,
      title: 'Moderation',
      description: 'Powerful tools to keep your community safe and friendly',
      gradient: 'from-warning to-error',
    },
    {
      icon: Sparkles,
      title: 'Customization',
      description: 'Personalize your server with roles, badges, and themes',
      gradient: 'from-error to-accent-500',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-neutral-900 to-accent-900/20" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-primary rounded-3xl mb-8 shadow-glow animate-pulse-glow">
            <Zap className="w-12 h-12 text-white" />
          </div>

          {/* Heading */}
          <h1 className="text-6xl md:text-7xl font-bold mb-6 animate-slide-in-up">
            <span className="gradient-text">Unity Platform</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
            The future of gaming communities
          </p>
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
            Unite your team with voice, video, and text chat. Organize tournaments, schedule events, and build the ultimate gaming community.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
            <Link
              to="/register"
              className="group px-8 py-4 bg-gradient-primary hover:shadow-glow-accent text-white font-semibold rounded-xl transition-all hover:-translate-y-1 active:scale-95 shadow-glow flex items-center justify-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700 hover:border-primary-500 text-white font-semibold rounded-xl transition-all hover:-translate-y-1 backdrop-blur-xl"
            >
              Login
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text mb-1">10K+</div>
              <div className="text-sm text-gray-400">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text mb-1">500+</div>
              <div className="text-sm text-gray-400">Communities</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text mb-1">24/7</div>
              <div className="text-sm text-gray-400">Uptime</div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-purple-500/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-purple-500 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-400">
              Powerful features designed for gaming communities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="glass-effect rounded-2xl p-6 border border-white/5 hover:border-purple-500/30 transition-all hover-lift group animate-slide-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-effect rounded-3xl p-12 border border-purple-600/20 animate-scale-in">
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of gamers already using Unity Platform
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg font-semibold rounded-xl transition-all hover-lift shadow-2xl"
            >
              Create Your Community
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">Unity Platform</span>
          </div>
          <p className="text-sm">
            © 2025 Unity Platform. All rights reserved.
          </p>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <Link to="/terms" className="hover:text-purple-400 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-purple-400 transition-colors">Privacy</Link>
            <Link to="/docs" className="hover:text-purple-400 transition-colors">Docs</Link>
            <Link to="/support" className="hover:text-purple-400 transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
