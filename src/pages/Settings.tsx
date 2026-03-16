import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Settings as SettingsIcon, Save, Info } from 'lucide-react';

export const Settings: React.FC = () => {
  const { settings, updateSettings, currentUser } = useStore();
  const [extensionMonths, setExtensionMonths] = useState(settings.maintenanceExtensionMonths);
  const [isSaved, setIsSaved] = useState(false);

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Доступ запрещен</h2>
        <p className="mt-2 text-gray-500">У вас нет прав для просмотра настроек системы.</p>
      </div>
    );
  }

  const handleSave = () => {
    updateSettings({ maintenanceExtensionMonths: extensionMonths });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <SettingsIcon className="w-6 h-6 mr-2 text-indigo-600" />
          Настройки системы
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Обслуживание и ремонт</h2>
          <p className="text-sm text-slate-500 mt-1">Параметры жизненного цикла активов после технического обслуживания</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="max-w-md">
            <label htmlFor="extensionMonths" className="block text-sm font-medium text-gray-700">
              Стандартный срок продления после ТО (мес.)
            </label>
            <div className="mt-1 flex items-center space-x-4">
              <input
                type="number"
                id="extensionMonths"
                min="1"
                max="60"
                value={extensionMonths}
                onChange={(e) => setExtensionMonths(parseInt(e.target.value) || 0)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
              />
              <span className="text-sm text-gray-500 whitespace-nowrap">месяцев</span>
            </div>
            <p className="mt-2 text-xs text-gray-500 flex items-start">
              <Info className="w-3.5 h-3.5 mr-1 mt-0.5 flex-shrink-0" />
              Этот срок будет предлагаться по умолчанию при возврате актива из ремонта с продлением срока службы.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 flex items-center justify-between">
          <div className="text-sm">
            {isSaved && (
              <span className="text-emerald-600 font-medium flex items-center">
                <Save className="w-4 h-4 mr-1" />
                Настройки сохранены
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Сохранить изменения
          </button>
        </div>
      </div>
    </div>
  );
};
