import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dumbbell,
  Users,
  Activity,
  Trophy,
  LogOut,
  TrendingUp,
  Wifi,
  WifiOff,
  RefreshCw,
  Upload,
  Play,
  Pause,
  Trash2,
  Volume2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Edit,
  Mail,
  Footprints,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Tooltip as LeafletTooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useAuthStore } from "../stores/authStore";
import { useMqtt } from "../hooks/useMqtt";
import Card, { CardHeader, CardTitle } from "../components/common/Card";
import api from "../services/api";
import type { MQTTLocationMessage } from "../types";
import StepsTab from "../components/dashboard/StepsTab";

type TabType =
  | "dashboard"
  | "users"
  | "exercises"
  | "rivalries"
  | "sounds"
  | "steps";

interface DashboardStats {
  total_users: number;
  active_today: number;
  total_workouts: number;
  total_routines: number;
  new_users_week: number;
}

interface ChartDataPoint {
  name: string;
  date: string;
  users: number;
  routines: number;
}

interface UserData {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
  last_login: string | null;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
}

interface Sound {
  id: string;
  name: string;
  file_url: string;
  duration: number;
  created_at: string;
}

interface Exercise {
  id: number;
  name: string;
  muscle_group: { id: number; name: string } | null;
  exercise_type: string;
  equipment_required: string;
  experience_level: string;
}

interface MuscleGroup {
  id: number;
  name: string;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center[0] !== 0 && center[1] !== 0) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

