// server.js - Immigration CRM Backend Server
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize SQLite Database
const db = new sqlite3.Database('./immigration_crm.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Database Schema
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )`);

    // Clients table
    db.run(`CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      nationality TEXT,
      address TEXT,
      date_of_birth DATE,
      passport_number TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`);

    // Cases table
    db.run(`CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      case_number TEXT UNIQUE NOT NULL,
      case_type TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT DEFAULT 'Medium',
      deadline DATE,
      filing_date DATE,
      assigned_to INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    )`);

    // Case Notes table
    db.run(`CREATE TABLE IF NOT EXISTS case_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      note_type TEXT NOT NULL,
      content TEXT NOT NULL,
      is_internal BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Tasks table
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      assigned_to INTEGER,
      status TEXT DEFAULT 'To Do',
      priority TEXT DEFAULT 'Medium',
      due_date DATE,
      completed_at DATETIME,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`);

    // Documents table
    db.run(`CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      document_type TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      notes TEXT,
      received_date DATE,
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )`);

    // Interactions table
    db.run(`CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      notes TEXT NOT NULL,
      interaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Create default admin user (password: admin123)
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT OR IGNORE INTO users (username, email, password, full_name, role) 
            VALUES ('admin', 'admin@immigrationfirm.com', ?, 'System Administrator', 'admin')`, 
            [hashedPassword]);
  });
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Role-based authorization
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// ============= AUTH ROUTES =============

// Register new user (admin only)
app.post('/api/auth/register', authenticateToken, authorize('admin'), async (req, res) => {
  const { username, email, password, full_name, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      `INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, full_name, role || 'staff'],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: err.message });
        }
        res.json({ 
          message: 'User created successfully',
          user: { id: this.lastID, username, email, full_name, role: role || 'staff' }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Update last login
    db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  });
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  db.get('SELECT id, username, email, full_name, role FROM users WHERE id = ?', 
    [req.user.id], 
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(user);
    }
  );
});

// ============= USER ROUTES =============

// Get all users
app.get('/api/users', authenticateToken, (req, res) => {
  db.all('SELECT id, username, email, full_name, role, created_at, last_login FROM users', 
    [], 
    (err, users) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(users);
    }
  );
});

// ============= CLIENT ROUTES =============

// Get all clients
app.get('/api/clients', authenticateToken, (req, res) => {
  db.all(`
    SELECT c.*, u.full_name as created_by_name 
    FROM clients c 
    LEFT JOIN users u ON c.created_by = u.id
    ORDER BY c.created_at DESC
  `, [], (err, clients) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(clients);
  });
});

// Get single client with full details
app.get('/api/clients/:id', authenticateToken, (req, res) => {
  const clientId = req.params.id;
  
  db.get('SELECT * FROM clients WHERE id = ?', [clientId], (err, client) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    
    // Get associated cases
    db.all('SELECT * FROM cases WHERE client_id = ?', [clientId], (err, cases) => {
      if (err) return res.status(500).json({ error: err.message });
      
      client.cases = cases;
      res.json(client);
    });
  });
});

// Create client
app.post('/api/clients', authenticateToken, (req, res) => {
  const { name, email, phone, nationality, address, date_of_birth, passport_number } = req.body;
  
  db.run(
    `INSERT INTO clients (name, email, phone, nationality, address, date_of_birth, passport_number, created_by) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, email, phone, nationality, address, date_of_birth, passport_number, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Client created successfully' });
    }
  );
});

// Update client
app.put('/api/clients/:id', authenticateToken, (req, res) => {
  const { name, email, phone, nationality, address, date_of_birth, passport_number } = req.body;
  const clientId = req.params.id;
  
  db.run(
    `UPDATE clients 
     SET name = ?, email = ?, phone = ?, nationality = ?, address = ?, 
         date_of_birth = ?, passport_number = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [name, email, phone, nationality, address, date_of_birth, passport_number, clientId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Client updated successfully' });
    }
  );
});

// Delete client
app.delete('/api/clients/:id', authenticateToken, authorize('admin', 'manager'), (req, res) => {
  db.run('DELETE FROM clients WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Client deleted successfully' });
  });
});

// ============= CASE ROUTES =============

// Get all cases
app.get('/api/cases', authenticateToken, (req, res) => {
  db.all(`
    SELECT c.*, cl.name as client_name, u.full_name as assigned_to_name 
    FROM cases c 
    LEFT JOIN clients cl ON c.client_id = cl.id
    LEFT JOIN users u ON c.assigned_to = u.id
    ORDER BY c.created_at DESC
  `, [], (err, cases) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(cases);
  });
});

