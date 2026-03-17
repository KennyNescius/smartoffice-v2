import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Building2, Users, Plus, Search, CheckCircle2, XCircle, Trash2, Mail, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export const Employees: React.FC = () => {
  const { departments, employees, addDepartment, deleteDepartment, addEmployee, deactivateEmployee, currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<'employees' | 'departments'>('employees');

  // Department Form
  const [newDeptName, setNewDeptName] = useState('');

  // Employee Form
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [empFirstName, setEmpFirstName] = useState('');
  const [empLastName, setEmpLastName] = useState('');
  const [empPosition, setEmpPosition] = useState('');
  const [empDeptId, setEmpDeptId] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empRole, setEmpRole] = useState('USER');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');

  const isAdmin = currentUser.role === 'ADMIN';

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newDeptName.trim()) {
      try {
        await addDepartment(newDeptName.trim());
        setNewDeptName('');
        toast.success('Департамент добавлен');
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empFirstName || !empLastName || !empPosition || !empDeptId) {
      toast.error('Заполните все обязательные поля');
      return;
    }
    if (!empEmail || !empPassword) {
      toast.error('Email и пароль обязательны для создания аккаунта');
      return;
    }
    if (empPassword.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов');
      return;
    }
    try {
      await addEmployee({
        firstName: empFirstName.trim(),
        lastName: empLastName.trim(),
        position: empPosition.trim(),
        departmentId: empDeptId,
        email: empEmail.trim(),
        password: empPassword,
        role: empRole,
      });
      setShowEmpForm(false);
      setEmpFirstName('');
      setEmpLastName('');
      setEmpPosition('');
      setEmpDeptId('');
      setEmpEmail('');
      setEmpPassword('');
      setEmpRole('USER');
      toast.success('Сотрудник добавлен и аккаунт создан');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept === 'all' || emp.departmentId === filterDept;
    return matchesSearch && matchesDept;
  });

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Доступ запрещен</h2>
        <p className="mt-2 text-gray-500">У вас нет прав для просмотра этой страницы.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Сотрудники и Департаменты</h1>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('employees')}
            className={cn(
              activeTab === 'employees'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center'
            )}
          >
            <Users className="w-5 h-5 mr-2" />
            Сотрудники
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={cn(
              activeTab === 'departments'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center'
            )}
          >
            <Building2 className="w-5 h-5 mr-2" />
            Департаменты
          </button>
        </nav>
      </div>

      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Добавить департамент</h3>
            <form onSubmit={handleAddDepartment} className="flex gap-4">
              <input
                type="text"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="Название департамента"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                required
              />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить
              </button>
            </form>
          </div>

          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Название
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Количество сотрудников
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departments.map((dept) => {
                  const empCount = employees.filter((e) => e.departmentId === dept.id).length;
                  return (
                    <tr key={dept.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {dept.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {empCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={async () => {
                            if (window.confirm('Вы уверены, что хотите удалить этот департамент?')) {
                              try {
                                await deleteDepartment(dept.id);
                                toast.success('Департамент удален');
                              } catch (err: any) {
                                toast.error(err.message);
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Удалить департамент"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {departments.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                      Нет данных
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'employees' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Поиск по ФИО..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
              >
                <option value="all">Все департаменты</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowEmpForm(!showEmpForm)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить сотрудника
            </button>
          </div>

          {showEmpForm && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Новый сотрудник</h3>
              <form onSubmit={handleAddEmployee} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Имя <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={empFirstName}
                      onChange={(e) => setEmpFirstName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Фамилия <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={empLastName}
                      onChange={(e) => setEmpLastName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Должность <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={empPosition}
                      onChange={(e) => setEmpPosition(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Департамент <span className="text-red-500">*</span></label>
                    <select
                      value={empDeptId}
                      onChange={(e) => setEmpDeptId(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border bg-white"
                      required
                    >
                      <option value="">Выберите департамент</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-indigo-500" />
                    Учетная запись
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        <Mail className="w-3.5 h-3.5 inline mr-1" />
                        Email (логин) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={empEmail}
                        onChange={(e) => setEmpEmail(e.target.value)}
                        placeholder="employee@company.com"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Пароль <span className="text-red-500">*</span></label>
                      <input
                        type="password"
                        value={empPassword}
                        onChange={(e) => setEmpPassword(e.target.value)}
                        placeholder="Мин. 6 символов"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        required
                        minLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Уровень доступа <span className="text-red-500">*</span></label>
                      <select
                        value={empRole}
                        onChange={(e) => setEmpRole(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border bg-white"
                      >
                        <option value="USER">Сотрудник</option>
                        <option value="AUDITOR">Аудитор</option>
                        <option value="ADMIN">Администратор</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEmpForm(false)}
                    className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Создать сотрудника и аккаунт
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Сотрудник
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Должность
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Департамент
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((emp) => {
                  const dept = departments.find((d) => d.id === emp.departmentId);
                  return (
                    <tr key={emp.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {emp.firstName} {emp.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {emp.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dept?.name || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {emp.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Активен
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Уволен
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {emp.isActive && (
                          <button
                            onClick={async () => {
                              if (window.confirm('Вы уверены, что хотите деактивировать этого сотрудника?')) {
                                try {
                                  await deactivateEmployee(emp.id);
                                  toast.success('Сотрудник деактивирован');
                                } catch (err: any) {
                                  toast.error(err.message);
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Деактивировать
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      Сотрудники не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
