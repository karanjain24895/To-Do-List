// ============================================================
//  Task Manager — Frontend JS
//  Talks to the Express API running on the same server
// ============================================================

const API = '/api/tasks';
let allTasks = [];
let currentFilter = 'all';

// ── DOM refs ─────────────────────────────────────────────────
const taskList     = document.getElementById('taskList');
const openModal    = document.getElementById('openModal');
const closeModal   = document.getElementById('closeModal');
const cancelBtn    = document.getElementById('cancelBtn');
const saveBtn      = document.getElementById('saveBtn');
const modalOverlay = document.getElementById('modalOverlay');
const taskInput    = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');

// ── Fetch helpers ─────────────────────────────────────────────
async function api(url, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  return res.json();
}

// ── Load tasks ────────────────────────────────────────────────
async function loadTasks() {
  const data = await api(API);
  allTasks = data.data || [];
  updateStats();
  renderTasks();
}

// ── Stats ─────────────────────────────────────────────────────
function updateStats() {
  document.getElementById('totalCount').textContent   = allTasks.length;
  document.getElementById('doneCount').textContent    = allTasks.filter(t => t.done).length;
  document.getElementById('pendingCount').textContent = allTasks.filter(t => !t.done).length;
}

// ── Render ────────────────────────────────────────────────────
function renderTasks() {
  let filtered = allTasks;
  if (currentFilter === 'pending') filtered = allTasks.filter(t => !t.done);
  else if (currentFilter === 'done') filtered = allTasks.filter(t => t.done);
  else if (['high','medium','low'].includes(currentFilter))
    filtered = allTasks.filter(t => t.priority === currentFilter);

  taskList.innerHTML = '';

  if (!filtered.length) {
    taskList.innerHTML = `<div style="text-align:center;padding:3rem;color:#64748b">No tasks found</div>`;
    return;
  }

  filtered.forEach(task => {
    const el = document.createElement('div');
    el.className = `task-item ${task.done ? 'done' : ''}`;
    el.dataset.id = task.id;
    el.innerHTML = `
      <div class="task-check ${task.done ? 'checked' : ''}" data-id="${task.id}" title="Toggle done"></div>
      <span class="task-title">${escapeHtml(task.title)}</span>
      <span class="priority-badge ${task.priority}">${task.priority}</span>
      <button class="task-delete" data-id="${task.id}" title="Delete">✕</button>
    `;
    taskList.appendChild(el);
  });
}

// ── Toggle done ───────────────────────────────────────────────
taskList.addEventListener('click', async (e) => {
  const check = e.target.closest('.task-check');
  const del   = e.target.closest('.task-delete');

  if (check) {
    const id   = parseInt(check.dataset.id);
    const task = allTasks.find(t => t.id === id);
    await api(`${API}/${id}`, 'PUT', { done: !task.done });
    await loadTasks();
  }

  if (del) {
    const id = parseInt(del.dataset.id);
    await api(`${API}/${id}`, 'DELETE');
    await loadTasks();
  }
});

// ── Filter ────────────────────────────────────────────────────
document.querySelectorAll('.filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// ── Modal ─────────────────────────────────────────────────────
function openAdd() { modalOverlay.classList.add('active'); taskInput.focus(); }
function closeAdd() { modalOverlay.classList.remove('active'); taskInput.value = ''; }

openModal.addEventListener('click', openAdd);
closeModal.addEventListener('click', closeAdd);
cancelBtn.addEventListener('click', closeAdd);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeAdd(); });

saveBtn.addEventListener('click', async () => {
  const title = taskInput.value.trim();
  if (!title) return taskInput.focus();
  await api(API, 'POST', { title, priority: prioritySelect.value });
  closeAdd();
  await loadTasks();
});

taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveBtn.click(); });

// ── Health check ──────────────────────────────────────────────
async function checkHealth() {
  try {
    const data = await api('/health');
    document.getElementById('serverStatus').textContent =
      data.status === 'OK' ? `Up · ${data.uptime}` : 'Error';
  } catch {
    document.getElementById('serverStatus').textContent = 'Offline';
    document.querySelector('.server-dot').style.background = '#ef4444';
  }
}

// ── Utils ─────────────────────────────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Init ──────────────────────────────────────────────────────
checkHealth();
loadTasks();
setInterval(checkHealth, 30000); // refresh status every 30s
