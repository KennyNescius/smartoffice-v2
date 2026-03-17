import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { QrCode, LayoutDashboard, Package, Users, Settings, LogOut } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export const Layout: React.FC = () => {
  const { currentUser } = useStore();
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">
                    {currentUser.role === 'ADMIN' ? 'Администратор' : currentUser.role === 'AUDITOR' ? 'Аудитор' : 'Сотрудник'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                title="Выйти"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Выйти
              </button>
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
