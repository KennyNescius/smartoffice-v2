import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/StoreContext';
import { Search, Plus, Filter, UserPlus, Package, Download } from 'lucide-react';
import { STATUS_LABELS, STATUS_COLORS } from '../lib/constants';
import { toast } from 'sonner';


export const AssetList: React.FC = () => {
  const { assets, currentUser, employees, departments, assignAsset } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [employeeFilter, setEmployeeFilter] = useState<string>('ALL');
  const [lifespanFilter, setLifespanFilter] = useState<string[]>([]);

  const [assignModalAssetId, setAssignModalAssetId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [assignReason, setAssignReason] = useState<string>('');
  const [employeeSearch, setEmployeeSearch] = useState<string>('');
  const [assignError, setAssignError] = useState<string>('');

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(search.toLowerCase()) || 
                          asset.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
                          asset.inventoryNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || asset.status === statusFilter;
    
    const owner = employees.find(e => e.id === asset.employeeId);
    const matchesDepartment = departmentFilter === 'ALL' || owner?.departmentId === departmentFilter;
    const matchesEmployee = employeeFilter === 'ALL' || asset.employeeId === employeeFilter;
    
    const matchesLifespan = lifespanFilter.length === 0 || lifespanFilter.some(filter => {
      if (!asset.expirationDate || asset.status === 'LOST' || asset.status === 'WRITTEN_OFF') return false;
      const expiration = new Date(asset.expirationDate);
      const now = new Date();
      const diffTime = expiration.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (filter === 'MONTH_1') return diffDays >= 0 && diffDays <= 30;
      if (filter === 'MONTH_3') return diffDays > 30 && diffDays <= 90;
      if (filter === 'MONTH_6') return diffDays > 90 && diffDays <= 180;
      if (filter === 'YEAR_UNDER_1') return diffDays > 180 && diffDays <= 365;
      if (filter === 'YEAR_1') return diffDays > 365;
      return false;
    });

    if (currentUser.role === 'USER') {
      const userEmployee = employees.find(e => `${e.firstName} ${e.lastName}` === currentUser.name.split(' (')[0]);
      if (!userEmployee || asset.employeeId !== userEmployee.id) {
        return false;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesEmployee && matchesLifespan;
  });

  const handleLifespanFilterChange = (filter: string) => {
    setLifespanFilter(prev => 
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const handleExportCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['Наименование', 'Тип', 'Категория', 'Серийный номер', 'Инв. номер', 'Статус', 'Владелец', 'Департамент', 'Дата добавления', 'Начало эксплуатации', 'Срок до'];
    const rows = filteredAssets.map(asset => {
      const owner = employees.find(e => e.id === asset.employeeId);
      const dept = owner ? departments.find(d => d.id === owner.departmentId) : null;
      return [
        asset.name,
        asset.type,
        asset.category,
        asset.serialNumber,
        asset.inventoryNumber,
        STATUS_LABELS[asset.status],
        owner ? `${owner.firstName} ${owner.lastName}` : '',
        dept?.name || '',
        new Date(asset.dateAdded).toLocaleDateString('ru-RU'),
        asset.exploitationStartDate ? new Date(asset.exploitationStartDate).toLocaleDateString('ru-RU') : '',
        asset.expirationDate ? new Date(asset.expirationDate).toLocaleDateString('ru-RU') : '',
      ];
    });

    const csvContent = BOM + [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assets_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Выгружено ${filteredAssets.length} активов`);
  };

  const handleAssign = async () => {
    if (!assignModalAssetId) return;
    if (!selectedEmployee) {
      setAssignError('Пожалуйста, выберите сотрудника из списка');
      return;
    }
    try {
      await assignAsset(assignModalAssetId, selectedEmployee, assignReason);
      toast.success('Актив выдан сотруднику');
    } catch (err: any) {
      toast.error(err.message);
      return;
    }
    setAssignModalAssetId(null);
    setSelectedEmployee('');
    setAssignReason('');
    setEmployeeSearch('');
    setAssignError('');
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">
          {currentUser.role === 'USER' ? 'Мои активы' : 'Все активы'}
        </h1>
        <div className="flex gap-2">
          {(currentUser.role === 'ADMIN' || currentUser.role === 'AUDITOR') && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Выгрузить CSV
            </button>
          )}
          {currentUser.role === 'ADMIN' && (
            <Link
              to="/assets/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить актив
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Поиск по названию, серийному или инвентарному номеру..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="relative sm:w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Все статусы</option>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          
          {(currentUser.role === 'ADMIN' || currentUser.role === 'AUDITOR') && (
            <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-gray-100">
              <div className="relative flex-1 sm:w-1/2">
                <select
                  className="block w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="ALL">Все департаменты</option>
                  {departments.map(dep => (
                    <option key={dep.id} value={dep.id}>{dep.name}</option>
                  ))}
                </select>
              </div>
              <div className="relative flex-1 sm:w-1/2">
                <select
                  className="block w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                >
                  <option value="ALL">Все сотрудники</option>
                  {employees.filter(e => departmentFilter === 'ALL' || e.departmentId === departmentFilter).map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Оставшийся срок службы</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {[
                { id: 'MONTH_1', label: 'Меньше 1 месяца' },
                { id: 'MONTH_3', label: 'До 3 месяцев' },
                { id: 'MONTH_6', label: 'До полугода' },
                { id: 'YEAR_UNDER_1', label: 'До 1 года' },
                { id: 'YEAR_1', label: 'Больше года' },
              ].map(filter => (
                <label key={filter.id} className="inline-flex items-center text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 mr-2"
                    checked={lifespanFilter.includes(filter.id)}
                    onChange={() => handleLifespanFilterChange(filter.id)}
                  />
                  {filter.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Наименование
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Инв. номер
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Эксплуатация
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Владелец
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Действия</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => {
                  const owner = employees.find(e => e.id === asset.employeeId);
                  const ownerDept = departments.find(d => d.id === owner?.departmentId);
                  return (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {asset.photoUrl ? (
                            <img
                              src={`http://localhost:3001${asset.photoUrl}`}
                              alt={asset.name}
                              className="h-10 w-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                            <div className="text-sm text-gray-500">{asset.category} • {asset.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{asset.inventoryNumber}</div>
                        <div className="text-sm text-gray-500">SN: {asset.serialNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {asset.exploitationStartDate ? new Date(asset.exploitationStartDate).toLocaleDateString('ru-RU') : '—'}
                        </div>
                        {asset.expirationDate && (
                          <div className="text-xs text-gray-500">До: {new Date(asset.expirationDate).toLocaleDateString('ru-RU')}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[asset.status]}`}>
                          {STATUS_LABELS[asset.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{owner ? `${owner.firstName} ${owner.lastName}` : '-'}</div>
                        {ownerDept && <div className="text-xs text-gray-500">{ownerDept.name}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        {currentUser.role === 'ADMIN' && (asset.status === 'REGISTERED' || asset.status === 'IN_REPAIR') && (
                          <button 
                            onClick={() => setAssignModalAssetId(asset.id)}
                            className="text-emerald-600 hover:text-emerald-900"
                            title="Выдать актив"
                          >
                            Выдать
                          </button>
                        )}
                        <Link to={`/assets/${asset.id}`} className="text-indigo-600 hover:text-indigo-900">
                          Подробнее
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                    Активы не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal */}
      {assignModalAssetId && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setAssignModalAssetId(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Выдача актива</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Поиск сотрудника</label>
                    <input 
                      type="text" 
                      placeholder="Введите имя или фамилию..." 
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mb-2"
                    />
                    <select 
                      size={5}
                      value={selectedEmployee} 
                      onChange={(e) => { setSelectedEmployee(e.target.value); setAssignError(''); }} 
                      className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      {employees
                        .filter(e => e.isActive && `${e.firstName} ${e.lastName}`.toLowerCase().includes(employeeSearch.toLowerCase()))
                        .map(e => {
                          const dept = departments.find(d => d.id === e.departmentId);
                          return (
                            <option key={e.id} value={e.id} className="py-1">
                              {e.firstName} {e.lastName} {dept ? `(${dept.name})` : ''}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Комментарий (опционально)</label>
                    <textarea value={assignReason} onChange={(e) => setAssignReason(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  </div>
                  {assignError && (
                    <p className="text-sm text-red-600 font-medium">{assignError}</p>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button type="button" onClick={handleAssign} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm">
                  Выдать
                </button>
                <button type="button" onClick={() => { setAssignModalAssetId(null); setAssignError(''); }} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
