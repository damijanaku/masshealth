import { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';
import Card, { CardHeader, CardTitle } from '@/components/common/Card';
import { clsx } from 'clsx';

interface ActivityChartProps {
  data?: Array<{
    date: string;
    count: number;
  }>;
  isLoading?: boolean;
}

type ChartType = 'area' | 'line' | 'bar';
type TimeRange = '7d' | '30d' | '90d';

const ActivityChart = ({ data, isLoading }: ActivityChartProps) => {
  const [chartType, setChartType] = useState<ChartType>('area');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Format data for chart
  const chartData = data?.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  })) || [];

  // Calculate stats
  const totalWorkouts = chartData.reduce((sum, item) => sum + item.count, 0);
  const avgPerDay = chartData.length > 0 ? Math.round(totalWorkouts / chartData.length) : 0;
  const maxWorkouts = Math.max(...chartData.map((d) => d.count), 0);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-900 text-white px-3 py-2 rounded-lg shadow-lg">
          <p className="text-xs text-surface-400">{label}</p>
          <p className="font-bold">{payload[0].value} workouts</p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 10, left: -20, bottom: 0 },
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#8b5cf6' }}
            />
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="count"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );
      default:
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorWorkouts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#8b5cf6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorWorkouts)"
            />
          </AreaChart>
        );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-surface-200 rounded animate-pulse" />
        </CardHeader>
        <div className="h-80 bg-surface-100 rounded-lg animate-pulse" />
      </Card>
    );
  }

  return (
    <Card>
      {/* Header */}
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary-500" />
          </div>
          <div>
            <CardTitle>Workout Activity</CardTitle>
            <p className="text-sm text-surface-500">Daily workout completions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex rounded-lg border border-surface-200 overflow-hidden">
            {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={clsx(
                  'px-3 py-1.5 text-sm font-medium transition-colors',
                  timeRange === range
                    ? 'bg-primary-500 text-white'
                    : 'text-surface-600 hover:bg-surface-100'
                )}
              >
                {range}
              </button>
            ))}
          </div>
          {/* Chart type selector */}
          <div className="flex rounded-lg border border-surface-200 overflow-hidden">
            {(['area', 'line', 'bar'] as ChartType[]).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={clsx(
                  'px-3 py-1.5 text-sm font-medium transition-colors capitalize',
                  chartType === type
                    ? 'bg-primary-500 text-white'
                    : 'text-surface-600 hover:bg-surface-100'
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-surface-50">
          <p className="text-sm text-surface-500 mb-1">Total Workouts</p>
          <p className="text-2xl font-bold text-surface-900">{totalWorkouts}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-50">
          <p className="text-sm text-surface-500 mb-1">Avg per Day</p>
          <p className="text-2xl font-bold text-surface-900">{avgPerDay}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-50">
          <p className="text-sm text-surface-500 mb-1">Peak Day</p>
          <p className="text-2xl font-bold text-surface-900">{maxWorkouts}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center bg-surface-50 rounded-xl">
            <div className="text-center">
              <Calendar className="w-12 h-12 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-500">No activity data available</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ActivityChart;
