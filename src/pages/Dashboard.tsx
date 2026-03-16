import React from 'react';
import { useStore } from '../store/StoreContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Package, CheckCircle, AlertCircle, RefreshCw, XOctagon } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const STATUS_COLORS = {
  REGISTERED: '#3b82f6', // blue
  ASSIGNED: '#10b981', // green
  IN_REPAIR: '#f59e0b', // yellow
  LOST: '#ef4444', // red
  WRITTEN_OFF: '#6b7280', // gray
};

const STATUS_LABELS = {
  REGISTERED: 'На складе',
  ASSIGNED: 'Выдан',
  IN_REPAIR: 'В ремонте',
  LOST: 'Утерян',
  WRITTEN_OFF: 'Списан',
};

export const Dashboard: React.FC = () => {
  const { assets } = useStore();

  const totalAssets = assets.length;
  
  const statusData = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    name: label,
    value: assets.filter(a => a.status === key).length,
    color: STATUS_COLORS[key as keyof typeof STATUS_COLORS]
  })).filter(d => d.value > 0);

  const categoryMap = assets.reduce((acc, asset) => {
    acc[asset.category] = (acc[asset.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value
  }));

  const statCards = [
    { title: 'Всего активов', value: totalAssets, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: 'Выдано', value: assets.filter(a => a.status === 'ASSIGNED').length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'В ремонте', value: assets.filter(a => a.status === 'IN_REPAIR').length, icon: RefreshCw, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Утеряно', value: assets.filter(a => a.status === 'LOST').length, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Дашборд</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center space-x-4">
            <div className={`p-3 rounded-full ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.title}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Статусы активов</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Категории</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
