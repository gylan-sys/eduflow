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
import multer from 'multer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'rumah-inklusif-super-secret-key-123';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.db');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

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
    assignedStudentIds TEXT,
    createdAt TEXT,
    photoUrl TEXT,
    phone TEXT,
    address TEXT,
    gender TEXT,
    specialization TEXT,
    education TEXT,
    birthDate TEXT,
    birthPlace TEXT,
    joinDate TEXT
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
    updatedAt TEXT,
    photoUrl TEXT,
    address TEXT,
    gender TEXT,
    hobbies TEXT,
    emergencyContact TEXT,
    religion TEXT,
    placeOfBirth TEXT,
    dateOfBirth TEXT,
    notes TEXT
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

  CREATE TABLE IF NOT EXISTS programs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    includes TEXT,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT
  );
`);

// Try to add column if it doesn't exist (handle already existing cases)
try {
  db.exec("ALTER TABLE payments ADD COLUMN proofUrl TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE announcements ADD COLUMN targetStudentId TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN assignedStudentIds TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE students ADD COLUMN photoUrl TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE students ADD COLUMN address TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE students ADD COLUMN gender TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE students ADD COLUMN hobbies TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE students ADD COLUMN emergencyContact TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE students ADD COLUMN religion TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE students ADD COLUMN placeOfBirth TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE students ADD COLUMN dateOfBirth TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE students ADD COLUMN notes TEXT");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN photoUrl TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN phone TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN address TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN gender TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN specialization TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN education TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN birthDate TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN birthPlace TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN joinDate TEXT");
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
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(401).json({ error: 'Unauthorized: Session expired' });
    req.user = user;
    next();
  });
};

app.post('/api/upload', authenticateToken, upload.single('file'), (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

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
      { 
        uid: user.uid, 
        email: user.email, 
        role: user.role, 
        businessLine: user.businessLine, 
        studentId: user.studentId,
        assignedStudentIds: user.assignedStudentIds ? JSON.parse(user.assignedStudentIds) : []
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    userWithoutPassword.assignedStudentIds = user.assignedStudentIds ? JSON.parse(user.assignedStudentIds) : [];
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
  try {
    const user = db.prepare('SELECT uid, email, displayName, role, businessLine, studentId, assignedStudentIds, photoUrl, phone, address, gender, specialization, education, birthDate, birthPlace, joinDate FROM users WHERE uid = ?').get(req.user.uid) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({
      ...user,
      assignedStudentIds: user.assignedStudentIds ? JSON.parse(user.assignedStudentIds) : [],
      photoURL: user.photoUrl,
      phoneNumber: user.phone
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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
  const { 
    id, name, parentName, phone, email, educationLevel, type, 
    photoUrl, address, gender, hobbies, emergencyContact, religion, 
    placeOfBirth, dateOfBirth, notes 
  } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  
  const nid = id || 'std_' + Date.now();
  const now = new Date().toISOString();
  
  try {
    const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(nid);
    if (existing) {
      db.prepare(`
        UPDATE students SET 
          name = ?, parentName = ?, phone = ?, email = ?, educationLevel = ?, 
          type = ?, photoUrl = ?, address = ?, gender = ?, hobbies = ?, 
          emergencyContact = ?, religion = ?, placeOfBirth = ?, dateOfBirth = ?, 
          notes = ?, updatedAt = ? 
        WHERE id = ?
      `).run(
        name, parentName || '', phone || '', email || '', educationLevel || '', 
        type || 'shadow', photoUrl || null, address || null, gender || null, 
        hobbies || null, emergencyContact || null, religion || null, 
        placeOfBirth || null, dateOfBirth || null, notes || null, now, nid
      );
    } else {
      db.prepare(`
        INSERT INTO students (
          id, name, parentName, phone, email, educationLevel, type, 
          status, joinedAt, updatedAt, photoUrl, address, gender, 
          hobbies, emergencyContact, religion, placeOfBirth, dateOfBirth, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        nid, name, parentName || '', phone || '', email || '', educationLevel || '', 
        type || 'shadow', 'active', now, now, photoUrl || null, address || null, 
        gender || null, hobbies || null, emergencyContact || null, religion || null, 
        placeOfBirth || null, dateOfBirth || null, notes || null
      );
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
      
      // Create notification for new billing
      if (status === 'pending') {
        const annId = 'ann_bill_' + Date.now();
        db.prepare('INSERT INTO announcements (id, title, content, type, authorId, authorName, targetStudentId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .run(annId, 'Tagihan Baru', `Ada penagihan baru sebesar Rp ${Number(amount).toLocaleString('id-ID')}`, 'billing', req.user.uid, req.user.displayName || 'Sistem', studentId, new Date().toISOString());
      }
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
    const users = db.prepare('SELECT uid, email, displayName, role, businessLine, studentId, assignedStudentIds, createdAt, photoUrl, phone, address, gender, specialization, education, birthDate, birthPlace, joinDate FROM users').all() as any[];
    const parsedUsers = users.map(u => ({
      ...u,
      assignedStudentIds: u.assignedStudentIds ? JSON.parse(u.assignedStudentIds) : [],
      photoURL: u.photoUrl, // Frontend expects photoURL
      phoneNumber: u.phone // Frontend expects phoneNumber
    }));
    res.json(parsedUsers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile', authenticateToken, async (req: any, res: any) => {
  const { 
    displayName, photoUrl, phone, address, gender, 
    specialization, education, birthDate, birthPlace, password 
  } = req.body;
  
  try {
    const sets = [
      'displayName = ?', 'photoUrl = ?', 'phone = ?', 'address = ?', 
      'gender = ?', 'specialization = ?', 'education = ?', 
      'birthDate = ?', 'birthPlace = ?'
    ];
    const params = [
      displayName, photoUrl || null, phone || null, address || null, 
      gender || null, specialization || null, education || null, 
      birthDate || null, birthPlace || null
    ];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      sets.push('password = ?');
      params.push(hashedPassword);
    }

    params.push(req.user.uid);
    db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE uid = ?`).run(...params);
    res.json({ message: 'Profile updated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const { 
    email, password, displayName, role, businessLine, studentId, assignedStudentIds,
    photoUrl, phone, address, gender, specialization, education, birthDate, birthPlace, joinDate
  } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password || 'default123', 10);
    const uid = 'usr_' + Date.now();
    db.prepare(`
      INSERT INTO users (
        uid, email, password, displayName, role, businessLine, studentId, assignedStudentIds, 
        createdAt, photoUrl, phone, address, gender, specialization, education, birthDate, birthPlace, joinDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uid, email, hashedPassword, displayName, role, businessLine || null, studentId || null, 
      assignedStudentIds ? JSON.stringify(assignedStudentIds) : null, new Date().toISOString(),
      photoUrl || null, phone || null, address || null, gender || null, 
      specialization || null, education || null, birthDate || null, birthPlace || null, joinDate || null
    );
    res.json({ uid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:uid', authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const { 
    displayName, email, role, businessLine, studentId, assignedStudentIds, password,
    photoUrl, phone, address, gender, specialization, education, birthDate, birthPlace, joinDate
  } = req.body;
  try {
    const sets = [
      'displayName = ?', 'email = ?', 'role = ?', 'businessLine = ?', 'studentId = ?', 'assignedStudentIds = ?',
      'photoUrl = ?', 'phone = ?', 'address = ?', 'gender = ?', 'specialization = ?', 
      'education = ?', 'birthDate = ?', 'birthPlace = ?', 'joinDate = ?'
    ];
    const params = [
      displayName, email, role, businessLine || null, studentId || null, 
      assignedStudentIds ? JSON.stringify(assignedStudentIds) : null,
      photoUrl || null, phone || null, address || null, gender || null,
      specialization || null, education || null, birthDate || null, birthPlace || null, joinDate || null
    ];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      sets.push('password = ?');
      params.push(hashedPassword);
    }

    params.push(req.params.uid);
    db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE uid = ?`).run(...params);
    res.json({ message: 'User updated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Auth Middleware - Optional
const optionalAuthenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (!err) req.user = user;
    next();
  });
};

// Announcements
app.get('/api/announcements', optionalAuthenticate, (req: any, res) => {
  try {
    let announcements;
    if (req.user && req.user.role === 'parent' && req.user.studentId) {
      announcements = db.prepare('SELECT * FROM announcements WHERE targetStudentId IS NULL OR targetStudentId = ? ORDER BY createdAt DESC').all(req.user.studentId);
    } else {
      announcements = db.prepare('SELECT * FROM announcements WHERE targetStudentId IS NULL ORDER BY createdAt DESC').all();
    }
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

// Programs
app.get('/api/programs', (req, res) => {
  try {
    const programs = db.prepare('SELECT * FROM programs WHERE isActive = 1 ORDER BY name ASC').all();
    res.json(programs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/programs', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const { name, price, description, includes } = req.body;
  if (!name || price === undefined) return res.status(400).json({ error: 'Name and price are required' });
  const id = 'prg_' + Date.now();
  try {
    db.prepare('INSERT INTO programs (id, name, price, description, includes, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, name, price, description || '', includes || '', new Date().toISOString());
    res.json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/programs/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const { name, price, description, includes, isActive } = req.body;
  try {
    db.prepare('UPDATE programs SET name = ?, price = ?, description = ?, includes = ?, isActive = ? WHERE id = ?')
      .run(name, price, description, includes, isActive === false ? 0 : 1, req.params.id);
    res.json({ message: 'Updated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/programs/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    db.prepare('DELETE FROM programs WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Utility to get all tables data
app.get('/api/backup', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    const data: any = {};
    const tables = ['users', 'students', 'sessions', 'reports', 'payments', 'announcements', 'programs', 'settings'];
    
    tables.forEach(table => {
      data[table] = db.prepare(`SELECT * FROM ${table}`).all();
    });
    
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/restore', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const backupData = req.body;
  
  try {
    const tables = ['users', 'students', 'sessions', 'reports', 'payments', 'announcements', 'programs', 'settings'];
    
    // Use a transaction for safety
    const transaction = db.transaction(() => {
      tables.forEach(table => {
        if (backupData[table]) {
          db.prepare(`DELETE FROM ${table}`).run();
          const rows = backupData[table];
          if (rows.length > 0) {
            const columns = Object.keys(rows[0]);
            const placeholders = columns.map(() => '?').join(',');
            const stmt = db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`);
            
            rows.forEach((row: any) => {
              const values = columns.map(col => row[col]);
              stmt.run(...values);
            });
          }
        }
      });
    });
    
    transaction();
    res.json({ message: 'Database restored successfully' });
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
