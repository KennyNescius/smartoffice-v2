export type Role = 'ADMIN' | 'USER' | 'AUDITOR';

export type AssetStatus = 'REGISTERED' | 'ASSIGNED' | 'IN_REPAIR' | 'LOST' | 'WRITTEN_OFF';

export type AssetCategory = 'IT' | 'Office' | 'Security' | 'Other';

export interface Department {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  departmentId: string;
  isActive: boolean;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  category: AssetCategory;
  serialNumber: string;
  inventoryNumber: string;
  dateAdded: string;
  status: AssetStatus;
  employeeId?: string | null;
  photoUrl?: string;
  purchaseDate?: string;
  expirationDate?: string;
  lifespanMonths?: number;
  exploitationStartDate?: string;
}

export interface AssetHistory {
  id: string;
  assetId: string;
  timestamp: string;
  userId: string; // The system user who performed the action
  employeeId?: string | null; // The employee involved in the action (e.g. assigned to)
  oldStatus?: AssetStatus;
  newStatus: AssetStatus;
  reason?: string;
  action: string;
  oldExpirationDate?: string;
  newExpirationDate?: string;
}

export interface Settings {
  maintenanceExtensionMonths: number;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  department?: string;
}
