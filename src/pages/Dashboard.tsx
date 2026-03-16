import React, { useState, useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Package, CheckCircle, AlertCircle, RefreshCw, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const expiringAssets = assets
    .filter(a => a.expirationDate && a.status !== 'LOST' && a.status !== 'WRITTEN_OFF')
    .map(a => {
      const expiration = new Date(a.expirationDate!);
      const now = new Date();
      const diffTime = expiration.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...a, diffDays };
    })
    .filter(a => a.diffDays <= 90)
    .sort((a, b) => a.diffDays - b.diffDays);

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
            {isMounted && (
              <ResponsiveContainer width="99%" height="100%">
                <PieChart width={1} height={1}>
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
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Категории</h2>
          <div className="h-64 w-full">
            {isMounted && (
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={categoryData} width={1} height={1}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-amber-500" />
            Активы, требующие замены
          </h2>
          <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {expiringAssets.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Актив</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Инв. номер</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Срок до</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Перейти</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expiringAssets.length > 0 ? (
                expiringAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                      <div className="text-xs text-gray-500">{asset.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {asset.inventoryNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center text-sm font-medium ${
                        asset.diffDays < 0 ? 'text-red-600' : 
                        asset.diffDays <= 30 ? 'text-amber-600' : 'text-slate-600'
                      }`}>
                        <Calendar className="w-4 h-4 mr-1.5" />
                        {new Date(asset.expirationDate!).toLocaleDateString('ru-RU')}
                        <span className="ml-2 text-xs opacity-75">
                          ({asset.diffDays < 0 ? 'Истек' : `осталось ${asset.diffDays} дн.`})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        asset.status === 'ASSIGNED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {asset.status === 'ASSIGNED' ? 'Выдан' : 'На складе'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/assets/${asset.id}`} className="text-indigo-600 hover:text-indigo-900">
                        Открыть
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                    Нет активов с истекающим сроком службы
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
