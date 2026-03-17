import Database from 'better-sqlite3';
import bcryptjs from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'dev.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      position TEXT NOT NULL,
      departmentId TEXT NOT NULL,
      isActive INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (departmentId) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      serialNumber TEXT NOT NULL,
      inventoryNumber TEXT NOT NULL,
      dateAdded TEXT NOT NULL DEFAULT (datetime('now')),
      status TEXT NOT NULL DEFAULT 'REGISTERED',
      employeeId TEXT,
      photoUrl TEXT,
      purchaseDate TEXT,
      expirationDate TEXT,
      lifespanMonths INTEGER,
      exploitationStartDate TEXT,
      FOREIGN KEY (employeeId) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS asset_history (
      id TEXT PRIMARY KEY,
      assetId TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      userId TEXT NOT NULL,
      employeeId TEXT,
      oldStatus TEXT,
      newStatus TEXT NOT NULL,
      reason TEXT,
      action TEXT NOT NULL,
      oldExpirationDate TEXT,
      newExpirationDate TEXT,
      FOREIGN KEY (assetId) REFERENCES assets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      employeeId TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      maintenanceExtensionMonths INTEGER NOT NULL DEFAULT 6
    );
  `);

  console.log('Database tables initialized.');
}

export function seedDatabase() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    console.log('Database already seeded, skipping.');
    return;
  }

  console.log('Seeding database...');

  const hash = (pwd: string) => bcryptjs.hashSync(pwd, 10);

  const insertDept = db.prepare('INSERT INTO departments (id, name) VALUES (?, ?)');
  const insertEmployee = db.prepare('INSERT INTO employees (id, firstName, lastName, position, departmentId, isActive) VALUES (?, ?, ?, ?, ?, ?)');
  const insertUser = db.prepare('INSERT INTO users (id, username, password_hash, name, role, department, employeeId) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertAsset = db.prepare('INSERT INTO assets (id, name, type, category, serialNumber, inventoryNumber, dateAdded, status, employeeId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertHistory = db.prepare('INSERT INTO asset_history (id, assetId, timestamp, userId, oldStatus, newStatus, reason, action) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const insertSettings = db.prepare('INSERT INTO settings (id, maintenanceExtensionMonths) VALUES (?, ?)');

  const seedAll = db.transaction(() => {
    // Departments
    insertDept.run('d1', 'IT');
    insertDept.run('d2', 'Sales');
    insertDept.run('d3', 'Finance');
    insertDept.run('d4', 'HR');

    // Employees
    insertEmployee.run('e1', 'Иван', 'Иванов', 'Системный администратор', 'd1', 1);
    insertEmployee.run('e2', 'Петр', 'Петров', 'Менеджер по продажам', 'd2', 1);
    insertEmployee.run('e3', 'Анна', 'Смирнова', 'Бухгалтер', 'd3', 1);
    insertEmployee.run('e4', 'Елена', 'Сидорова', 'HR специалист', 'd4', 1);

    // Users (login: email / password)
    // Иван — IT сотрудник — ADMIN
    insertUser.run('u1', 'ivan@company.com', hash('ivan123'), 'Иван Иванов', 'ADMIN', 'IT', 'e1');
    // Петр — Sales — USER
    insertUser.run('u2', 'petr@company.com', hash('petr123'), 'Петр Петров', 'USER', 'Sales', 'e2');
    // Анна — Finance — AUDITOR
    insertUser.run('u3', 'anna@company.com', hash('anna123'), 'Анна Смирнова', 'AUDITOR', 'Finance', 'e3');
    // Елена — HR — USER
    insertUser.run('u4', 'elena@company.com', hash('elena123'), 'Елена Сидорова', 'USER', 'HR', 'e4');

    // Assets
    const now = new Date().toISOString();
    insertAsset.run('a1', 'MacBook Pro 16"', 'Ноутбук', 'IT', 'C02X123456', 'INV-1001', now, 'ASSIGNED', 'e2');
    insertAsset.run('a2', 'Принтер HP LaserJet', 'Оргтехника', 'Office', 'HP987654', 'INV-1002', now, 'REGISTERED', null);

    // History
    insertHistory.run('h1', 'a1', now, 'u1', null, 'REGISTERED', null, 'Создан актив');
    insertHistory.run('h2', 'a1', now, 'u1', 'REGISTERED', 'ASSIGNED', 'Выдача новому сотруднику', 'Изменен статус');

    // Settings
    insertSettings.run(1, 6);
  });

  seedAll();
  console.log('Database seeded successfully.');
}

export default db;
