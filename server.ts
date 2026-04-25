import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'rumah-inklusif-super-secret-key-123';
const DB_PATH = path.join(__dirname, 'data.db');

// Initialize SQLite Database
const db = new Database(DB_PATH);

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    uid TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    displayName TEXT,
    role TEXT DEFAULT 'user',
    businessLine TEXT,
    studentId TEXT,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parentName TEXT,
    phone TEXT,
    email TEXT,
    educationLevel TEXT,
    type TEXT,
    status TEXT DEFAULT 'active',
    joinedAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    studentId TEXT,
    teacherId TEXT,
    date TEXT,
    startTime TEXT,
    endTime TEXT,
    status TEXT DEFAULT 'scheduled',
    notes TEXT,
    FOREIGN KEY(studentId) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    studentId TEXT,
    amount REAL,
    date TEXT,
    type TEXT,
    status TEXT DEFAULT 'pending',
    proofUrl TEXT,
    FOREIGN KEY(studentId) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    studentId TEXT,
    teacherId TEXT,
    date TEXT,
    type TEXT,
    content TEXT,
    FOREIGN KEY(studentId) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT,
    authorId TEXT,
    authorName TEXT,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Try to add column if it doesn't exist (handle already existing cases)
try {
  db.exec("ALTER TABLE payments ADD COLUMN proofUrl TEXT");
} catch (e) {}

