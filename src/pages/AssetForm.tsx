import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/StoreContext';
import { ArrowLeft, Save, Upload, X, Image } from 'lucide-react';
import { AssetCategory } from '../types';
import { api } from '../lib/api';
import { toast } from 'sonner';

export const AssetForm: React.FC = () => {
  const navigate = useNavigate();
  const { addAsset, currentUser } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    category: 'IT' as AssetCategory,
    serialNumber: '',
    inventoryNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    lifespanMonths: undefined as number | undefined,
    expirationDate: '',
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let photoUrl: string | undefined;

      // Upload photo first if selected
      if (photoFile) {
        const result = await api.uploadPhoto(photoFile);
        photoUrl = result.photoUrl;
      }

      await addAsset({ ...formData, photoUrl });
      toast.success('Актив создан');
      navigate('/assets');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка при создании актива');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      if ((name === 'purchaseDate' || name === 'lifespanMonths') && newData.lifespanMonths && !newData.expirationDate) {
        const date = new Date(newData.purchaseDate);
        date.setMonth(date.getMonth() + Number(newData.lifespanMonths));
        newData.expirationDate = date.toISOString().split('T')[0];
      }

      return newData;
    });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Файл слишком большой (макс. 5МБ)');
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Допустимые форматы: JPG, PNG, WebP');
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
                  type="text" name="name" id="name" required
                  value={formData.name} onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                  placeholder="Например: MacBook Pro 16"
                />
              </div>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">Тип</label>
              <div className="mt-1">
                <input
                  type="text" name="type" id="type" required
                  value={formData.type} onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                  placeholder="Например: Ноутбук"
                />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Категория</label>
              <div className="mt-1">
                <select
                  id="category" name="category"
                  value={formData.category} onChange={handleChange}
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
              <label htmlFor="inventoryNumber" className="block text-sm font-medium text-gray-700">Инвентарный номер</label>
              <div className="mt-1">
                <input
                  type="text" name="inventoryNumber" id="inventoryNumber" required
                  value={formData.inventoryNumber} onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border font-mono"
                  placeholder="INV-1001"
                />
              </div>
            </div>

            <div>
              <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700">Серийный номер</label>
              <div className="mt-1">
                <input
                  type="text" name="serialNumber" id="serialNumber" required
                  value={formData.serialNumber} onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border font-mono"
                  placeholder="SN12345678"
                />
              </div>
            </div>

            <div>
              <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700">Дата закупки</label>
              <div className="mt-1">
                <input
                  type="date" name="purchaseDate" id="purchaseDate" required
                  value={formData.purchaseDate} onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                />
              </div>
            </div>

            <div>
              <label htmlFor="lifespanMonths" className="block text-sm font-medium text-gray-700">Срок службы (мес.)</label>
              <div className="mt-1">
                <input
                  type="number" name="lifespanMonths" id="lifespanMonths" min="1"
                  value={formData.lifespanMonths || ''} onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                  placeholder="Например: 36"
                />
              </div>
            </div>

            <div>
              <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">Срок службы до</label>
              <div className="mt-1">
                <input
                  type="date" name="expirationDate" id="expirationDate"
                  min={formData.purchaseDate}
                  value={formData.expirationDate} onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                />
              </div>
            </div>

            {/* Photo Upload */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Image className="w-4 h-4 inline mr-1" />
                Фото актива
              </label>
              {photoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-40 w-auto rounded-lg border border-gray-200 shadow-sm object-cover"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Нажмите для загрузки фото</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP до 5МБ</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
                className="hidden"
              />
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
              disabled={isSubmitting}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
