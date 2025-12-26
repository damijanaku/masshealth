import { Star, Quote } from 'lucide-react';
import Card from '@/components/common/Card';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Fitness Enthusiast',
    avatar: 'SJ',
    avatarColor: 'from-primary-400 to-primary-600',
    rating: 5,
    text: 'MassHealth completely changed my workout routine. The rivalry feature with my friends keeps me motivated every single day. Lost 15kg in 3 months!',
  },
  {
    name: 'Michael Chen',
    role: 'Personal Trainer',
    avatar: 'MC',
    avatarColor: 'from-accent-400 to-accent-600',
    rating: 5,
    text: 'As a trainer, I recommend this app to all my clients. The exercise database is comprehensive and the progress tracking is top-notch.',
  },
  {
    name: 'Emma Williams',
    role: 'Marathon Runner',
    avatar: 'EW',
    avatarColor: 'from-purple-400 to-purple-600',
    rating: 5,
    text: 'The GPS tracking feature is incredibly accurate. I use it for all my runs and love competing with other runners in my area.',
  },
  {
    name: 'David Park',
    role: 'Software Developer',
    avatar: 'DP',
    avatarColor: 'from-blue-400 to-blue-600',
    rating: 5,
    text: 'Perfect for busy professionals. Quick workouts, easy to follow, and the app syncs across all my devices seamlessly.',
  },
  {
    name: 'Lisa Rodriguez',
    role: 'Yoga Instructor',
    avatar: 'LR',
    avatarColor: 'from-pink-400 to-pink-600',
    rating: 5,
    text: 'Finally an app that includes proper yoga and stretching routines alongside strength training. My students love it!',
  },
  {
    name: 'James Wilson',
    role: 'CrossFit Athlete',
    avatar: 'JW',
    avatarColor: 'from-orange-400 to-orange-600',
    rating: 5,
    text: 'The variety of exercises keeps my training fresh. The rivalry feature with my gym buddies has taken our competition to the next level.',
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm mb-4">
            Testimonials
          </span>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-surface-900 mb-4">
            Loved by{' '}
            <span className="gradient-text">Fitness Enthusiasts</span>
          </h2>
          <p className="text-xl text-surface-600 max-w-2xl mx-auto">
            Join thousands of users who have transformed their fitness journey with MassHealth.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card
              key={testimonial.name}
              hover
              className="relative"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Quote icon */}
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                <Quote className="w-5 h-5 text-primary-300" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>

              {/* Testimonial text */}
              <p className="text-surface-700 leading-relaxed mb-6">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.avatarColor} flex items-center justify-center text-white font-bold`}
                >
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-display font-bold text-surface-900">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-surface-500">{testimonial.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Stats bar */}
        <div className="mt-20 p-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-3xl shadow-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-white text-center">
            <div>
              <div className="text-4xl font-display font-bold mb-1">50K+</div>
              <div className="text-white/80">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-display font-bold mb-1">2.5M+</div>
              <div className="text-white/80">Workouts Completed</div>
            </div>
            <div>
              <div className="text-4xl font-display font-bold mb-1">100K+</div>
              <div className="text-white/80">Rivalries Created</div>
            </div>
            <div>
              <div className="text-4xl font-display font-bold mb-1">4.9</div>
              <div className="text-white/80">App Store Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