// Get single case with full details
app.get('/api/cases/:id', authenticateToken, (req, res) => {
  const caseId = req.params.id;
  
  db.get(`
    SELECT c.*, cl.name as client_name, cl.email as client_email, 
           u.full_name as assigned_to_name 
    FROM cases c 
    LEFT JOIN clients cl ON c.client_id = cl.id
    LEFT JOIN users u ON c.assigned_to = u.id
    WHERE c.id = ?
  `, [caseId], (err, caseData) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!caseData) return res.status(404).json({ error: 'Case not found' });
    
    // Get case notes
    db.all(`
      SELECT cn.*, u.full_name as user_name 
      FROM case_notes cn 
      LEFT JOIN users u ON cn.user_id = u.id
      WHERE cn.case_id = ? 
      ORDER BY cn.created_at DESC
    `, [caseId], (err, notes) => {
      if (err) return res.status(500).json({ error: err.message });
      
      caseData.notes_list = notes;
      res.json(caseData);
    });
  });
});

// Create case
app.post('/api/cases', authenticateToken, (req, res) => {
  const { client_id, case_type, status, priority, deadline, filing_date, assigned_to, notes } = req.body;
  
  // Generate case number
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const case_number = `IMM-${year}-${random}`;
  
  db.run(
    `INSERT INTO cases (client_id, case_number, case_type, status, priority, deadline, filing_date, assigned_to, notes) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [client_id, case_number, case_type, status, priority, deadline, filing_date, assigned_to, notes],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, case_number, message: 'Case created successfully' });
    }
  );
});

// Update case
app.put('/api/cases/:id', authenticateToken, (req, res) => {
  const { status, priority, deadline, filing_date, assigned_to, notes } = req.body;
  const caseId = req.params.id;
  
  db.run(
    `UPDATE cases 
     SET status = ?, priority = ?, deadline = ?, filing_date = ?, assigned_to = ?, 
         notes = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [status, priority, deadline, filing_date, assigned_to, notes, caseId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Case updated successfully' });
    }
  );
});

// Delete case
app.delete('/api/cases/:id', authenticateToken, authorize('admin', 'manager'), (req, res) => {
  db.run('DELETE FROM cases WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Case deleted successfully' });
  });
});

// ============= CASE NOTES ROUTES =============

// Get all notes for a case
app.get('/api/cases/:caseId/notes', authenticateToken, (req, res) => {
  db.all(`
    SELECT cn.*, u.full_name as user_name, u.role as user_role
    FROM case_notes cn 
    LEFT JOIN users u ON cn.user_id = u.id
    WHERE cn.case_id = ? 
    ORDER BY cn.created_at DESC
  `, [req.params.caseId], (err, notes) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(notes);
  });
});

// Add note to case
app.post('/api/cases/:caseId/notes', authenticateToken, (req, res) => {
  const { note_type, content, is_internal } = req.body;
  const caseId = req.params.caseId;
  
  db.run(
    `INSERT INTO case_notes (case_id, user_id, note_type, content, is_internal) 
     VALUES (?, ?, ?, ?, ?)`,
    [caseId, req.user.id, note_type, content, is_internal ? 1 : 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Return the created note with user info
      db.get(`
        SELECT cn.*, u.full_name as user_name, u.role as user_role
        FROM case_notes cn 
        LEFT JOIN users u ON cn.user_id = u.id
        WHERE cn.id = ?
      `, [this.lastID], (err, note) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(note);
      });
    }
  );
});

// Delete note
app.delete('/api/case-notes/:id', authenticateToken, (req, res) => {
  // Check if user owns the note or is admin
  db.get('SELECT user_id FROM case_notes WHERE id = ?', [req.params.id], (err, note) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    
    if (note.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own notes' });
    }
    
    db.run('DELETE FROM case_notes WHERE id = ?', [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Note deleted successfully' });
    });
  });
});

// ============= TASK ROUTES =============

// Get all tasks
app.get('/api/tasks', authenticateToken, (req, res) => {
  const query = req.query.assigned_to === 'me' 
    ? 'SELECT t.*, c.case_number, cl.name as client_name FROM tasks t LEFT JOIN cases c ON t.case_id = c.id LEFT JOIN clients cl ON c.client_id = cl.id WHERE t.assigned_to = ? ORDER BY t.due_date'
    : 'SELECT t.*, c.case_number, cl.name as client_name, u.full_name as assigned_to_name FROM tasks t LEFT JOIN cases c ON t.case_id = c.id LEFT JOIN clients cl ON c.client_id = cl.id LEFT JOIN users u ON t.assigned_to = u.id ORDER BY t.due_date';
  
  const params = req.query.assigned_to === 'me' ? [req.user.id] : [];
  
  db.all(query, params, (err, tasks) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(tasks);
  });
});

