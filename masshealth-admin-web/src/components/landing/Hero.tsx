import { ArrowRight, Play, Users, Trophy, Dumbbell, Zap } from 'lucide-react';
import Button from '@/components/common/Button';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-bg">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary-300/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent-300/30 rounded-full blur-3xl animate-pulse-slow animate-delay-500" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-100/20 rounded-full blur-3xl" />
        
        {/* Floating icons */}
        <div className="absolute top-1/4 left-[15%] animate-float">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center rotate-12">
            <Dumbbell className="w-8 h-8 text-primary-500" />
          </div>
        </div>
        <div className="absolute top-1/3 right-[10%] animate-float animate-delay-200">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center -rotate-6">
            <Trophy className="w-7 h-7 text-accent-500" />
          </div>
        </div>
        <div className="absolute bottom-1/3 left-[10%] animate-float animate-delay-500">
          <div className="w-12 h-12 bg-white rounded-xl shadow-xl flex items-center justify-center rotate-6">
            <Zap className="w-6 h-6 text-yellow-500" />
          </div>
        </div>
        <div className="absolute bottom-1/4 right-[20%] animate-float animate-delay-300">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center -rotate-12">
            <Users className="w-7 h-7 text-primary-500" />
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-lg mb-8 animate-slide-down">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-accent-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500"></span>
            </span>
            <span className="text-sm font-medium text-surface-700">
              2,500+ exercises available
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-surface-900 mb-6 animate-slide-up">
            Get Fit{' '}
            <span className="gradient-text">Together</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl sm:text-2xl text-surface-600 max-w-2xl mx-auto mb-10 animate-slide-up animate-delay-100">
            Compete with friends, crush your goals, and transform your body with 
            personalized workouts and friendly rivalries.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up animate-delay-200">
            <a href="#download">
              <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Download Free
              </Button>
            </a>
            <a href="#how-it-works">
              <Button variant="secondary" size="lg" leftIcon={<Play className="w-5 h-5" />}>
                See How It Works
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-xl mx-auto animate-slide-up animate-delay-300">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-display font-bold text-primary-600 mb-1">
                2.5K+
              </div>
              <div className="text-sm text-surface-500">Exercises</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-display font-bold text-accent-500 mb-1">
                50K+
              </div>
              <div className="text-sm text-surface-500">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-display font-bold text-primary-600 mb-1">
                4.9
              </div>
              <div className="text-sm text-surface-500">App Rating</div>
            </div>
          </div>
        </div>

        {/* App preview mockup */}
        <div className="mt-20 relative max-w-4xl mx-auto animate-slide-up animate-delay-500">
          <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-4 border border-surface-100">
            <div className="aspect-[16/9] bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                  <Dumbbell className="w-10 h-10 text-primary-500" />
                </div>
                <p className="text-surface-600 font-medium">App Preview Coming Soon</p>
              </div>
            </div>
          </div>
          {/* Shadow/glow effect */}
          <div className="absolute inset-0 -z-10 blur-3xl opacity-30 bg-gradient-to-br from-primary-400 to-accent-400 scale-95" />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-surface-300 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-surface-400 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
