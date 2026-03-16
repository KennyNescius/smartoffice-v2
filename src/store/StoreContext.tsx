import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Asset, AssetHistory, AssetStatus, Department, Employee, Role, Settings, User } from '../types';

interface StoreState {
  assets: Asset[];
  history: AssetHistory[];
  users: User[];
  departments: Department[];
  employees: Employee[];
  currentUser: User;
  settings: Settings;
}

interface StoreContextType extends StoreState {
  addAsset: (asset: Omit<Asset, 'id' | 'status' | 'dateAdded'>) => void;
  updateAsset: (id: string, updates: Partial<Asset>, reason?: string) => void;
  changeStatus: (id: string, newStatus: AssetStatus, reason?: string, newExpirationDate?: string) => void;
  assignAsset: (id: string, employeeId: string, reason?: string) => void;
  returnAsset: (id: string, reason: string) => void;
  deleteAsset: (id: string) => void;
  setCurrentUser: (userId: string) => void;
  addDepartment: (name: string) => void;
  deleteDepartment: (id: string) => void;
  addEmployee: (employee: Omit<Employee, 'id' | 'isActive'>) => void;
  deactivateEmployee: (id: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const initialUsers: User[] = [
  { id: 'u1', name: 'Иван Иванов (Админ)', role: 'ADMIN', department: 'IT' },
  { id: 'u2', name: 'Петр Петров (Сотрудник)', role: 'USER', department: 'Sales' },
  { id: 'u3', name: 'Анна Смирнова (Аудитор)', role: 'AUDITOR', department: 'Finance' },
  { id: 'u4', name: 'Елена Сидорова (Сотрудник)', role: 'USER', department: 'HR' },
];

const initialDepartments: Department[] = [
  { id: 'd1', name: 'IT' },
  { id: 'd2', name: 'Sales' },
  { id: 'd3', name: 'Finance' },
  { id: 'd4', name: 'HR' },
];

const initialEmployees: Employee[] = [
  { id: 'e1', firstName: 'Иван', lastName: 'Иванов', position: 'Системный администратор', departmentId: 'd1', isActive: true },
  { id: 'e2', firstName: 'Петр', lastName: 'Петров', position: 'Менеджер по продажам', departmentId: 'd2', isActive: true },
  { id: 'e3', firstName: 'Анна', lastName: 'Смирнова', position: 'Бухгалтер', departmentId: 'd3', isActive: true },
  { id: 'e4', firstName: 'Елена', lastName: 'Сидорова', position: 'HR специалист', departmentId: 'd4', isActive: true },
];

const initialAssets: Asset[] = [
  {
    id: 'a1',
    name: 'MacBook Pro 16"',
    type: 'Ноутбук',
    category: 'IT',
    serialNumber: 'C02X123456',
    inventoryNumber: 'INV-1001',
    dateAdded: new Date().toISOString(),
    status: 'ASSIGNED',
    employeeId: 'e2',
  },
  {
    id: 'a2',
    name: 'Принтер HP LaserJet',
    type: 'Оргтехника',
    category: 'Office',
    serialNumber: 'HP987654',
    inventoryNumber: 'INV-1002',
    dateAdded: new Date().toISOString(),
    status: 'REGISTERED',
  },
];

const initialHistory: AssetHistory[] = [
  {
    id: 'h1',
    assetId: 'a1',
    timestamp: new Date().toISOString(),
    userId: 'u1',
    newStatus: 'REGISTERED',
    action: 'Создан актив',
  },
  {
    id: 'h2',
    assetId: 'a1',
    timestamp: new Date().toISOString(),
    userId: 'u1',
    oldStatus: 'REGISTERED',
    newStatus: 'ASSIGNED',
    reason: 'Выдача новому сотруднику',
    action: 'Изменен статус',
  },
];

const initialSettings: Settings = {
  maintenanceExtensionMonths: 6,
};

const calculateExpirationDate = (startDate: string, months: number): string => {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<StoreState>(() => {
    const saved = localStorage.getItem('smart_office_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          assets: parsed.assets || initialAssets,
          history: parsed.history || initialHistory,
          users: parsed.users || initialUsers,
          departments: parsed.departments || initialDepartments,
          employees: parsed.employees || initialEmployees,
          currentUser: parsed.currentUser || initialUsers[0],
          settings: parsed.settings || initialSettings,
        };
      } catch (e) {
        console.error('Failed to parse state from localStorage', e);
      }
    }
    return {
      assets: initialAssets,
      history: initialHistory,
      users: initialUsers,
      departments: initialDepartments,
      employees: initialEmployees,
      currentUser: initialUsers[0],
      settings: initialSettings,
    };
  });

  useEffect(() => {
    localStorage.setItem('smart_office_state', JSON.stringify(state));
  }, [state]);

  const logAction = (
    assetId: string, 
    action: string, 
    newStatus: AssetStatus, 
    oldStatus?: AssetStatus, 
    reason?: string,
    oldExpirationDate?: string,
    newExpirationDate?: string
  ) => {
    const log: AssetHistory = {
      id: uuidv4(),
      assetId,
      timestamp: new Date().toISOString(),
      userId: state.currentUser.id,
      oldStatus,
      newStatus,
      reason,
      action,
      oldExpirationDate,
      newExpirationDate,
    };
    setState((prev) => ({ ...prev, history: [log, ...prev.history] }));
  };

