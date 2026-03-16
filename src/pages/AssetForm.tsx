import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/StoreContext';
import { ArrowLeft, Save } from 'lucide-react';
import { AssetCategory } from '../types';

export const AssetForm: React.FC = () => {
  const navigate = useNavigate();
  const { addAsset, currentUser } = useStore();

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    category: 'IT' as AssetCategory,
    serialNumber: '',
    inventoryNumber: '',
  });

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Доступ запрещен</h2>
        <p className="mt-2 text-gray-500">У вас нет прав для добавления активов.</p>
        <button onClick={() => navigate('/assets')} className="mt-4 text-indigo-600 hover:text-indigo-900">
          Вернуться к списку
        </button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAsset(formData);
    navigate('/assets');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 sm:pb-0">
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate('/assets')} className="p-2 rounded-full hover:bg-gray-200 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Добавление актива</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Наименование
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                  placeholder="Например: MacBook Pro 16"
                />
              </div>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Тип
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="type"
                  id="type"
                  required
                  value={formData.type}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                  placeholder="Например: Ноутбук"
                />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Категория
              </label>
              <div className="mt-1">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border bg-white"
                >
                  <option value="IT">IT</option>
                  <option value="Office">Офис</option>
                  <option value="Security">Безопасность</option>
                  <option value="Other">Другое</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="inventoryNumber" className="block text-sm font-medium text-gray-700">
                Инвентарный номер
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="inventoryNumber"
                  id="inventoryNumber"
                  required
                  value={formData.inventoryNumber}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border font-mono"
                  placeholder="INV-1001"
                />
              </div>
            </div>

            <div>
              <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700">
                Серийный номер
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="serialNumber"
                  id="serialNumber"
                  required
                  value={formData.serialNumber}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border font-mono"
                  placeholder="SN12345678"
                />
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/assets')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Save className="w-4 h-4 mr-2" />
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
