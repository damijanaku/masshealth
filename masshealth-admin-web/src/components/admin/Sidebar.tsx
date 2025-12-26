import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Map,
  Volume2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Activity,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  mqttConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

const Sidebar = ({ mqttConnected, onConnect, onDisconnect }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuthStore();
  const { logout } = useAuth();

  const navItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/admin/dashboard',
    },
    {
      icon: Map,
      label: 'Live Map',
      path: '/admin/map',
    },
    {
      icon: Users,
      label: 'Users',
      path: '/admin/users',
    },
    {
      icon: Dumbbell,
      label: 'Exercises',
      path: '/admin/exercises',
    },
    {
      icon: Trophy,
      label: 'Rivalries',
      path: '/admin/rivalries',
    },
    {
      icon: Volume2,
      label: 'Sounds',
      path: '/admin/sounds',
    },
    {
      icon: Activity,
      label: 'Activity Log',
      path: '/admin/activity',
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/admin/settings',
    },
  ];

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-screen bg-surface-900 text-white z-40 transition-all duration-300 flex flex-col',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shrink-0">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <span className="font-display font-bold text-lg">MassHealth</span>
              <p className="text-xs text-surface-400">Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      {/* MQTT Status */}
      <div className="p-4 border-b border-surface-800">
        <button
          onClick={mqttConnected ? onDisconnect : onConnect}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
            mqttConnected
              ? 'bg-accent-500/20 text-accent-400 hover:bg-accent-500/30'
              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          )}
        >
          {mqttConnected ? (
            <Wifi className="w-5 h-5 shrink-0" />
          ) : (
            <WifiOff className="w-5 h-5 shrink-0" />
          )}
          {!isCollapsed && (
            <span className="text-sm font-medium">
              {mqttConnected ? 'MQTT Connected' : 'MQTT Disconnected'}
            </span>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-surface-400 hover:bg-surface-800 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-surface-800">
        {!isCollapsed && user && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold">
              {user.full_name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user.full_name}</p>
              <p className="text-xs text-surface-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface-800 border border-surface-700 rounded-full flex items-center justify-center hover:bg-surface-700 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </aside>
  );
};

export default Sidebar;
