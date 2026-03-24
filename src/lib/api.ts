import { Asset, Employee, Department, User, AssetHistory, Settings } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('accessToken');
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });

  // If 401, try to refresh the token
  if (res.status === 401 && !path.startsWith('/auth/')) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        localStorage.setItem('accessToken', data.accessToken);
        headers['Authorization'] = `Bearer ${data.accessToken}`;

        res = await fetch(`${API_URL}${path}`, {
          ...options,
          headers: { ...headers, ...options?.headers },
        });
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    } else {
      window.location.href = '/login';
      throw new Error('Not authenticated');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

async function uploadFile(path: string, file: File): Promise<any> {
  const token = getToken();
  const formData = new FormData();
  formData.append('photo', file);

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Don't set Content-Type - browser will set it with boundary for multipart

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Upload failed');
  }
  return res.json();
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ accessToken: string; refreshToken: string; user: User & { employeeId?: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  getMe: () => request<User & { employeeId?: string }>('/auth/me'),

  // Upload
  uploadPhoto: (file: File) => uploadFile('/upload', file) as Promise<{ photoUrl: string }>,
  uploadAssetPhoto: (assetId: string, file: File) => uploadFile(`/assets/${assetId}/photo`, file) as Promise<Asset>,

  // Departments
  getDepartments: () => request<Department[]>('/departments'),
  createDepartment: (name: string) => request<Department>('/departments', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteDepartment: (id: string) => request<void>(`/departments/${id}`, { method: 'DELETE' }),

  // Employees
  getEmployees: () => request<(Employee & { departmentName?: string })[]>('/employees'),
  createEmployee: (data: { firstName: string; lastName: string; position: string; departmentId: string; email?: string; password?: string; role?: string }) =>
    request<Employee>('/employees', { method: 'POST', body: JSON.stringify(data) }),
  deactivateEmployee: (id: string) => request<void>(`/employees/${id}/deactivate`, { method: 'PUT' }),

  // Assets
  getAssets: () => request<(Asset & { employeeFirstName?: string; employeeLastName?: string })[]>('/assets'),
  getAsset: (id: string) => request<Asset & { employeeFirstName?: string; employeeLastName?: string }>(`/assets/${id}`),
  createAsset: (data: Omit<Asset, 'id' | 'status' | 'dateAdded'>) => request<Asset>('/assets', { method: 'POST', body: JSON.stringify(data) }),
  updateAsset: (id: string, data: Partial<Asset>) => request<Asset>(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAsset: (id: string) => request<void>(`/assets/${id}`, { method: 'DELETE' }),
  changeStatus: (id: string, data: { newStatus: string; reason?: string; newExpirationDate?: string }) =>
    request<Asset>(`/assets/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  assignAsset: (id: string, data: { employeeId: string; reason?: string }) =>
    request<Asset>(`/assets/${id}/assign`, { method: 'PUT', body: JSON.stringify(data) }),
  returnAsset: (id: string, data: { reason: string }) =>
    request<Asset>(`/assets/${id}/return`, { method: 'PUT', body: JSON.stringify(data) }),

  // History
  getHistory: () => request<AssetHistory[]>('/history'),
  getAssetHistory: (assetId: string) => request<AssetHistory[]>(`/history/${assetId}`),
  createHistory: (data: Partial<AssetHistory>) => request<AssetHistory>('/history', { method: 'POST', body: JSON.stringify(data) }),

  // Users
  getUsers: () => request<User[]>('/users'),

  // Settings
  getSettings: () => request<Settings>('/settings'),
  updateSettings: (data: { maintenanceExtensionMonths: number }) =>
    request<Settings>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
};