  const addAsset = (assetData: Omit<Asset, 'id' | 'status' | 'dateAdded'>) => {
    const newAsset: Asset = {
      ...assetData,
      id: uuidv4(),
      status: 'REGISTERED',
      dateAdded: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, assets: [newAsset, ...prev.assets] }));
    logAction(newAsset.id, 'Создан актив', 'REGISTERED');
  };

  const updateAsset = (id: string, updates: Partial<Asset>, reason?: string) => {
    setState((prev) => {
      const asset = prev.assets.find((a) => a.id === id);
      if (!asset) return prev;
      
      const newAssets = prev.assets.map((a) => (a.id === id ? { ...a, ...updates } : a));
      return { ...prev, assets: newAssets };
    });
    const asset = state.assets.find((a) => a.id === id);
    if (asset) {
      logAction(id, 'Обновлены данные', asset.status, asset.status, reason);
    }
  };

  const changeStatus = (id: string, newStatus: AssetStatus, reason?: string, newExpirationDate?: string) => {
    setState((prev) => {
      const asset = prev.assets.find((a) => a.id === id);
      if (!asset) return prev;
      
      const oldStatus = asset.status;
      const isFirstAssignment = newStatus === 'ASSIGNED' && !asset.exploitationStartDate && oldStatus === 'REGISTERED';
      
      const exploitationStartDate = isFirstAssignment ? new Date().toISOString() : asset.exploitationStartDate;
      let expirationDate = newExpirationDate || asset.expirationDate;
      
      if (isFirstAssignment && asset.lifespanMonths && !newExpirationDate) {
        expirationDate = calculateExpirationDate(exploitationStartDate!, asset.lifespanMonths);
      }

      const newAssets = prev.assets.map((a) => (a.id === id ? { ...a, status: newStatus, exploitationStartDate, expirationDate } : a));
      
      setTimeout(() => logAction(
        id, 
        'Изменен статус', 
        newStatus, 
        oldStatus, 
        reason,
        asset.expirationDate,
        expirationDate
      ), 0);
      
      return { ...prev, assets: newAssets };
    });
  };

  const assignAsset = (id: string, employeeId: string, reason?: string) => {
    setState((prev) => {
      const asset = prev.assets.find((a) => a.id === id);
      if (!asset) return prev;
      
      const oldStatus = asset.status;
      const isFirstAssignment = !asset.exploitationStartDate && oldStatus === 'REGISTERED';
      
      const exploitationStartDate = isFirstAssignment ? new Date().toISOString() : asset.exploitationStartDate;
      let expirationDate = asset.expirationDate;
      
      if (isFirstAssignment && asset.lifespanMonths) {
        expirationDate = calculateExpirationDate(exploitationStartDate!, asset.lifespanMonths);
      }

      const newAssets = prev.assets.map((a) => (a.id === id ? { ...a, status: 'ASSIGNED', employeeId, exploitationStartDate, expirationDate } : a));
      
      setTimeout(() => logAction(id, 'Назначен владелец', 'ASSIGNED', oldStatus, reason), 0);
      
      return { ...prev, assets: newAssets };
    });
  };

  const returnAsset = (id: string, reason: string) => {
    setState((prev) => {
      const asset = prev.assets.find((a) => a.id === id);
      if (!asset) return prev;
      
      const oldStatus = asset.status;
      const newAssets = prev.assets.map((a) => (a.id === id ? { ...a, status: 'REGISTERED', employeeId: null } : a));
      
      setTimeout(() => logAction(id, 'Возврат актива', 'REGISTERED', oldStatus, reason), 0);
      
      return { ...prev, assets: newAssets };
    });
  };

  const deleteAsset = (id: string) => {
    setState((prev) => {
      const asset = prev.assets.find((a) => a.id === id);
      if (!asset) return prev;
      
      if (asset.status !== 'REGISTERED' && asset.status !== 'WRITTEN_OFF') {
        alert('Удалить можно только активы со статусом REGISTERED или WRITTEN_OFF');
        return prev;
      }
      
      return { ...prev, assets: prev.assets.filter((a) => a.id !== id) };
    });
  };

  const setCurrentUser = (userId: string) => {
    setState((prev) => {
      const user = prev.users.find((u) => u.id === userId);
      if (!user) return prev;
      return { ...prev, currentUser: user };
    });
  };

  const addDepartment = (name: string) => {
    setState((prev) => ({
      ...prev,
      departments: [...prev.departments, { id: uuidv4(), name }],
    }));
  };

  const deleteDepartment = (id: string) => {
    setState((prev) => {
      const hasEmployees = prev.employees.some((e) => e.departmentId === id);
      if (hasEmployees) {
        alert('Нельзя удалить департамент, к которому привязаны сотрудники.');
        return prev;
      }
      return {
        ...prev,
        departments: prev.departments.filter((d) => d.id !== id),
      };
    });
  };

  const addEmployee = (employeeData: Omit<Employee, 'id' | 'isActive'>) => {
    setState((prev) => ({
      ...prev,
      employees: [...prev.employees, { ...employeeData, id: uuidv4(), isActive: true }],
    }));
  };

  const deactivateEmployee = (id: string) => {
    setState((prev) => {
      const hasActiveAssets = prev.assets.some((a) => a.employeeId === id && a.status === 'ASSIGNED');
      if (hasActiveAssets) {
        alert('Нельзя деактивировать сотрудника, за которым числятся активы.');
        return prev;
      }
      return {
        ...prev,
        employees: prev.employees.map((e) => (e.id === id ? { ...e, isActive: false } : e)),
      };
    });
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
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
        setCurrentUser,
        addDepartment,
        deleteDepartment,
        addEmployee,
        deactivateEmployee,
        updateSettings,
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
