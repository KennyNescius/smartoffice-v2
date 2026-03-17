import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Asset, AssetHistory, AssetStatus, Department, Employee, Settings, User } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface StoreState {
  assets: Asset[];
  history: AssetHistory[];
  users: User[];
  departments: Department[];
  employees: Employee[];
  currentUser: User;
  settings: Settings;
  loading: boolean;
}

interface StoreContextType extends StoreState {
  addAsset: (asset: Omit<Asset, 'id' | 'status' | 'dateAdded'>) => Promise<void>;
  updateAsset: (id: string, updates: Partial<Asset>, reason?: string) => Promise<void>;
  changeStatus: (id: string, newStatus: AssetStatus, reason?: string, newExpirationDate?: string) => Promise<void>;
  assignAsset: (id: string, employeeId: string, reason?: string) => Promise<void>;
  returnAsset: (id: string, reason: string) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  addDepartment: (name: string) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  addEmployee: (employee: Omit<Employee, 'id' | 'isActive'> & { email?: string; password?: string; role?: string }) => Promise<void>;
  deactivateEmployee: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  refreshData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser } = useAuth();

  const fallbackUser: User = {
    id: authUser?.id || 'u1',
    name: authUser?.name || 'Unknown',
    role: (authUser?.role as User['role']) || 'USER',
    department: authUser?.department,
  };

  const [state, setState] = useState<StoreState>({
    assets: [],
    history: [],
    users: [],
    departments: [],
    employees: [],
    currentUser: fallbackUser,
    settings: { maintenanceExtensionMonths: 6 },
    loading: true,
  });

  const refreshData = useCallback(async () => {
    try {
      const [assets, employees, departments, users, history, settings] = await Promise.all([
        api.getAssets(),
        api.getEmployees(),
        api.getDepartments(),
        api.getUsers(),
        api.getHistory(),
        api.getSettings(),
      ]);

      setState(prev => ({
        ...prev,
        assets,
        employees,
        departments,
        users,
        history,
        settings,
        currentUser: users.find((u: User) => u.id === authUser?.id) || prev.currentUser,
        loading: false,
      }));
    } catch (err) {
      console.error('Failed to load data from server:', err);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [authUser?.id]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addAsset = async (assetData: Omit<Asset, 'id' | 'status' | 'dateAdded'>) => {
    const created = await api.createAsset(assetData);
    await api.createHistory({
      assetId: created.id,
      newStatus: 'REGISTERED',
      action: 'Создан актив',
    });
    await refreshData();
  };

  const updateAsset = async (id: string, updates: Partial<Asset>, reason?: string) => {
    await api.updateAsset(id, updates);
    if (reason) {
      const asset = state.assets.find(a => a.id === id);
      await api.createHistory({
        assetId: id,
        oldStatus: asset?.status,
        newStatus: asset?.status,
        reason,
        action: 'Обновлены данные',
      });
    }
    await refreshData();
  };

  const changeStatus = async (id: string, newStatus: AssetStatus, reason?: string, newExpirationDate?: string) => {
    await api.changeStatus(id, { newStatus, reason, newExpirationDate });
    await refreshData();
  };

  const assignAsset = async (id: string, employeeId: string, reason?: string) => {
    await api.assignAsset(id, { employeeId, reason });
    await refreshData();
  };

  const returnAsset = async (id: string, reason: string) => {
    await api.returnAsset(id, { reason });
    await refreshData();
  };

  const deleteAsset = async (id: string) => {
    try {
      await api.deleteAsset(id);
      await refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const addDepartment = async (name: string) => {
    await api.createDepartment(name);
    await refreshData();
  };

  const deleteDepartment = async (id: string) => {
    try {
      await api.deleteDepartment(id);
      await refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'isActive'> & { email?: string; password?: string; role?: string }) => {
    await api.createEmployee(employeeData);
    await refreshData();
  };

  const deactivateEmployee = async (id: string) => {
    try {
      await api.deactivateEmployee(id);
      await refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    await api.updateSettings(newSettings as { maintenanceExtensionMonths: number });
    await refreshData();
  };

  return (
    <StoreContext.Provider
      value={{
        ...state,
        addAsset,
        updateAsset,
        changeStatus,
        assignAsset,
        returnAsset,
        deleteAsset,
        addDepartment,
        deleteDepartment,
        addEmployee,
        deactivateEmployee,
        updateSettings,
        refreshData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
