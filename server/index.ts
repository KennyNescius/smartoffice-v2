import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import db, { initializeDatabase, seedDatabase } from './db';

const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);

const app = express();
const PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'smartoffice-dev-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname2, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer config for photo uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Допустимые форматы: JPG, PNG, WebP'));
    }
  },
});

app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(UPLOADS_DIR));

// Initialize DB on start
initializeDatabase();
seedDatabase();

// ==================== AUTH TYPES & HELPERS ====================

interface AuthUser {
  id: string;
  role: string;
  name: string;
  employeeId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function generateAccessToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET + '-refresh', { expiresIn: REFRESH_TOKEN_EXPIRY });
}

function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Требуется авторизация' });
    return;
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Недействительный токен' });
  }
}

// Whitelist of fields allowed for asset updates
const ALLOWED_ASSET_FIELDS = [
  'name', 'type', 'category', 'serialNumber', 'inventoryNumber',
  'photoUrl', 'purchaseDate', 'lifespanMonths', 'expirationDate',
  'status', 'employeeId', 'exploitationStartDate'
];

// ==================== AUTH ROUTES (public) ====================

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!user) {
    return res.status(401).json({ error: 'Неверный email или пароль' });
  }

  if (!bcryptjs.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Неверный email или пароль' });
  }

  // Check if linked employee is active
  if (user.employeeId) {
    const employee = db.prepare('SELECT isActive FROM employees WHERE id = ?').get(user.employeeId) as any;
    if (employee && !employee.isActive) {
      return res.status(403).json({ error: 'Ваш аккаунт деактивирован. Обратитесь к администратору.' });
    }
  }

  const authUser: AuthUser = { id: user.id, role: user.role, name: user.name, employeeId: user.employeeId };
  const accessToken = generateAccessToken(authUser);
  const refreshToken = generateRefreshToken(authUser);

  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, role: user.role, department: user.department, employeeId: user.employeeId },
  });
});

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token обязателен' });
  }

  try {
    const user = jwt.verify(refreshToken, JWT_SECRET + '-refresh') as AuthUser;

    // Check if linked employee is still active
    if (user.employeeId) {
      const employee = db.prepare('SELECT isActive FROM employees WHERE id = ?').get(user.employeeId) as any;
      if (employee && !employee.isActive) {
        return res.status(403).json({ error: 'Ваш аккаунт деактивирован' });
      }
    }

    const newAccessToken = generateAccessToken({ id: user.id, role: user.role, name: user.name, employeeId: user.employeeId });
    res.json({ accessToken: newAccessToken });
  } catch {
    res.status(401).json({ error: 'Недействительный refresh token' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, username, name, role, department, employeeId FROM users WHERE id = ?').get(req.user!.id) as any;
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  res.json(user);
});

// ==================== ALL ROUTES BELOW REQUIRE AUTH ====================

app.use('/api', authenticateToken);

// ==================== FILE UPLOAD ====================

app.post('/api/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }
  const photoUrl = `/uploads/${req.file.filename}`;
  res.json({ photoUrl });
});

// ==================== DEPARTMENTS ====================

app.get('/api/departments', (_req, res) => {
  const departments = db.prepare('SELECT * FROM departments').all();
  res.json(departments);
});

app.post('/api/departments', (req, res) => {
  const { name } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO departments (id, name) VALUES (?, ?)').run(id, name);
  res.json({ id, name });
});

app.delete('/api/departments/:id', (req, res) => {
  const { id } = req.params;
  const hasEmployees = db.prepare('SELECT COUNT(*) as count FROM employees WHERE departmentId = ?').get(id) as { count: number };
  if (hasEmployees.count > 0) {
    return res.status(400).json({ error: 'Нельзя удалить департамент, к которому привязаны сотрудники.' });
  }
  db.prepare('DELETE FROM departments WHERE id = ?').run(id);
  res.sendStatus(204);
});

// ==================== EMPLOYEES ====================

app.get('/api/employees', (_req, res) => {
  const employees = db.prepare(`
    SELECT e.*, d.name as departmentName
    FROM employees e
    LEFT JOIN departments d ON e.departmentId = d.id
  `).all();
  const result = (employees as any[]).map(e => ({ ...e, isActive: !!e.isActive }));
  res.json(result);
});