// Create task
app.post('/api/tasks', authenticateToken, (req, res) => {
  const { case_id, title, description, assigned_to, status, priority, due_date } = req.body;
  
  db.run(
    `INSERT INTO tasks (case_id, title, description, assigned_to, status, priority, due_date, created_by) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [case_id, title, description, assigned_to, status || 'To Do', priority || 'Medium', due_date, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Task created successfully' });
    }
  );
});

// Update task
app.put('/api/tasks/:id', authenticateToken, (req, res) => {
  const { status, priority, due_date, description } = req.body;
  const taskId = req.params.id;
  
  const completedAt = status === 'Completed' ? 'CURRENT_TIMESTAMP' : 'NULL';
  
  db.run(
    `UPDATE tasks 
     SET status = ?, priority = ?, due_date = ?, description = ?, 
         completed_at = ${completedAt}
     WHERE id = ?`,
    [status, priority, due_date, description, taskId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Task updated successfully' });
    }
  );
});

// Delete task
app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM tasks WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Task deleted successfully' });
  });
});

// ============= DOCUMENT ROUTES =============

// Get documents for a case
app.get('/api/cases/:caseId/documents', authenticateToken, (req, res) => {
  db.all(`
    SELECT d.*, u.full_name as uploaded_by_name 
    FROM documents d 
    LEFT JOIN users u ON d.uploaded_by = u.id
    WHERE d.case_id = ?
  `, [req.params.caseId], (err, documents) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(documents);
  });
});

// Get all documents
app.get('/api/documents', authenticateToken, (req, res) => {
  db.all(`
    SELECT d.*, c.case_number, cl.name as client_name, u.full_name as uploaded_by_name 
    FROM documents d 
    LEFT JOIN cases c ON d.case_id = c.id
    LEFT JOIN clients cl ON c.client_id = cl.id
    LEFT JOIN users u ON d.uploaded_by = u.id
    ORDER BY d.created_at DESC
  `, [], (err, documents) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(documents);
  });
});

// Create document requirement
app.post('/api/documents', authenticateToken, (req, res) => {
  const { case_id, document_type, status, notes } = req.body;
  
  db.run(
    `INSERT INTO documents (case_id, document_type, status, notes, uploaded_by) 
     VALUES (?, ?, ?, ?, ?)`,
    [case_id, document_type, status || 'Pending', notes, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Document requirement added successfully' });
    }
  );
});

// Update document
app.put('/api/documents/:id', authenticateToken, (req, res) => {
  const { status, notes, received_date } = req.body;
  
  db.run(
    `UPDATE documents 
     SET status = ?, notes = ?, received_date = ? 
     WHERE id = ?`,
    [status, notes, received_date, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Document updated successfully' });
    }
  );
});

// Delete document
app.delete('/api/documents/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM documents WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Document deleted successfully' });
  });
});

// ============= INTERACTION ROUTES =============

// Get all interactions
app.get('/api/interactions', authenticateToken, (req, res) => {
  db.all(`
    SELECT i.*, c.name as client_name, u.full_name as user_name 
    FROM interactions i 
    LEFT JOIN clients c ON i.client_id = c.id
    LEFT JOIN users u ON i.user_id = u.id
    ORDER BY i.interaction_date DESC
  `, [], (err, interactions) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(interactions);
  });
});

// Create interaction
app.post('/api/interactions', authenticateToken, (req, res) => {
  const { client_id, type, notes } = req.body;
  
  db.run(
    `INSERT INTO interactions (client_id, user_id, type, notes) 
     VALUES (?, ?, ?, ?)`,
    [client_id, req.user.id, type, notes],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Interaction logged successfully' });
    }
  );
});

// Delete interaction
app.delete('/api/interactions/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM interactions WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Interaction deleted successfully' });
  });
});

// ============= DASHBOARD/STATS ROUTES =============

app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const stats = {};
  
  db.get('SELECT COUNT(*) as count FROM clients', [], (err, result) => {
    stats.totalClients = result.count;
    
    db.get('SELECT COUNT(*) as count FROM cases', [], (err, result) => {
      stats.totalCases = result.count;
      
      db.get('SELECT COUNT(*) as count FROM cases WHERE status != "Closed"', [], (err, result) => {
        stats.activeCases = result.count;
        
        db.get('SELECT COUNT(*) as count FROM tasks WHERE status != "Completed"', [], (err, result) => {
          stats.pendingTasks = result.count;
          
          db.get('SELECT COUNT(*) as count FROM documents WHERE status = "Pending"', [], (err, result) => {
            stats.pendingDocuments = result.count;
            
            res.json(stats);
          });
        });
      });
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Immigration CRM Server running on port ${PORT}`);
  console.log(`Default admin credentials: username: admin, password: admin123`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});
