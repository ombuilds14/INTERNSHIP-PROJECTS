// ----- Element references -----
const taskInput = document.getElementById('taskInput');
const priorityInput = document.getElementById('priorityInput');
const categoryInput = document.getElementById('categoryInput');
const dueDateInput = document.getElementById('dueDateInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const themeToggle = document.getElementById('themeToggle');
const emptyState = document.getElementById('emptyState');

const totalCountEl = document.getElementById('totalCount');
const doneCountEl = document.getElementById('doneCount');
const pendingCountEl = document.getElementById('pendingCount');
const progressPercentEl = document.getElementById('progressPercent');
const progressBarFillEl = document.getElementById('progressBarFill');
const taskCountFooterEl = document.getElementById('taskCountFooter');

// ----- State -----
let tasks = JSON.parse(localStorage.getItem('taskflow-tasks')) || [];
let currentFilter = 'all';
let searchTerm = '';

const categoryIcons = {
  study: '📚 Study',
  coding: '💻 Coding',
  personal: '📝 Personal',
  other: '🏷️ Other'
};

// ----- Save to localStorage -----
function saveTasks() {
  localStorage.setItem('taskflow-tasks', JSON.stringify(tasks));
}

// ----- Add a new task -----
function addTask() {
  const text = taskInput.value.trim();

  if (text === '') {
    taskInput.focus();
    return;
  }

  const newTask = {
    id: Date.now(),
    text: text,
    priority: priorityInput.value,
    category: categoryInput.value,
    dueDate: dueDateInput.value || null,
    completed: false
  };

  tasks.push(newTask);
  saveTasks();
  render();

  taskInput.value = '';
  dueDateInput.value = '';
  taskInput.focus();
}

// ----- Toggle complete -----
function toggleComplete(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveTasks();
  render();
}

// ----- Delete task (with fade animation) -----
function deleteTask(id) {
  const li = document.querySelector(`li[data-id="${id}"]`);
  if (li) {
    li.classList.add('removing');
    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
      render();
    }, 200);
  } else {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    render();
  }
}

// ----- Edit task -----
function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  const newText = prompt('Edit task:', task.text);
  if (newText !== null && newText.trim() !== '') {
    task.text = newText.trim();
    saveTasks();
    render();
  }
}

// ----- Clear completed -----
function clearCompleted() {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  render();
}

// ----- Check overdue -----
function isOverdue(dueDate, completed) {
  if (!dueDate || completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  return due < today;
}

// ----- Format date nicely -----
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ----- Render task list based on filter + search -----
function render() {
  taskList.innerHTML = '';

  let filtered = tasks.filter(t => {
    if (currentFilter === 'active') return !t.completed;
    if (currentFilter === 'completed') return t.completed;
    return true;
  });

  if (searchTerm) {
    filtered = filtered.filter(t => t.text.toLowerCase().includes(searchTerm.toLowerCase()));
  }

  emptyState.style.display = filtered.length === 0 ? 'block' : 'none';

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.dataset.id = task.id;
    if (task.completed) li.classList.add('completed');

    const overdue = isOverdue(task.dueDate, task.completed);

    li.innerHTML = `
      <input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''}>
      <div class="task-content">
        <div class="task-text">${escapeHtml(task.text)}</div>
        <div class="task-meta">
          <span class="priority-dot priority-${task.priority}">${task.priority}</span>
          <span class="category-tag">${categoryIcons[task.category] || task.category}</span>
          ${task.dueDate ? `<span class="due-date-tag ${overdue ? 'overdue' : ''}">${overdue ? '⚠ Overdue · ' : '📅 '}${formatDate(task.dueDate)}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="edit-btn" title="Edit">✏️</button>
        <button class="delete-btn" title="Delete">🗑️</button>
      </div>
    `;

    li.querySelector('.checkbox').addEventListener('change', () => toggleComplete(task.id));
    li.querySelector('.edit-btn').addEventListener('click', () => editTask(task.id));
    li.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));

    taskList.appendChild(li);
  });

  updateStats();
}

// ----- Escape HTML to avoid breaking layout with special characters -----
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ----- Update stats + progress bar -----
function updateStats() {
  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  const pending = total - done;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  totalCountEl.textContent = total;
  doneCountEl.textContent = done;
  pendingCountEl.textContent = pending;
  progressPercentEl.textContent = percent + '%';
  progressBarFillEl.style.width = percent + '%';
  taskCountFooterEl.textContent = `${pending} task${pending !== 1 ? 's' : ''} left`;
}

// ----- Event listeners -----
addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTask();
});

searchInput.addEventListener('input', (e) => {
  searchTerm = e.target.value;
  render();
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

clearCompletedBtn.addEventListener('click', clearCompleted);

// ----- Dark mode toggle -----
function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('taskflow-theme', theme);
}

themeToggle.addEventListener('click', () => {
  const current = document.body.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// ----- Initial load -----
const savedTheme = localStorage.getItem('taskflow-theme') || 'light';
applyTheme(savedTheme);
render();