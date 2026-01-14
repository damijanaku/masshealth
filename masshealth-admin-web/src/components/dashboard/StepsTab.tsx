import {
  Activity,
  TrendingUp,
  Wifi,
  WifiOff,
  Trash2,
  Footprints,
  BarChart3,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { useSteps } from '../../hooks/useSteps';
import Card, { CardHeader, CardTitle } from '../common/Card';

interface StepsTabProps {
  isConnected: boolean;
}

export default function StepsTab({ isConnected }: StepsTabProps) {
  const { stepsHistory, latestSteps, stats, clearHistory } = useSteps(100);

  const statCards = [
    {
      label: 'Total Steps',
      value: stats.totalSteps.toLocaleString(),
      icon: Footprints,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Average',
      value: stats.averageSteps.toLocaleString(),
      icon: BarChart3,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      label: 'Peak',
      value: stats.maxSteps.toLocaleString(),
      icon: TrendingUp,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Data Points',
      value: stats.dataPointCount.toString(),
      icon: Activity,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Connection Status & Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">MQTT Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">MQTT Disconnected</span>
              </>
            )}
          </div>

          {latestSteps && (
            <div className="text-sm text-gray-500">
              Last update: {latestSteps.dateTime}
            </div>
          )}
        </div>

        <button
          onClick={clearHistory}
          className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
        >
          <Trash2 className="w-4 h-4" />
          Clear History
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div
                className={`w-10 h-10 ${stat.bgColor} rounded-xl flex items-center justify-center`}
              >
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Real-time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <Footprints className="w-5 h-5" />
              Real-time Steps (sensor/steps)
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            {isConnected && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            )}
            <span className="text-sm text-gray-500">
              {isConnected ? 'Listening...' : 'Disconnected'}
            </span>
          </div>
        </CardHeader>

        <div className="h-80">
          {stepsHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Footprints className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Waiting for step data...</p>
              <p className="text-sm mt-2">
                {isConnected
                  ? 'Subscribed to sensor/steps - send data to see the chart'
                  : 'Connect to MQTT to receive data'}
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg max-w-md text-left">
                <p className="text-xs font-medium text-gray-600 mb-2">
                  Expected payload formats:
                </p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded block mb-2">
                  {'{"steps": 9, "timestamp": 1705267200000}'}
                </code>
                <p className="text-xs text-gray-500">
                  Or just a raw number: <code className="bg-gray-100 px-1 rounded">9</code>
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stepsHistory}>
                <defs>
                  <linearGradient id="stepsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} tickMargin={8} />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(value: number) => value.toLocaleString()}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  labelFormatter={(label: string) => `Time: ${label}`}
                  formatter={(value: number | undefined) => {
                    if (value === undefined) return ['-', 'Steps'];
                    return [value.toLocaleString(), 'Steps'];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="steps"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#stepsGradient)"
                  name="Steps"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Recent Data Table */}
      {stepsHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Step History</CardTitle>
            <span className="text-sm text-gray-500">
              Showing last {Math.min(20, stepsHistory.length)} entries
            </span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Date & Time
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                    Steps
                  </th>
                </tr>
              </thead>
              <tbody>
                {stepsHistory
                  .slice(-20)
                  .reverse()
                  .map((point, index) => (
                    <tr
                      key={`${point.timestamp}-${index}`}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-700">{point.dateTime}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                        {point.steps.toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}