app.post('/api/employees', (req, res) => {
  const { firstName, lastName, position, departmentId, email, password, role } = req.body;
  const employeeId = uuidv4();

  db.prepare('INSERT INTO employees (id, firstName, lastName, position, departmentId, isActive) VALUES (?, ?, ?, ?, ?, 1)')
    .run(employeeId, firstName, lastName, position, departmentId);

  // Create user account if email and password provided
  let userId: string | null = null;
  if (email && password) {
    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
    }

    userId = uuidv4();
    const passwordHash = bcryptjs.hashSync(password, 10);
    const dept = db.prepare('SELECT name FROM departments WHERE id = ?').get(departmentId) as any;
    const userRole = role || 'USER';
    const name = `${firstName} ${lastName}`;

    db.prepare('INSERT INTO users (id, username, password_hash, name, role, department, employeeId) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(userId, email, passwordHash, name, userRole, dept?.name || null, employeeId);
  }

  res.json({ id: employeeId, firstName, lastName, position, departmentId, isActive: true, userId });
});

app.put('/api/employees/:id/deactivate', (req, res) => {
  const { id } = req.params;
  const hasAssets = db.prepare("SELECT COUNT(*) as count FROM assets WHERE employeeId = ? AND status = 'ASSIGNED'").get(id) as { count: number };
  if (hasAssets.count > 0) {
    return res.status(400).json({ error: 'Нельзя деактивировать сотрудника, за которым числятся активы.' });
  }
  db.prepare('UPDATE employees SET isActive = 0 WHERE id = ?').run(id);
  res.sendStatus(204);
});

// ==================== ASSETS ====================

app.get('/api/assets', (_req, res) => {
  const assets = db.prepare(`
    SELECT a.*,
           e.firstName as employeeFirstName,
           e.lastName as employeeLastName
    FROM assets a
    LEFT JOIN employees e ON a.employeeId = e.id
  `).all();
  res.json(assets);
});

app.get('/api/assets/:id', (req, res) => {
  const { id } = req.params;
  const asset = db.prepare(`
    SELECT a.*,
           e.firstName as employeeFirstName,
           e.lastName as employeeLastName
    FROM assets a
    LEFT JOIN employees e ON a.employeeId = e.id
    WHERE a.id = ?
  `).get(id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });
  res.json(asset);
});

app.post('/api/assets', (req, res) => {
  const { name, type, category, serialNumber, inventoryNumber, photoUrl, purchaseDate, lifespanMonths } = req.body;
  const id = uuidv4();
  const dateAdded = new Date().toISOString();

  db.prepare(`
    INSERT INTO assets (id, name, type, category, serialNumber, inventoryNumber, dateAdded, status, photoUrl, purchaseDate, lifespanMonths)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'REGISTERED', ?, ?, ?)
  `).run(id, name, type, category, serialNumber, inventoryNumber, dateAdded, photoUrl || null, purchaseDate || null, lifespanMonths || null);

  res.json({ id, name, type, category, serialNumber, inventoryNumber, dateAdded, status: 'REGISTERED', photoUrl: photoUrl || null });
});

