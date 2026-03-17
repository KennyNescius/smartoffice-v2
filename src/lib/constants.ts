import { AssetStatus } from '../types';

export const STATUS_LABELS: Record<AssetStatus, string> = {
  REGISTERED: 'На складе',
  ASSIGNED: 'Выдан',
  IN_REPAIR: 'В ремонте',
  LOST: 'Утерян',
  WRITTEN_OFF: 'Списан',
};

export const STATUS_COLORS: Record<AssetStatus, string> = {
  REGISTERED: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-emerald-100 text-emerald-800',
  IN_REPAIR: 'bg-amber-100 text-amber-800',
  LOST: 'bg-red-100 text-red-800',
  WRITTEN_OFF: 'bg-gray-100 text-gray-800',
};

// Hex colors for charts (Dashboard)
export const STATUS_HEX_COLORS: Record<AssetStatus, string> = {
  REGISTERED: '#3b82f6',
  ASSIGNED: '#10b981',
  IN_REPAIR: '#f59e0b',
  LOST: '#ef4444',
  WRITTEN_OFF: '#6b7280',
};
