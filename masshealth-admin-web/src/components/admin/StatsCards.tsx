import { ReactNode } from 'react';
import { Users, Dumbbell, Trophy, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';
import Card from '@/components/common/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  iconColor: string;
  iconBg: string;
}

const StatCard = ({ title, value, change, icon, iconColor, iconBg }: StatCardProps) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card hover className="relative overflow-hidden">
      {/* Background gradient */}
      <div className={clsx('absolute top-0 right-0 w-32 h-32 opacity-10 -mr-8 -mt-8 rounded-full', iconBg)} />
      
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-surface-500 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-display font-bold text-surface-900">{value}</p>
          
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive && <TrendingUp className="w-4 h-4 text-accent-500" />}
              {isNegative && <TrendingDown className="w-4 h-4 text-red-500" />}
              <span
                className={clsx(
                  'text-sm font-medium',
                  isPositive && 'text-accent-600',
                  isNegative && 'text-red-600',
                  !isPositive && !isNegative && 'text-surface-500'
                )}
              >
                {isPositive && '+'}
                {change}% from last week
              </span>
            </div>
          )}
        </div>
        
        <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center', iconBg)}>
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
    </Card>
  );
};

interface StatsCardsProps {
  stats?: {
    total_users: number;
    active_users_today: number;
    total_workouts: number;
    active_rivalries: number;
    total_exercises: number;
  };
  isLoading?: boolean;
}

const StatsCards = ({ stats, isLoading }: StatsCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="flex items-start justify-between">
              <div>
                <div className="h-4 w-24 bg-surface-200 rounded mb-2" />
                <div className="h-8 w-16 bg-surface-200 rounded" />
              </div>
              <div className="w-12 h-12 bg-surface-200 rounded-xl" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Users',
      value: stats?.total_users?.toLocaleString() || '0',
      change: 12,
      icon: <Users className="w-6 h-6" />,
      iconColor: 'text-primary-500',
      iconBg: 'bg-primary-100',
    },
    {
      title: 'Active Today',
      value: stats?.active_users_today?.toLocaleString() || '0',
      change: 8,
      icon: <Activity className="w-6 h-6" />,
      iconColor: 'text-accent-500',
      iconBg: 'bg-accent-100',
    },
    {
      title: 'Total Workouts',
      value: stats?.total_workouts?.toLocaleString() || '0',
      change: 24,
      icon: <Dumbbell className="w-6 h-6" />,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-100',
    },
    {
      title: 'Active Rivalries',
      value: stats?.active_rivalries?.toLocaleString() || '0',
      change: -5,
      icon: <Trophy className="w-6 h-6" />,
      iconColor: 'text-yellow-500',
      iconBg: 'bg-yellow-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
};

export default StatsCards;
