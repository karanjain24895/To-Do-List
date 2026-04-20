// ============================================================
//  AWS EC2 Full-Stack App — Task Manager
//  server.js  (Entry Point)
// ============================================================

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── In-Memory "Database" (no extra setup needed for the lab) ─
let tasks = [
  { id: 1, title: 'Deploy static site to S3',    done: true,  priority: 'high'   },
  { id: 2, title: 'Launch EC2 instance',          done: true,  priority: 'high'   },
  { id: 3, title: 'Configure Security Group',     done: false, priority: 'high'   },
  { id: 4, title: 'Install Node.js on EC2',       done: false, priority: 'medium' },
  { id: 5, title: 'Clone repo & npm install',     done: false, priority: 'medium' },
  { id: 6, title: 'Set up Nginx reverse proxy',   done: false, priority: 'low'    },
];
let nextId = 7;

// ── Routes ───────────────────────────────────────────────────
const taskRouter = require('./routes/tasks');
app.use('/api/tasks', taskRouter(tasks, () => nextId++));

// Health-check route — useful for AWS load balancer pings
app.get('/health', (req, res) => {
  res.json({
    status : 'OK',
    uptime : process.uptime().toFixed(1) + 's',
    time   : new Date().toISOString(),
    server : 'AWS EC2 — Node.js + Express',
  });
});

// Catch-all → serve index.html (SPA style)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔════════════════════════════════════╗
  ║   🚀  Task Manager API Running     ║
  ║   Port : ${PORT}                      ║
  ║   Env  : ${process.env.NODE_ENV || 'development'}               ║
  ╚════════════════════════════════════╝

  Endpoints:
    GET    /health
    GET    /api/tasks
    POST   /api/tasks
    PUT    /api/tasks/:id
    DELETE /api/tasks/:id
  `);
});
