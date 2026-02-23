# Immigration Firm CRM - Multi-User System

A complete, production-ready CRM system for immigration law firms with multi-user support, role-based access control, case notes, workflow tracking, and document management.

## Features

### Core Functionality
- **Multi-User Authentication** - JWT-based authentication with role-based access (Admin, Manager, Staff)
- **Client Management** - Complete client profiles with contact information and case history
- **Case Management** - Track cases through 5-stage pipeline with assignments and deadlines
- **Case Notes** - Comprehensive note-taking system with internal/external visibility
- **Task Management** - Assign and track tasks with priorities and due dates
- **Document Tracking** - Monitor required documents and their status
- **Interaction Logging** - Record all client communications with timestamps
- **Dashboard Analytics** - Real-time statistics and metrics

### User Roles
- **Admin** - Full access, user management, all operations
- **Manager** - Case management, assign tasks, view reports
- **Staff** - Day-to-day operations, client interactions, data entry

## Quick Start

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Start the server**
```bash
npm start
```

3. **Access the application**
Open browser to: `http://localhost:3000`

### Default Credentials
```
Username: admin
Password: admin123
```

## Project Structure

```
immigration-crm/
├── server.js           # Backend API server
├── index.html          # Frontend application
├── package.json        # Dependencies
├── immigration_crm.db  # SQLite database (auto-created)
└── README.md          # Documentation
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register user (admin only)
- `GET /api/auth/me` - Get current user

### Clients
- `GET /api/clients` - List all clients
- `GET /api/clients/:id` - Get client details
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Cases
- `GET /api/cases` - List all cases
- `GET /api/cases/:id` - Get case details
- `POST /api/cases` - Create case
- `PUT /api/cases/:id` - Update case
- `DELETE /api/cases/:id` - Delete case

### Case Notes
- `GET /api/cases/:caseId/notes` - Get case notes
- `POST /api/cases/:caseId/notes` - Add note to case
- `DELETE /api/case-notes/:id` - Delete note

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Documents
- `GET /api/documents` - List all documents
- `GET /api/cases/:caseId/documents` - Get case documents
- `POST /api/documents` - Add document requirement
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

### Interactions
- `GET /api/interactions` - List interactions
- `POST /api/interactions` - Log interaction
- `DELETE /api/interactions/:id` - Delete interaction

### Dashboard
- `GET /api/dashboard/stats` - Get statistics

## Website Integration

### API Integration Example
```javascript
// Create client from website form
async function createClient(formData) {
  const response = await fetch('http://your-server.com/api/clients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify({
      name: formData.name,
      email: formData.email,
      phone: formData.phone
    })
  });
  return await response.json();
}
```

## Deployment

### VPS Deployment (DigitalOcean, AWS, etc.)

1. **Setup server**
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

2. **Upload and start**
```bash
cd /var/www/immigration-crm
npm install
pm2 start server.js --name crm
pm2 save
pm2 startup
```

3. **Configure Nginx**
```nginx
server {
    listen 80;
    server_name crm.yourfirm.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

4. **Setup SSL**
```bash
sudo certbot --nginx -d crm.yourfirm.com
```

### Heroku Deployment

```bash
heroku create your-crm
git push heroku main
heroku config:set JWT_SECRET=your-secret-key
```

## Security

1. Change default admin password immediately
2. Set strong JWT_SECRET in environment variables
3. Use HTTPS in production
4. Regular database backups
5. Keep dependencies updated

## Environment Variables

Create `.env` file:
```
PORT=3000
JWT_SECRET=your-secret-key-here
NODE_ENV=production
```

## Case Notes Feature

### Creating Notes
```javascript
// Add internal note (staff only)
POST /api/cases/123/notes
{
  "note_type": "Internal Memo",
  "content": "Client requested expedited processing",
  "is_internal": true
}

// Add client-visible note
POST /api/cases/123/notes
{
  "note_type": "Status Update",
  "content": "Application submitted to USCIS",
  "is_internal": false
}
```

### Note Types
- General Note
- Status Update
- Client Communication
- Document Update
- Internal Memo
- Action Required

## Database Schema

### Key Tables
- **users** - User accounts with roles
- **clients** - Client information
- **cases** - Immigration cases
- **case_notes** - Notes attached to cases
- **tasks** - Action items
- **documents** - Required documents
- **interactions** - Client communications

## Customization

### Add Case Types
Edit arrays in both `server.js` and `index.html`:
```javascript
const caseTypes = [
  'Your Custom Type',
  'Another Type',
  // ...
];
```

### Change Colors
Modify Tailwind CSS classes in `index.html`

### Add Email Notifications
```javascript
npm install nodemailer
// See full email example in detailed documentation
```

## Troubleshooting

**Port in use:**
```bash
lsof -i :3000
kill -9 <PID>
```

**Database locked:**
```bash
pm2 restart crm
```

**API not connecting:**
- Check server status: `pm2 status`
- Verify API_URL in index.html
- Check firewall/CORS settings

## Upgrading to PostgreSQL

1. Install: `npm install pg`
2. Update connection in server.js
3. Modify queries for PostgreSQL syntax

## License

MIT License

---

Built for Immigration Law Firms 🌍⚖️

For questions or support, contact your development team.
