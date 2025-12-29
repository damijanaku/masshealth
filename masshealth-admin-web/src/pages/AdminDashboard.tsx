import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dumbbell, Users, Activity, Trophy, LogOut, 
  TrendingUp, Clock, Wifi, WifiOff 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../stores/authStore';
import { useMqtt } from '../hooks/useMqtt';
import Card, { CardHeader, CardTitle } from '../components/common/Card';

const mockChartData = [
  { name: 'Mon', users: 120, workouts: 340 },
  { name: 'Tue', users: 150, workouts: 420 },
  { name: 'Wed', users: 180, workouts: 510 },
  { name: 'Thu', users: 140, workouts: 380 },
  { name: 'Fri', users: 200, workouts: 590 },
  { name: 'Sat', users: 250, workouts: 720 },
  { name: 'Sun', users: 220, workouts: 650 },
];

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const { isConnected, messages, connect, disconnect } = useMqtt();
  const navigate = useNavigate();
  const [stats] = useState({
    totalUsers: 1247,
    activeToday: 342,
    totalExercises: 534,
    totalRoutines: 89,
  });

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, bgColor: 'bg-primary-100', iconColor: 'text-primary-600' },
    { label: 'Active Today', value: stats.activeToday, icon: Activity, bgColor: 'bg-green-100', iconColor: 'text-green-600' },
    { label: 'Exercises', value: stats.totalExercises, icon: Dumbbell, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Routines', value: stats.totalRoutines, icon: Trophy, bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <div className="font-bold text-gray-900">MassHealth</div>
            <div className="text-xs text-gray-500">Admin Panel</div>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <a href="#" className="flex items-center justify-start gap-3 px-4 py-3 bg-primary-50 text-primary-700 rounded-xl font-medium">
            <Activity className="w-5 h-5" />
            Dashboard
          </a>
          <a href="#" className="flex items-center justify-start gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition">
            <Users className="w-5 h-5" />
            Users
          </a>
          <a href="#" className="flex items-center justify-start gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition">
            <Dumbbell className="w-5 h-5" />
            Exercises
          </a>
          <a href="#" className="flex items-center justify-start gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition">
            <Trophy className="w-5 h-5" />
            Rivalries
          </a>
        </nav>

        <div className="mt-auto space-y-4">
          <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-50">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">MQTT Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">MQTT Disconnected</span>
              </>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-start gap-3 px-4 py-3 w-full text-gray-600 hover:bg-gray-50 rounded-xl transition"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.full_name || 'Admin'}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat) => (
              <Card key={stat.label}>
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Activity</CardTitle>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </CardHeader>
              <div className="h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#7c3aed" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="workouts" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Live Location Updates</CardTitle>
                <Clock className="w-5 h-5 text-gray-400" />
              </CardHeader>
              <div className="h-72 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p className="text-center">No location updates yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.slice(0, 10).map((msg) => (
                      <div key={msg.id} className="flex items-center justify-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-900">{msg.senderName}</p>
                          <p className="text-sm text-gray-500">
                            {msg.latitude.toFixed(4)}, {msg.longitude.toFixed(4)}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}