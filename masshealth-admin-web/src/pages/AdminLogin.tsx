import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <img src="/MassHealthLogo2.svg" alt="MassHealth" className="w-60 h-60 lg:w-40 lg:h-40 mb-10 animate-fade-in" />
          <h1 className="text-3xl font-bold text-white mb-2 text-center">Admin Portal</h1>
          <p className="text-primary-200 text-center">Sign in to access the dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center justify-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm text-center">{error}</span>
              </div>
            )}

            <div className="flex flex-col items-stretch">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-center sm:text-left"
                  placeholder="admin@masshealth.com"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col items-stretch">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-center sm:text-left"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-center">
              <Button type="submit" className="w-full" loading={loading}>
                Sign In
              </Button>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-center">
            <a href="/" className="text-sm text-gray-500 hover:text-primary-600 transition text-center">
              Back to main site
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}