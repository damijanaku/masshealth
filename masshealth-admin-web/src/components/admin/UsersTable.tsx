import { useState } from 'react';
import {
  Search,
  MoreHorizontal,
  Shield,
  ShieldOff,
  RotateCcw,
  Trash2,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import Card, { CardHeader, CardTitle } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/Modal';
import { User } from '@/types';
import { format } from 'date-fns';

interface UsersTableProps {
  users: User[];
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onToggleAdmin: (userId: string) => void;
  onResetPassword: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
}

const UsersTable = ({
  users,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  onSearch,
  onToggleAdmin,
  onResetPassword,
  onDeleteUser,
}: UsersTableProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; userId: string | null }>({
    open: false,
    userId: null,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.userId) {
      onDeleteUser(deleteConfirm.userId);
      setDeleteConfirm({ open: false, userId: null });
    }
  };

  return (
    <Card padding="none">
      {/* Header */}
      <div className="p-4 border-b border-surface-100">
        <CardHeader className="mb-0">
          <CardTitle>User Management</CardTitle>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="pl-10 pr-4 py-2 rounded-lg border border-surface-200 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
              />
            </div>
            <Button type="submit" size="sm">
              Search
            </Button>
          </form>
        </CardHeader>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-50 border-b border-surface-100">
              <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase tracking-wider">
                User
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase tracking-wider">
                Email
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-surface-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-surface-200 rounded-full" />
                      <div className="h-4 w-32 bg-surface-200 rounded" />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-40 bg-surface-200 rounded" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-6 w-16 bg-surface-200 rounded-full" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-24 bg-surface-200 rounded" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-8 w-8 bg-surface-200 rounded ml-auto" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-surface-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold">
                        {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-surface-900">{user.full_name}</p>
                        <p className="text-sm text-surface-500">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-surface-600">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {user.is_superuser ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          <Shield className="w-3 h-3" />
                          Super Admin
                        </span>
                      ) : user.is_staff ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-surface-100 text-surface-600">
                          User
                        </span>
                      )}
                      {user.is_verified && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent-100 text-accent-700">
                          Verified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-surface-500 text-sm">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(user.date_joined), 'MMM d, yyyy')}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="relative flex justify-end">
                      <button
                        onClick={() =>
                          setActiveDropdown(activeDropdown === user.id ? null : user.id)
                        }
                        className="p-2 rounded-lg hover:bg-surface-100 transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5 text-surface-500" />
                      </button>

                      {/* Dropdown menu */}
                      {activeDropdown === user.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActiveDropdown(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-lg shadow-xl border border-surface-100 py-1">
                            <button
                              onClick={() => {
                                onToggleAdmin(user.id);
                                setActiveDropdown(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                            >
                              {user.is_staff ? (
                                <>
                                  <ShieldOff className="w-4 h-4" />
                                  Remove Admin
                                </>
                              ) : (
                                <>
                                  <Shield className="w-4 h-4" />
                                  Make Admin
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                onResetPassword(user.id);
                                setActiveDropdown(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Reset Password
                            </button>
                            <hr className="my-1 border-surface-100" />
                            <button
                              onClick={() => {
                                setDeleteConfirm({ open: true, userId: user.id });
                                setActiveDropdown(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete User
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-surface-100 flex items-center justify-between">
          <p className="text-sm text-surface-500">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, userId: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </Card>
  );
};

export default UsersTable;
