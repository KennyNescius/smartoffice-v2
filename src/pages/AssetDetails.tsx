import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/StoreContext';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Edit, Trash2, UserPlus, ArrowDownLeft, AlertTriangle, RefreshCw, XCircle, Printer } from 'lucide-react';
import { AssetStatus } from '../types';

const STATUS_LABELS = {
  REGISTERED: 'На складе',
  ASSIGNED: 'Выдан',
  IN_REPAIR: 'В ремонте',
  LOST: 'Утерян',
  WRITTEN_OFF: 'Списан',
};

const STATUS_COLORS = {
  REGISTERED: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-emerald-100 text-emerald-800',
  IN_REPAIR: 'bg-amber-100 text-amber-800',
  LOST: 'bg-red-100 text-red-800',
  WRITTEN_OFF: 'bg-gray-100 text-gray-800',
};

export const AssetDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { assets, history, users, employees, departments, currentUser, changeStatus, assignAsset, returnAsset, deleteAsset } = useStore();
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [newStatus, setNewStatus] = useState<AssetStatus>('IN_REPAIR');
  const [employeeSearch, setEmployeeSearch] = useState<string>('');
  const [assignError, setAssignError] = useState<string>('');
  const [returnError, setReturnError] = useState<string>('');

  const asset = assets.find(a => a.id === id);
  const assetHistory = history.filter(h => h.assetId === id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  if (!asset) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Актив не найден</h2>
        <button onClick={() => navigate('/assets')} className="mt-4 text-indigo-600 hover:text-indigo-900">
          Вернуться к списку
        </button>
      </div>
    );
  }

  const owner = employees.find(e => e.id === asset.employeeId);
  const isAdmin = currentUser.role === 'ADMIN';
  
  const userEmployee = employees.find(e => `${e.firstName} ${e.lastName}` === currentUser.name.split(' (')[0]);
  const isOwner = userEmployee && userEmployee.id === asset.employeeId;

  if (currentUser.role === 'USER' && !isOwner) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Доступ запрещен</h2>
        <p className="mt-2 text-gray-500">У вас нет прав для просмотра этого актива.</p>
        <button onClick={() => navigate('/assets')} className="mt-4 text-indigo-600 hover:text-indigo-900">
          Вернуться к списку
        </button>
      </div>
    );
  }

  const handleAssign = () => {
    if (!selectedEmployee) {
      setAssignError('Пожалуйста, выберите сотрудника из списка');
      return;
    }
    assignAsset(asset.id, selectedEmployee, reason);
    setShowAssignModal(false);
    setReason('');
    setEmployeeSearch('');
    setAssignError('');
  };

  const handleReturn = () => {
    if (!reason && isAdmin) {
      setReturnError('Комментарий обязателен при возврате');
      return;
    }
    returnAsset(asset.id, reason);
    setShowReturnModal(false);
    setReason('');
    setReturnError('');
  };

  const handleChangeStatus = () => {
    changeStatus(asset.id, newStatus, reason);
    setShowStatusModal(false);
    setReason('');
  };

  const handleDelete = () => {
    if (window.confirm('Вы уверены, что хотите удалить этот актив?')) {
      deleteAsset(asset.id);
      navigate('/assets');
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/assets')} className="p-2 rounded-full hover:bg-gray-200 text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Детали актива</h1>
        </div>
        
        {isAdmin && (
          <div className="flex space-x-2">
            {(asset.status === 'REGISTERED' || asset.status === 'WRITTEN_OFF') && (
              <button onClick={handleDelete} className="p-2 text-red-600 hover:bg-red-50 rounded-md">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{asset.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{asset.category} • {asset.type}</p>
              </div>
              <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${STATUS_COLORS[asset.status]}`}>
                {STATUS_LABELS[asset.status]}
              </span>
            </div>
            
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Инвентарный номер</h3>
                <p className="mt-1 text-sm text-gray-900 font-mono">{asset.inventoryNumber}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Серийный номер</h3>
                <p className="mt-1 text-sm text-gray-900 font-mono">{asset.serialNumber}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Дата добавления</h3>
                <p className="mt-1 text-sm text-gray-900">{new Date(asset.dateAdded).toLocaleDateString('ru-RU')}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Текущий владелец</h3>
                <p className="mt-1 text-sm text-gray-900">{owner ? `${owner.firstName} ${owner.lastName}` : 'Нет'}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-6 py-4 flex flex-wrap gap-3">
              {isAdmin && (asset.status === 'REGISTERED' || asset.status === 'IN_REPAIR') && (
                <button onClick={() => setShowAssignModal(true)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Выдать
                </button>
              )}
              
              {(isAdmin || isOwner) && asset.status === 'ASSIGNED' && (
                <button onClick={() => setShowReturnModal(true)} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                  <ArrowDownLeft className="w-4 h-4 mr-2" />
                  Вернуть на склад
                </button>
              )}
              
              {isAdmin && asset.status !== 'WRITTEN_OFF' && asset.status !== 'LOST' && (
                <button onClick={() => setShowStatusModal(true)} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Изменить статус
                </button>
              )}
              
              {isAdmin && (
                <button onClick={() => window.print()} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                  <Printer className="w-4 h-4 mr-2" />
                  Печать QR
                </button>
              )}
              
              {isOwner && asset.status === 'ASSIGNED' && (
                <button onClick={() => { setNewStatus('IN_REPAIR'); setShowStatusModal(true); }} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Сообщить о поломке
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-medium text-gray-900">История изменений</h3>
            </div>
            <div className="p-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {assetHistory.map((event, eventIdx) => {
                    const eventUser = users.find(u => u.id === event.userId);
                    return (
                      <li key={event.id}>
                        <div className="relative pb-8">
                          {eventIdx !== assetHistory.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                                <span className="text-xs font-medium text-gray-500">{eventUser?.name.charAt(0)}</span>
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">
                                  {event.action} <span className="font-medium text-gray-900">{eventUser?.name}</span>
                                </p>
                                {event.oldStatus && event.newStatus && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {STATUS_LABELS[event.oldStatus]} &rarr; {STATUS_LABELS[event.newStatus]}
                                  </p>
                                )}
                                {event.reason && (
                                  <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded-md border border-gray-100">
                                    "{event.reason}"
                                  </p>
                                )}
                              </div>
                              <div className="text-right text-xs whitespace-nowrap text-gray-500">
                                <time dateTime={event.timestamp}>{new Date(event.timestamp).toLocaleString('ru-RU')}</time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">QR-код актива</h3>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <QRCodeSVG value={asset.id} size={200} level="H" includeMargin={true} />
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              Отсканируйте код для быстрого доступа к карточке
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowAssignModal(false)}></div>
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
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
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
                <button type="button" onClick={() => { setShowAssignModal(false); setAssignError(''); }} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowReturnModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Возврат актива</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Оценка состояния / Причина возврата {isAdmin && <span className="text-red-500">*</span>}</label>
                    <textarea value={reason} onChange={(e) => { setReason(e.target.value); setReturnError(''); }} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Опишите состояние актива при возврате" />
                  </div>
                  {returnError && (
                    <p className="text-sm text-red-600 font-medium">{returnError}</p>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button type="button" onClick={handleReturn} disabled={isAdmin && !reason} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                  Вернуть
                </button>
                <button type="button" onClick={() => { setShowReturnModal(false); setReturnError(''); }} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowStatusModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Изменение статуса</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Новый статус</label>
                    <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as AssetStatus)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Причина / Комментарий</label>
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button type="button" onClick={handleChangeStatus} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm">
                  Сохранить
                </button>
                <button type="button" onClick={() => setShowStatusModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print View */}
      <div className="hidden print:flex fixed inset-0 bg-white z-[100] flex-col items-center justify-center">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">{asset.name}</h1>
          <p className="text-2xl text-gray-600">INV: {asset.inventoryNumber}</p>
          <p className="text-xl text-gray-500 mt-2">SN: {asset.serialNumber}</p>
        </div>
        <QRCodeSVG value={asset.id} size={400} level="H" includeMargin={true} />
        <p className="mt-8 text-gray-400 text-sm">Smart Office Asset Manager</p>
      </div>
    </div>
  );
};
