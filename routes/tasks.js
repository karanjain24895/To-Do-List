// routes/tasks.js — CRUD API for Tasks

const express = require('express');

module.exports = function (tasks, getNextId) {
  const router = express.Router();

  // GET /api/tasks — list all
  router.get('/', (req, res) => {
    res.json({ success: true, count: tasks.length, data: tasks });
  });

  // GET /api/tasks/:id — single task
  router.get('/:id', (req, res) => {
    const task = tasks.find(t => t.id === parseInt(req.params.id));
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  });

  // POST /api/tasks — create
  router.post('/', (req, res) => {
    const { title, priority = 'medium' } = req.body;
    if (!title || !title.trim())
      return res.status(400).json({ success: false, message: 'Title is required' });

    const task = { id: getNextId(), title: title.trim(), done: false, priority };
    tasks.push(task);
    res.status(201).json({ success: true, data: task });
  });

  // PUT /api/tasks/:id — update
  router.put('/:id', (req, res) => {
    const idx = tasks.findIndex(t => t.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Task not found' });

    const { title, done, priority } = req.body;
    if (title    !== undefined) tasks[idx].title    = title.trim();
    if (done     !== undefined) tasks[idx].done     = Boolean(done);
    if (priority !== undefined) tasks[idx].priority = priority;

    res.json({ success: true, data: tasks[idx] });
  });

  // DELETE /api/tasks/:id — delete
  router.delete('/:id', (req, res) => {
    const idx = tasks.findIndex(t => t.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Task not found' });

    const removed = tasks.splice(idx, 1)[0];
    res.json({ success: true, data: removed, message: 'Task deleted' });
  });

  return router;
};