function DashboardTab({
  stats,
  chartData,
  recentUsers,
  loading,
  locations,
}: {
  stats: DashboardStats;
  chartData: ChartDataPoint[];
  recentUsers: UserData[];
  loading: boolean;
  locations: MQTTLocationMessage[];
}) {
  // Add test location in Maribor to verify map works
  const testLocations: MQTTLocationMessage[] = useMemo(
    () => [
      {
        id: "test-1",
        senderId: "999",
        senderName: "TEST USER (delete me)",
        latitude: 46.5547,
        longitude: 15.6459,
        timestamp: "3.1.1982",
      },
      ...locations,
    ],
    [locations]
  );

  console.log("Locations for map:", testLocations);

  const statCards = [
    {
      label: "Total Users",
      value: stats.total_users,
      icon: Users,
      bgColor: "bg-primary-100",
      iconColor: "text-primary-600",
    },
    {
      label: "Active Today",
      value: stats.active_today,
      icon: Activity,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      label: "Exercises",
      value: stats.total_workouts,
      icon: Dumbbell,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "Routines",
      value: stats.total_routines,
      icon: Trophy,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  const defaultCenter: [number, number] =
    testLocations.length > 0
      ? [testLocations[0].latitude, testLocations[0].longitude]
      : [46.0569, 14.5058];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? "-" : stat.value.toLocaleString()}
                </p>
              </div>
              <div
                className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}
              >
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </CardHeader>
          <div className="h-72">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">Loading chart...</p>
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    dot={false}
                    name="New Users"
                  />
                  <Line
                    type="monotone"
                    dataKey="routines"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="New Routines"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">No data available</p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live User Locations ({testLocations.length})</CardTitle>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm text-gray-500">Live</span>
            </div>
          </CardHeader>
          <div className="h-72 rounded-lg overflow-hidden">
            <MapContainer
              center={defaultCenter}
              zoom={10}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapUpdater center={defaultCenter} />
              {testLocations.map((loc, index) => {
                const colors = [
                  "#7c3aed",
                  "#10b981",
                  "#f59e0b",
                  "#ef4444",
                  "#3b82f6",
                  "#ec4899",
                  "#8b5cf6",
                  "#14b8a6",
                ];
                const color = colors[index % colors.length];
                return (
                  <CircleMarker
                    key={loc.id}
                    center={[loc.latitude, loc.longitude]}
                    radius={12}
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: 0.8,
                      color: "#fff",
                      weight: 2,
                    }}
                  >
                    <LeafletTooltip
                      direction="top"
                      offset={[0, -10]}
                      permanent={false}
                    >
                      <span className="font-medium">{loc.senderName}</span>
                    </LeafletTooltip>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900">
                          {loc.senderName}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          ID: {loc.senderId}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Lat: {loc.latitude.toFixed(5)}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Lng: {loc.longitude.toFixed(5)}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(loc.timestamp).toLocaleString()}
                        </p>
                        {loc.accuracy && (
                          <p className="text-gray-500 text-xs">
                            Accuracy: {loc.accuracy.toFixed(1)}m
                          </p>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <span className="text-sm text-gray-500">
            {stats.new_users_week} new this week
          </span>
        </CardHeader>
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-center py-8 text-gray-400">Loading...</p>
          ) : recentUsers.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Joined
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Last Login
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((recentUser) => (
                  <tr
                    key={recentUser.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {recentUser.full_name?.charAt(0) ||
                              recentUser.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {recentUser.full_name || "No name"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {recentUser.email}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(recentUser.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {recentUser.last_login
                        ? new Date(recentUser.last_login).toLocaleDateString()
                        : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center py-8 text-gray-400">No users found</p>
          )}
        </div>
      </Card>
    </>
  );
}

function EditUserModal({
  user,
  onClose,
  onSave,
}: {
  user: UserData;
  onClose: () => void;
  onSave: () => void;
}) {
  const [fullName, setFullName] = useState(user.full_name || "");
  const [newPassword, setNewPassword] = useState("");
  const [isActive, setIsActive] = useState(user.is_active);
  const [isStaff, setIsStaff] = useState(user.is_staff);
  const [isSuperuser, setIsSuperuser] = useState(user.is_superuser);
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateUser(user.id, {
        full_name: fullName,
        is_active: isActive,
        is_staff: isStaff,
        is_superuser: isSuperuser,
        password: newPassword || undefined,
      });
      onSave();
      onClose();
    } catch (err) {
      console.error("Failed to update user:", err);
      alert("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleSendPasswordReset = async () => {
    setSendingReset(true);
    try {
      await api.sendPasswordReset(user.id);
      alert("Password reset email sent");
    } catch (err) {
      console.error("Failed to send reset:", err);
      alert("Failed to send password reset");
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="text"
              value={user.email}
              disabled
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password (leave empty to keep current)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700"
            >
              Account Active
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isStaff"
              checked={isStaff}
              onChange={(e) => setIsStaff(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label
              htmlFor="isStaff"
              className="text-sm font-medium text-gray-700"
            >
              Admin (Staff)
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isSuperuser"
              checked={isSuperuser}
              onChange={(e) => setIsSuperuser(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <label
              htmlFor="isSuperuser"
              className="text-sm font-medium text-gray-700"
            >
              Superuser (Full Access)
            </label>
          </div>
          <button
            onClick={handleSendPasswordReset}
            disabled={sendingReset}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <Mail className="w-4 h-4" />
            {sendingReset ? "Sending..." : "Send Password Reset Email"}
          </button>
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.listAllUsers(page, 10);
      setUsers(response.data.users || []);
      setTotalPages(response.data.total_pages || 1);
      setTotal(response.data.total || 0);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.deleteUser(userId);
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  const handlePromoteUser = async (userId: number) => {
    try {
      await api.promoteToAdmin(userId);
      fetchUsers();
    } catch (err) {
      console.error("Failed to promote user:", err);
    }
  };

  const handleDemoteUser = async (userId: number) => {
    try {
      await api.demoteAdmin(userId);
      fetchUsers();
    } catch (err) {
      console.error("Failed to demote user:", err);
    }
  };

  return (
    <>
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={fetchUsers}
        />
      )}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({total})</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </CardHeader>
        {loading ? (
          <p className="text-center py-8 text-gray-400">Loading...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      User
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Joined
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {user.full_name?.charAt(0) ||
                                user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {user.full_name || "No name"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
                      <td className="py-3 px-4">
                        {user.is_superuser ? (
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                            Superuser
                          </span>
                        ) : user.is_staff ? (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                            Admin
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                            User
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {user.is_active ? (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {!user.is_staff && !user.is_superuser ? (
                            <button
                              onClick={() => handlePromoteUser(user.id)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Promote"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDemoteUser(user.id)}
                              className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                              title="Demote"
                            >
                              <TrendingUp className="w-4 h-4 rotate-180" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </>
  );
}

function ExercisesTab() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<Exercise[]>([]);
  const [duplicates, setDuplicates] = useState<
    {
      exercise: Exercise;
      action: "overwrite" | "rename" | "skip";
      newName?: string;
    }[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const perPage = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [exercisesRes, groupsRes] = await Promise.all([
        api.getWorkouts(),
        api.getMuscleGroups(),
      ]);
      const exData = exercisesRes.data;
      setExercises(Array.isArray(exData) ? exData : exData.results || []);
      const grpData = groupsRes.data;
      setMuscleGroups(Array.isArray(grpData) ? grpData : grpData.results || []);
    } catch (err) {
      console.error("Failed to fetch exercises:", err);
      setExercises([]);
      setMuscleGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredExercises =
    selectedGroup === "all"
      ? exercises
      : exercises.filter((ex) => ex.muscle_group?.name === selectedGroup);
  const totalPages = Math.ceil(filteredExercises.length / perPage);
  const paginatedExercises = filteredExercises.slice(
    (page - 1) * perPage,
    page * perPage
  );

  useEffect(() => {
    setPage(1);
  }, [selectedGroup]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const parsed: Exercise[] = Array.isArray(data) ? data : [data];
      setUploadPreview(parsed);

      const dups = parsed.filter((ex) =>
        exercises.some(
          (existing) => existing.name.toLowerCase() === ex.name.toLowerCase()
        )
      );
      setDuplicates(
        dups.map((ex) => ({ exercise: ex, action: "skip" as const }))
      );
    } catch (err) {
      console.error("Failed to parse JSON:", err);
      alert("Invalid JSON file");
      setUploadFile(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadPreview.length) return;
    setUploading(true);

    try {
      const toUpload = uploadPreview
        .map((ex) => {
          const dup = duplicates.find((d) => d.exercise.name === ex.name);
          if (dup) {
            if (dup.action === "skip") return null;
            if (dup.action === "rename" && dup.newName)
              return { ...ex, name: dup.newName };
            if (dup.action === "overwrite") return { ...ex, overwrite: true };
          }
          return ex;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      await api.importExercises(toUpload);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadPreview([]);
      setDuplicates([]);
      fetchData();
    } catch (err) {
      console.error("Failed to import exercises:", err);
      alert("Failed to import exercises");
    } finally {
      setUploading(false);
    }
  };

  const updateDuplicateAction = (
    name: string,
    action: "overwrite" | "rename" | "skip",
    newName?: string
  ) => {
    setDuplicates((prev) =>
      prev.map((d) =>
        d.exercise.name === name ? { ...d, action, newName } : d
      )
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CardTitle>Exercises ({filteredExercises.length})</CardTitle>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Muscle Groups</option>
              {muscleGroups.map((group) => (
                <option key={group.id} value={group.name}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Upload className="w-4 h-4" />
            Import JSON
          </button>
        </CardHeader>
        {loading ? (
          <p className="text-center py-8 text-gray-400">Loading...</p>
        ) : paginatedExercises.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Muscle Group
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Equipment
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Level
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedExercises.map((exercise) => (
                    <tr
                      key={exercise.id}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Dumbbell className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">
                            {exercise.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {exercise.muscle_group?.name || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full capitalize">
                          {exercise.exercise_type?.replace("_", " ") || "-"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 capitalize">
                        {exercise.equipment_required?.replace("_", " ") || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                            exercise.experience_level === "beginner"
                              ? "bg-green-100 text-green-700"
                              : exercise.experience_level === "intermediate"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {exercise.experience_level || "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * perPage + 1}-
                {Math.min(page * perPage, filteredExercises.length)} of{" "}
                {filteredExercises.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center py-8 text-gray-400">No exercises found</p>
        )}
      </Card>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Import Exercises
              </h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadPreview([]);
                  setDuplicates([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!uploadFile ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-12 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-500 flex flex-col items-center gap-2"
                >
                  <Upload className="w-10 h-10 text-gray-400" />
                  <span className="text-gray-500">
                    Click to select JSON file
                  </span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                  <span className="font-medium">{uploadFile.name}</span>
                  <span className="text-sm text-gray-500">
                    {uploadPreview.length} exercise(s)
                  </span>
                </div>

                {duplicates.length > 0 && (
                  <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                    <p className="font-medium text-yellow-800 mb-3">
                      Duplicate names found:
                    </p>
                    <div className="space-y-3">
                      {duplicates.map((dup) => (
                        <div
                          key={dup.exercise.name}
                          className="flex items-center gap-3 flex-wrap"
                        >
                          <span className="font-medium text-gray-700 min-w-[150px]">
                            {dup.exercise.name}
                          </span>
                          <select
                            value={dup.action}
                            onChange={(e) =>
                              updateDuplicateAction(
                                dup.exercise.name,
                                e.target.value as
                                  | "overwrite"
                                  | "rename"
                                  | "skip"
                              )
                            }
                            className="px-2 py-1 border border-gray-200 rounded text-sm"
                          >
                            <option value="skip">Skip</option>
                            <option value="overwrite">Overwrite</option>
                            <option value="rename">Rename</option>
                          </select>
                          {dup.action === "rename" && (
                            <input
                              type="text"
                              placeholder="New name"
                              value={dup.newName || ""}
                              onChange={(e) =>
                                updateDuplicateAction(
                                  dup.exercise.name,
                                  "rename",
                                  e.target.value
                                )
                              }
                              className="px-2 py-1 border border-gray-200 rounded text-sm flex-1"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">
                          Name
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">
                          Muscle Group
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadPreview.slice(0, 10).map((ex, i) => {
                        const isDup = duplicates.some(
                          (d) => d.exercise.name === ex.name
                        );
                        const dupAction = duplicates.find(
                          (d) => d.exercise.name === ex.name
                        )?.action;
                        return (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="py-2 px-3">{ex.name}</td>
                            <td className="py-2 px-3 text-gray-600">
                              {ex.muscle_group?.name || "-"}
                            </td>
                            <td className="py-2 px-3">
                              {isDup ? (
                                <span
                                  className={`px-2 py-0.5 text-xs rounded-full ${
                                    dupAction === "skip"
                                      ? "bg-gray-100 text-gray-600"
                                      : dupAction === "overwrite"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-blue-100 text-blue-700"
                                  }`}
                                >
                                  {dupAction === "skip"
                                    ? "Will skip"
                                    : dupAction === "overwrite"
                                    ? "Will overwrite"
                                    : "Will rename"}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                                  New
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {uploadPreview.length > 10 && (
                    <p className="text-center py-2 text-sm text-gray-500">
                      ...and {uploadPreview.length - 10} more
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setUploadFile(null);
                      setUploadPreview([]);
                      setDuplicates([]);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      "Import Exercises"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function RivalriesTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rivalries</CardTitle>
      </CardHeader>
      <div className="py-12 text-center text-gray-400">
        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Rivalries feature coming soon</p>
      </div>
    </Card>
  );
}

function SoundsTab() {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [blockSizeN, setBlockSizeN] = useState(1024);
  const [discardM, setDiscardM] = useState(100);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSounds = async () => {
    setLoading(true);
    try {
      const response = await api.getSounds();
      setSounds(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch sounds:", err);
      setSounds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSounds();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadName(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadName.trim()) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("name", uploadName);
      formData.append("block_size_n", blockSizeN.toString());
      formData.append("discard_m", discardM.toString());
      const response = await api.uploadSound(formData);

      const comp = response.data.compression;
      if (comp) {
        if (comp.compressed) {
          alert(
            `Compression successful!\n\nOriginal: ${(
              comp.original_size / 1024
            ).toFixed(1)} KB\nCompressed: ${(
              comp.compressed_size / 1024
            ).toFixed(1)} KB\nRatio: ${comp.ratio}:1\nSavings: ${
              comp.savings_percent
            }%`
          );
        } else {
          alert(
            `Upload successful (no compression)\n\nReason: ${
              comp.error || "Unknown"
            }`
          );
        }
      }

      setShowUploadModal(false);
      setUploadFile(null);
      setUploadName("");
      setBlockSizeN(1024);
      setDiscardM(100);
      fetchSounds();
    } catch (err) {
      console.error("Failed to upload sound:", err);
      alert("Failed to upload sound.");
    } finally {
      setUploading(false);
    }
  };

  const handlePlay = (sound: Sound) => {
    if (playingId === sound.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else if (audioRef.current) {
      audioRef.current.src = sound.file_url;
      audioRef.current.play();
      setPlayingId(sound.id);
    }
  };

  const handleDelete = async (soundId: string) => {
    if (!confirm("Delete this sound?")) return;
    try {
      await api.deleteSound(soundId);
      fetchSounds();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const formatDuration = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0")}`;

  return (
    <>
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />
      <Card>
        <CardHeader>
          <CardTitle>Soundbites ({sounds.length})</CardTitle>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Plus className="w-4 h-4" />
            Upload
          </button>
        </CardHeader>
        {loading ? (
          <p className="text-center py-8 text-gray-400">Loading...</p>
        ) : sounds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {sounds.map((sound) => (
              <div
                key={sound.id}
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
              >
                <button
                  onClick={() => handlePlay(sound)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                    playingId === sound.id
                      ? "bg-primary-600 text-white"
                      : "bg-white text-primary-600 border border-gray-200"
                  }`}
                >
                  {playingId === sound.id ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {sound.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDuration(sound.duration)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(sound.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">
            <Volume2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No soundbites uploaded</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Upload First Sound
            </button>
          </div>
        )}
      </Card>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Upload Soundbite
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audio File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-500 flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  {uploadFile ? (
                    <span className="text-primary-600 font-medium">
                      {uploadFile.name}
                    </span>
                  ) : (
                    <span className="text-gray-500">Click to select</span>
                  )}
                </button>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  MDCT Compression Settings
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Block Size (N)
                    </label>
                    <select
                      value={blockSizeN}
                      onChange={(e) => setBlockSizeN(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value={512}>512</option>
                      <option value={1024}>1024</option>
                      <option value={2048}>2048</option>
                      <option value={4096}>4096</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Discard (M)
                    </label>
                    <input
                      type="number"
                      value={discardM}
                      onChange={(e) => setDiscardM(Number(e.target.value))}
                      min={0}
                      max={blockSizeN - 1}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Higher M = more compression, lower quality. Keep M &lt; N.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || !uploadName.trim() || uploading}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Compressing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const { isConnected, messages, connect, disconnect } = useMqtt();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    active_today: 0,
    total_workouts: 0,
    total_routines: 0,
    new_users_week: 0,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [recentUsers, setRecentUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getDashboardStats();
      setStats(
        response.data.stats || {
          total_users: 0,
          active_today: 0,
          total_workouts: 0,
          total_routines: 0,
          new_users_week: 0,
        }
      );
      setChartData(response.data.chart_data || []);
      setRecentUsers(response.data.recent_users || []);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const tabs = [
    { id: "dashboard" as TabType, label: "Dashboard", icon: Activity },
    { id: "users" as TabType, label: "Users", icon: Users },
    { id: "exercises" as TabType, label: "Exercises", icon: Dumbbell },
    { id: "rivalries" as TabType, label: "Rivalries", icon: Trophy },
    { id: "sounds" as TabType, label: "Sounds", icon: Volume2 },
    { id: "steps" as TabType, label: "Steps", icon: Footprints },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-start gap-3 px-4 py-3 w-full rounded-xl font-medium transition ${
                activeTab === tab.id
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
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

      <main className="ml-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 capitalize">
                {activeTab}
              </h1>
              <p className="text-gray-600">
                Welcome back, {user?.full_name || "Admin"}
              </p>
            </div>
            {activeTab === "dashboard" && (
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            )}
          </div>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}
          {activeTab === "dashboard" && (
            <DashboardTab
              stats={stats}
              chartData={chartData}
              recentUsers={recentUsers}
              loading={loading}
              locations={messages.map((msg) => ({
                ...msg,
                timestamp: String(msg.timestamp),
              }))}
            />
          )}
          {activeTab === "users" && <UsersTab />}
          {activeTab === "exercises" && <ExercisesTab />}
          {activeTab === "rivalries" && <RivalriesTab />}
          {activeTab === "sounds" && <SoundsTab />}
          {activeTab === "steps" && <StepsTab isConnected={isConnected} />}
        </div>
      </main>
    </div>
  );
}