// Helper to seed settings if empty
const seedDatabase = async () => {
  const settings = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
  if (settings.count === 0) {
    const defaultSettings = {
      appName: 'Rumah Inklusif Adiba',
      description: 'Kami sama, kami bisa, kami mendidik dengan hati',
      themeColor: '#1e40af',
      contactPhone: '0831-6468-6810',
      contactEmail: 'rumahinklusisatuhati@gmail.com',
      monthlyFee: 500000,
      qrisUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=example-qris-data',
    };
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('app_settings', JSON.stringify(defaultSettings));
  }

  // Auto-bootstrap master admin
  const masterEmail = 'gkrismantara@gmail.com';
  const existingMaster = db.prepare('SELECT * FROM users WHERE email = ?').get(masterEmail);
  if (!existingMaster) {
    console.log(`[Database] Bootstrapping master admin: ${masterEmail}`);
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const uid = 'usr_master';
    db.prepare('INSERT INTO users (uid, email, password, displayName, role, businessLine, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uid, masterEmail, hashedPassword, 'Master Admin', 'admin', 'both', new Date().toISOString());
  }
};
seedDatabase();

// Middleware
const app = express();
app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

// --- API ROUTES ---

// Auth
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) return res.status(401).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign(
      { uid: user.uid, email: user.email, role: user.role, businessLine: user.businessLine, studentId: user.studentId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/bootstrap', async (req, res) => {
  const masterEmail = 'gkrismantara@gmail.com';
  const { email, password, displayName } = req.body;
  const targetEmail = email || masterEmail;
  const targetPassword = password || 'admin123';

  try {
    const hashedPassword = await bcrypt.hash(targetPassword, 10);
    const uid = 'usr_' + Date.now();
    
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(targetEmail);
    if (existing) {
       db.prepare('UPDATE users SET password = ?, displayName = ?, role = ? WHERE email = ?')
         .run(hashedPassword, displayName || 'Admin', 'admin', targetEmail);
    } else {
       db.prepare('INSERT INTO users (uid, email, password, displayName, role, businessLine, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
         .run(uid, targetEmail, hashedPassword, displayName || 'Admin', 'admin', 'both', new Date().toISOString());
    }

    res.json({ message: 'Master Admin synced successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  res.json(req.user);
});

// Students
app.get('/api/students', authenticateToken, (req: any, res) => {
  try {
    if (req.user.role === 'parent' && req.user.studentId) {
      const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.user.studentId);
      return res.json(student ? [student] : []);
    }
    const students = db.prepare('SELECT * FROM students ORDER BY name ASC').all();
    res.json(students);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') return res.status(403).json({ error: 'Unauthorized' });
  const { id, name, parentName, phone, email, educationLevel, type } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  
  const nid = id || 'std_' + Date.now();
  const now = new Date().toISOString();
  
  try {
    const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(nid);
    if (existing) {
      db.prepare('UPDATE students SET name = ?, parentName = ?, phone = ?, email = ?, educationLevel = ?, type = ?, updatedAt = ? WHERE id = ?')
        .run(name, parentName || '', phone || '', email || '', educationLevel || '', type || 'shadow', now, nid);
    } else {
      db.prepare('INSERT INTO students (id, name, parentName, phone, email, educationLevel, type, status, joinedAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(nid, name, parentName || '', phone || '', email || '', educationLevel || '', type || 'shadow', 'active', now, now);
    }
    res.json({ id: nid, name });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/students/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Sessions
app.get('/api/sessions', authenticateToken, (req: any, res) => {
  try {
    let sessions;
    if (req.user.role === 'parent' && req.user.studentId) {
      sessions = db.prepare('SELECT * FROM sessions WHERE studentId = ? ORDER BY date DESC').all(req.user.studentId);
    } else {
      sessions = db.prepare('SELECT * FROM sessions ORDER BY date DESC').all();
    }
    res.json(sessions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sessions', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') return res.status(403).json({ error: 'Unauthorized' });
  const { id, studentId, date, startTime, endTime, status, notes } = req.body;
  const nid = id || 'ses_' + Date.now();
  try {
    const existing = db.prepare('SELECT * FROM sessions WHERE id = ?').get(nid);
    if (existing) {
      db.prepare('UPDATE sessions SET studentId = ?, date = ?, startTime = ?, endTime = ?, status = ?, notes = ? WHERE id = ?')
        .run(studentId, date, startTime, endTime, status || 'scheduled', notes || '', nid);
    } else {
      db.prepare('INSERT INTO sessions (id, studentId, teacherId, date, startTime, endTime, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(nid, studentId, req.user.uid, date, startTime, endTime, status || 'scheduled', notes || '');
    }
    res.json({ id: nid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Payments
app.get('/api/payments', authenticateToken, (req: any, res) => {
  try {
    let payments;
    if (req.user.role === 'parent' && req.user.studentId) {
      payments = db.prepare('SELECT * FROM payments WHERE studentId = ? ORDER BY date DESC').all(req.user.studentId);
    } else {
      payments = db.prepare('SELECT * FROM payments ORDER BY date DESC').all();
    }
    res.json(payments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments', authenticateToken, (req: any, res) => {
  const { id, studentId, amount, date, type, status, proofUrl } = req.body;
  const nid = id || 'pay_' + Date.now();
  try {
    const existing = db.prepare('SELECT * FROM payments WHERE id = ?').get(nid);
    if (existing) {
      db.prepare('UPDATE payments SET studentId = ?, amount = ?, date = ?, type = ?, status = ?, proofUrl = ? WHERE id = ?')
        .run(studentId, amount, date, type, status || 'pending', proofUrl || existing.proofUrl || null, nid);
    } else {
      db.prepare('INSERT INTO payments (id, studentId, amount, date, type, status, proofUrl) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(nid, studentId, amount, date, type, status || 'pending', proofUrl || null);
    }
    res.json({ id: nid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reports
app.get('/api/reports', authenticateToken, (req: any, res) => {
  try {
    let reports;
    if (req.user.role === 'parent' && req.user.studentId) {
      reports = db.prepare('SELECT * FROM reports WHERE studentId = ? ORDER BY date DESC').all(req.user.studentId);
    } else {
      reports = db.prepare('SELECT * FROM reports ORDER BY date DESC').all();
    }
    res.json(reports);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reports', authenticateToken, (req: any, res) => {
  const { id, studentId, date, type, content } = req.body;
  const nid = id || 'rep_' + Date.now();
  try {
    const existing = db.prepare('SELECT * FROM reports WHERE id = ?').get(nid);
    if (existing) {
      db.prepare('UPDATE reports SET studentId = ?, date = ?, type = ?, content = ? WHERE id = ?')
        .run(studentId, date, type, content, nid);
    } else {
      db.prepare('INSERT INTO reports (id, studentId, teacherId, date, type, content) VALUES (?, ?, ?, ?, ?, ?)')
        .run(nid, studentId, req.user.uid, date, type, content);
    }
    res.json({ id: nid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// User Management
app.get('/api/users', authenticateToken, (req: any, res) => {
  try {
    const users = db.prepare('SELECT uid, email, displayName, role, businessLine, studentId, createdAt FROM users').all();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const { email, password, displayName, role, businessLine, studentId } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password || 'default123', 10);
    const uid = 'usr_' + Date.now();
    db.prepare('INSERT INTO users (uid, email, password, displayName, role, businessLine, studentId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(uid, email, hashedPassword, displayName, role, businessLine || null, studentId || null, new Date().toISOString());
    res.json({ uid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Announcements
app.get('/api/announcements', (req, res) => {
  try {
    const announcements = db.prepare('SELECT * FROM announcements ORDER BY createdAt DESC').all();
    res.json(announcements);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/announcements', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') return res.status(403).json({ error: 'Unauthorized' });
  const { title, content, type } = req.body;
  const id = 'ann_' + Date.now();
  try {
    db.prepare('INSERT INTO announcements (id, title, content, type, authorId, authorName, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, title, content, type, req.user.uid, req.user.displayName || 'Staff', new Date().toISOString());
    res.json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/announcements/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') return res.status(403).json({ error: 'Unauthorized' });
  try {
    db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Settings
app.get('/api/settings', (req, res) => {
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('app_settings') as any;
    if (!row) return res.json({ appName: 'EduFlow Manager', themeColor: '#2563EB' });
    res.json(JSON.parse(row.value));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('app_settings', JSON.stringify(req.body));
    res.json({ message: 'Settings updated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Vite Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduFlow SQLite Server running at http://localhost:${PORT}`);
  });
}

startServer();
