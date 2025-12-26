import { UserPlus, Target, Swords, TrendingUp } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Create Your Profile',
    description:
      'Sign up and tell us about your fitness goals, current level, and any health considerations.',
    color: 'from-primary-500 to-primary-600',
  },
  {
    number: '02',
    icon: Target,
    title: 'Get Personalized Plan',
    description:
      'Receive a customized workout routine tailored to your goals, schedule, and available equipment.',
    color: 'from-accent-500 to-accent-600',
  },
  {
    number: '03',
    icon: Swords,
    title: 'Challenge Friends',
    description:
      'Invite friends to compete in fitness challenges. Track progress and see who comes out on top.',
    color: 'from-primary-500 to-accent-500',
  },
  {
    number: '04',
    icon: TrendingUp,
    title: 'Track & Improve',
    description:
      'Monitor your progress with detailed analytics. Celebrate wins and keep pushing forward.',
    color: 'from-accent-500 to-primary-500',
  },
];

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="py-24 bg-gradient-to-b from-surface-50 to-white relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-accent-100 text-accent-700 font-semibold text-sm mb-4">
            How It Works
          </span>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-surface-900 mb-4">
            Start Your Journey in{' '}
            <span className="gradient-text">4 Simple Steps</span>
          </h2>
          <p className="text-xl text-surface-600 max-w-2xl mx-auto">
            Getting fit has never been easier. Follow these steps to begin your 
            transformation today.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line (desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200 via-accent-200 to-primary-200 -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Card */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-surface-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  {/* Number badge */}
                  <div
                    className={`absolute -top-4 left-6 px-4 py-1 rounded-full bg-gradient-to-r ${step.color} text-white font-display font-bold text-sm shadow-lg`}
                  >
                    Step {step.number}
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-surface-50 to-surface-100 flex items-center justify-center mt-4 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-8 h-8 text-primary-500" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-display font-bold text-surface-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-surface-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow connector (between cards on desktop) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 z-10 w-6 h-6 bg-white rounded-full border-2 border-primary-200 items-center justify-center -translate-y-1/2">
                    <span className="text-primary-500">&#8594;</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom illustration/CTA */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl shadow-xl text-white">
            <div className="text-left">
              <p className="font-display font-bold text-lg">Ready to start?</p>
              <p className="text-white/80 text-sm">Join thousands of fitness enthusiasts</p>
            </div>
            <a
              href="#download"
              className="px-6 py-2 bg-white text-primary-600 rounded-xl font-semibold hover:bg-surface-50 transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
