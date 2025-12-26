import {
  Dumbbell,
  Users,
  Trophy,
  MapPin,
  BarChart3,
  Smartphone,
  Zap,
  Heart,
} from 'lucide-react';
import Card from '@/components/common/Card';

const features = [
  {
    icon: Dumbbell,
    title: '2,500+ Exercises',
    description:
      'Access our comprehensive database of exercises for every muscle group, from strength training to yoga.',
    color: 'text-primary-500',
    bgColor: 'bg-primary-50',
  },
  {
    icon: Users,
    title: 'Friendly Rivalries',
    description:
      'Challenge your friends to fitness competitions. Stay motivated with head-to-head training battles.',
    color: 'text-accent-500',
    bgColor: 'bg-accent-50',
  },
  {
    icon: Trophy,
    title: 'Achievement System',
    description:
      'Earn badges, unlock achievements, and track your progress as you level up your fitness journey.',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
  },
  {
    icon: MapPin,
    title: 'GPS Tracking',
    description:
      'Track your runs, walks, and outdoor activities with real-time GPS monitoring and route mapping.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    description:
      'Visualize your improvement with detailed charts, statistics, and personalized insights.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  {
    icon: Smartphone,
    title: 'Cross-Platform',
    description:
      'Available on iOS, Android, web, and tablets. Your workouts sync seamlessly across all devices.',
    color: 'text-pink-500',
    bgColor: 'bg-pink-50',
  },
  {
    icon: Zap,
    title: 'Smart Workouts',
    description:
      'AI-powered recommendations adapt to your fitness level, goals, and available equipment.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
  },
  {
    icon: Heart,
    title: 'Health Adapted',
    description:
      'Safe exercise routines tailored for users with health conditions or physical limitations.',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm mb-4">
            Features
          </span>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-surface-900 mb-4">
            Everything You Need to{' '}
            <span className="gradient-text">Get Fit</span>
          </h2>
          <p className="text-xl text-surface-600 max-w-2xl mx-auto">
            From personalized workouts to social competitions, we have got all the 
            tools you need to transform your fitness journey.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              hover
              className="group"
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <div
                className={`w-14 h-14 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-display font-bold text-surface-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-surface-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-surface-600 mb-4">
            And many more features to discover...
          </p>
          <a
            href="#download"
            className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700 transition-colors"
          >
            Start your free trial
            <span className="text-xl">&#8594;</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Features;
