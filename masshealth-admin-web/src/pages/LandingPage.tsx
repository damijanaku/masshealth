import { ArrowRight, Dumbbell, Users, Trophy, Smartphone, Heart, Zap } from 'lucide-react';
import Button from '../components/common/Button';

export default function LandingPage() {
  const containerClass = "w-full max-w-6xl mx-auto px-6 lg:px-8";

  return (
    <div className="min-h-screen w-full bg-white flex flex-col font-sans overflow-x-hidden">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 w-full">
        <div className={containerClass}>
          <div className="py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/MassHealthLogo2.svg" alt="MassHealth" className="w-10 h-10" />
              <span className="text-xl font-bold text-gray-900">MassHealth</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-primary-600 font-medium transition">Features</a>
              <a href="#download" className="text-gray-600 hover:text-primary-600 font-medium transition">Download</a>
            </nav>
            <Button size="sm">Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center py-5 lg:py-12 w-full">
        <div className={`${containerClass} flex flex-col items-center text-center`}>
          <p className="text-sm md:text-sm text-gray-600 mb-5 max-w-2xl text-center">
            This website is (for now) a demo admin portal with a general user landing page, info on this page does not reflect the current state of the app
          </p>

          <img src="/MassHealthLogo2.svg" alt="MassHealth" className="w-60 h-60 lg:w-56 lg:h-56 mb-10 animate-fade-in" />
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6 tracking-tight max-w-4xl text-center">
            Transform Your <span className="text-primary-600">Fitness Journey</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto text-center">
            Track workouts, connect with friends, and achieve your goals with personalized routines and real-time progress monitoring.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full sm:w-auto justify-center items-center">
            <Button size="lg" className="w-full sm:w-auto justify-center">
              Download App <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto justify-center">
              Learn More
            </Button>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 border-t border-gray-100 pt-8 w-full max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-gray-900">10K+</div>
              <div className="text-sm text-gray-500 mt-1">Active Users</div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-gray-200" />
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-gray-900">500+</div>
              <div className="text-sm text-gray-500 mt-1">Exercises</div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-gray-200" />
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-gray-900">4.9</div>
              <div className="text-sm text-gray-500 mt-1">App Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 bg-gray-50 w-full flex flex-col items-center">
        <div className={containerClass}>
          
          {/* FIX: Explicitly added 'flex-col items-center text-center' to this wrapper */}
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">Everything You Need</h2>
            <p className="text-lg text-gray-600 text-center">
              Powerful features designed to help you reach your fitness goals faster.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
            {[
              { icon: Dumbbell, title: 'Custom Routines', desc: 'Create personalized workout plans tailored to your goals' },
              { icon: Users, title: 'Friend Tracking', desc: 'Connect with friends and share your fitness journey' },
              { icon: Trophy, title: 'Rivalries', desc: 'Challenge friends and compete for the top spot' },
              { icon: Smartphone, title: 'Real-time Sync', desc: 'Your data syncs seamlessly across all devices' },
              { icon: Heart, title: 'Health Metrics', desc: 'Track calories, sleep, and vital health stats' },
              { icon: Zap, title: 'Quick Workouts', desc: 'Access 500+ exercises with video demonstrations' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group w-full h-full"
              >
                <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-100 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-center">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="download" className="py-12 w-full flex flex-col items-center">
        <div className={containerClass}>
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-8 md:p-16 text-center text-white overflow-hidden relative shadow-2xl w-full">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            
            {/* FIX: Explicitly added 'flex-col items-center text-center' here */}
            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">Ready to Transform?</h2>
              <p className="text-lg text-primary-100 mb-10 text-center">
                Download MassHealth today and start your fitness journey. Available on iOS and Android.
              </p>
              
              {/* FIX: Added 'items-center' to the button container to center them on mobile */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                <button className="flex items-center justify-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition shadow-lg w-full sm:w-auto">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  App Store
                </button>
                <button className="flex items-center justify-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition shadow-lg w-full sm:w-auto">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                  </svg>
                  Google Play
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 border-t border-gray-800 w-full">
        <div className={`${containerClass} flex flex-col items-center justify-center text-center`}>
          <div className="flex items-center gap-3 mb-8 justify-center">
            <img src="/MassHealthLogo2.svg" alt="MassHealth" className="w-10 h-10 grayscale opacity-80" />
            <span className="text-xl font-bold text-white">MassHealth</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-8 text-gray-400 mb-8 w-full">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
            <a href="/admin/login" className="hover:text-white transition-colors">Admin</a>
          </nav>
          <div className="text-gray-500 text-sm">
            &copy; 2025 MassHealth. All rights reserved. (Trust)
          </div>
        </div>
      </footer>
    </div>
  );
}