app.put('/api/assets/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const safeKeys = Object.keys(updates).filter(k => ALLOWED_ASSET_FIELDS.includes(k));
    if (safeKeys.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    const fields = safeKeys.map(k => `${k} = ?`).join(', ');
    const values = safeKeys.map(k => updates[k]);

    db.prepare(`UPDATE assets SET ${fields} WHERE id = ?`).run(...values, id);

    const updated = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    console.error('Error updating asset:', err);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

app.post('/api/assets/:id/photo', upload.single('photo'), (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }
  const photoUrl = `/uploads/${req.file.filename}`;
  db.prepare('UPDATE assets SET photoUrl = ? WHERE id = ?').run(photoUrl, id);
  const updated = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
  res.json(updated);
});

app.delete('/api/assets/:id', (req, res) => {
  const { id } = req.params;
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(id) as any;
  if (!asset) return res.status(404).json({ error: 'Asset not found' });
  if (asset.status !== 'REGISTERED' && asset.status !== 'WRITTEN_OFF') {
    return res.status(400).json({ error: 'Удалить можно только активы со статусом REGISTERED или WRITTEN_OFF' });
  }
  db.prepare('DELETE FROM assets WHERE id = ?').run(id);
  res.sendStatus(204);
});

// Change status
app.put('/api/assets/:id/status', (req, res) => {
  const { id } = req.params;
  const { newStatus, reason, newExpirationDate } = req.body;
  const userId = req.user!.id;
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(id) as any;
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  const oldStatus = asset.status;
  const isFirstAssignment = newStatus === 'ASSIGNED' && !asset.exploitationStartDate && oldStatus === 'REGISTERED';

  let exploitationStartDate = asset.exploitationStartDate;
  let expirationDate = newExpirationDate || asset.expirationDate;

  if (isFirstAssignment) {
    exploitationStartDate = new Date().toISOString();
    if (asset.lifespanMonths && !newExpirationDate) {
      const d = new Date(exploitationStartDate);
      d.setMonth(d.getMonth() + asset.lifespanMonths);
      expirationDate = d.toISOString();
    }
  }

  db.prepare('UPDATE assets SET status = ?, exploitationStartDate = ?, expirationDate = ? WHERE id = ?')
    .run(newStatus, exploitationStartDate, expirationDate, id);

  const histId = uuidv4();
  db.prepare('INSERT INTO asset_history (id, assetId, timestamp, userId, oldStatus, newStatus, reason, action, oldExpirationDate, newExpirationDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(histId, id, new Date().toISOString(), userId, oldStatus, newStatus, reason || null, 'Изменен статус', asset.expirationDate || null, expirationDate || null);

  const updated = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
  res.json(updated);
});

// Assign asset to employee
app.put('/api/assets/:id/assign', (req, res) => {
  const { id } = req.params;
  const { employeeId, reason } = req.body;
  const userId = req.user!.id;
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(id) as any;
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  const oldStatus = asset.status;
  const isFirstAssignment = !asset.exploitationStartDate && oldStatus === 'REGISTERED';

  let exploitationStartDate = asset.exploitationStartDate;
  let expirationDate = asset.expirationDate;

  if (isFirstAssignment) {
    exploitationStartDate = new Date().toISOString();
    if (asset.lifespanMonths) {
      const d = new Date(exploitationStartDate);
      d.setMonth(d.getMonth() + asset.lifespanMonths);
      expirationDate = d.toISOString();
    }
  }

  db.prepare('UPDATE assets SET status = ?, employeeId = ?, exploitationStartDate = ?, expirationDate = ? WHERE id = ?')
    .run('ASSIGNED', employeeId, exploitationStartDate, expirationDate, id);

  const histId = uuidv4();
  db.prepare('INSERT INTO asset_history (id, assetId, timestamp, userId, oldStatus, newStatus, reason, action) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(histId, id, new Date().toISOString(), userId, oldStatus, 'ASSIGNED', reason || null, 'Назначен владелец');

  const updated = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
  res.json(updated);
});

// Return asset
app.put('/api/assets/:id/return', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user!.id;
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(id) as any;
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  const oldStatus = asset.status;
  db.prepare("UPDATE assets SET status = 'REGISTERED', employeeId = NULL WHERE id = ?").run(id);

  const histId = uuidv4();
  db.prepare('INSERT INTO asset_history (id, assetId, timestamp, userId, oldStatus, newStatus, reason, action) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(histId, id, new Date().toISOString(), userId, oldStatus, 'REGISTERED', reason, 'Возврат актива');

  const updated = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
  res.json(updated);
});

// ==================== HISTORY ====================

app.get('/api/history', (_req, res) => {
  const history = db.prepare('SELECT * FROM asset_history ORDER BY timestamp DESC').all();
  res.json(history);
});

app.get('/api/history/:assetId', (req, res) => {
  const { assetId } = req.params;
  const history = db.prepare('SELECT * FROM asset_history WHERE assetId = ? ORDER BY timestamp DESC').all(assetId);
  res.json(history);
});

app.post('/api/history', (req, res) => {
  const { assetId, employeeId, oldStatus, newStatus, reason, action, oldExpirationDate, newExpirationDate } = req.body;
  const userId = req.user!.id;
  const id = uuidv4();
  const timestamp = new Date().toISOString();
  db.prepare('INSERT INTO asset_history (id, assetId, timestamp, userId, employeeId, oldStatus, newStatus, reason, action, oldExpirationDate, newExpirationDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, assetId, timestamp, userId, employeeId || null, oldStatus || null, newStatus, reason || null, action, oldExpirationDate || null, newExpirationDate || null);
  res.json({ id, assetId, timestamp, userId, employeeId, oldStatus, newStatus, reason, action, oldExpirationDate, newExpirationDate });
});

// ==================== USERS ====================

app.get('/api/users', (_req, res) => {
  const users = db.prepare('SELECT id, name, role, department, employeeId FROM users').all();
  res.json(users);
});

// ==================== SETTINGS ====================

app.get('/api/settings', (_req, res) => {
  let settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  if (!settings) {
    db.prepare('INSERT INTO settings (id, maintenanceExtensionMonths) VALUES (1, 6)').run();
    settings = { id: 1, maintenanceExtensionMonths: 6 };
  }
  res.json(settings);
});

app.put('/api/settings', (req, res) => {
  const { maintenanceExtensionMonths } = req.body;
  db.prepare('UPDATE settings SET maintenanceExtensionMonths = ? WHERE id = 1').run(maintenanceExtensionMonths);
  res.json({ id: 1, maintenanceExtensionMonths });
});

// ==================== ERROR HANDLER ====================

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Файл слишком большой (макс. 5МБ)' });
    }
  }
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`SmartOffice API running at http://localhost:${PORT}`);
});
