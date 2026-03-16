import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { QrCode, LayoutDashboard, Package, UserCircle, Users, Settings } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { cn } from '../lib/utils';

export const Layout: React.FC = () => {
  const { users, currentUser, setCurrentUser } = useStore();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Дашборд', icon: LayoutDashboard },
    { path: '/assets', label: 'Активы', icon: Package },
    { path: '/employees', label: 'Сотрудники', icon: Users },
    { path: '/scan', label: 'Сканер', icon: QrCode },
    { path: '/settings', label: 'Настройки', icon: Settings, adminOnly: true },
  ];

  const filteredNavItems = navItems.filter(item => !item.adminOnly || currentUser.role === 'ADMIN');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-indigo-600 tracking-tight">SmartOffice</span>
              </div>
              <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                        isActive
                          ? 'border-indigo-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      )}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center">
              <div className="relative flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-gray-400" />
                <select
                  value={currentUser.id}
                  onChange={(e) => setCurrentUser(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-slate-50"
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <div className="sm:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 z-10 pb-safe print:hidden">
        <div className="flex justify-around">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center py-3 px-4 text-xs font-medium',
                  isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
                )}
              >
                <Icon className="w-6 h-6 mb-1" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
