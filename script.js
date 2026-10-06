const initialTasks = [
  {
    id: 1,
    title: 'Menyelesaikan tugas Pemrograman Web',
    completed: false,
    detail: 'Menyusun halaman Todo List dengan HTML semantic dan CSS eksternal.',
    notificationTime: '09:00',
    imageData: ''
  },
  {
    id: 2,
    title: 'Merapikan catatan perkuliahan',
    completed: true,
    detail: 'Menata catatan agar lebih mudah dipelajari sebelum ujian.',
    notificationTime: '13:30',
    imageData: ''
  },
  {
    id: 3,
    title: 'Membaca materi untuk besok',
    completed: false,
    detail: 'Membaca modul dan rangkuman materi agar siap di kelas berikutnya.',
    notificationTime: '18:45',
    imageData: ''
  }
];

const DB_NAME = 'todo-saskara-db';
const STORE_NAME = 'tasks';
const THEME_KEY = 'todo-saskara-theme';
const reminderTimeouts = new Map();

const state = {
  tasks: [],
  selectedTaskId: null,
  darkMode: false,
  pendingImageData: ''
};

const taskList = document.getElementById('taskList');
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskNotification = document.getElementById('taskNotification');
const taskImageInput = document.getElementById('taskImageInput');
const taskImagePreview = document.getElementById('taskImagePreview');
const clearImageButton = document.getElementById('clearImageBtn');
const taskCount = document.getElementById('taskCount');
const detailTitle = document.getElementById('detailTitle');
const detailStatus = document.getElementById('detailStatus');
const detailDue = document.getElementById('detailDue');
const detailDescription = document.getElementById('detailDescription');
const detailImageWrap = document.getElementById('detailImageWrap');
const themeToggle = document.getElementById('themeToggle');

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Browser tidak mendukung IndexedDB'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('completed', 'completed', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function readAllTasksFromDB(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

function saveTasksToDB() {
  if (!('indexedDB' in window)) {
    return Promise.resolve();
  }

  return openDatabase()
    .then((db) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      state.tasks.forEach((task) => {
        store.put(task);
      });

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    })
    .catch((error) => {
      console.warn('Gagal menyimpan data ke IndexedDB:', error);
    });
}

function resetTasks() {
  state.tasks = initialTasks.map((task) => ({ ...task }));
  state.selectedTaskId = state.tasks[0]?.id ?? null;
}

async function loadTasks() {
  try {
    const db = await openDatabase();
    const tasks = await readAllTasksFromDB(db);

    if (tasks.length > 0) {
      state.tasks = tasks;
      state.selectedTaskId = tasks[0].id;
      return;
    }
  } catch (error) {
    console.warn('Tidak bisa membaca IndexedDB, memakai data default:', error);
  }

  resetTasks();
  await saveTasksToDB();
}

function applyThemePreference() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const isDark = savedTheme === 'dark';
  state.darkMode = isDark;
  document.body.classList.toggle('dark-mode', isDark);
  themeToggle.textContent = isDark ? '☀️ Light' : '🌙 Dark';
  themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}

function updateDetailPanel() {
  const selectedTask = state.tasks.find((task) => task.id === state.selectedTaskId) || state.tasks[0];

  if (!selectedTask) {
    detailTitle.textContent = 'Belum ada tugas';
    detailStatus.textContent = 'Tidak ada';
    detailDue.textContent = 'Belum ditentukan';
    detailDescription.textContent = 'Mulai tambahkan tugas baru di form di samping.';
    detailImageWrap.innerHTML = '';
    return;
  }

  detailTitle.textContent = selectedTask.title;
  detailStatus.textContent = selectedTask.completed ? 'Completed' : 'In progress';
  detailDue.textContent = selectedTask.notificationTime ? selectedTask.notificationTime : 'Today';
  detailDescription.textContent = `${selectedTask.detail || 'Tidak ada deskripsi tambahan.'}${selectedTask.notificationTime ? ` | Pengingat: ${selectedTask.notificationTime}` : ''}`;

  if (selectedTask.imageData) {
    detailImageWrap.innerHTML = `
      <img src="${selectedTask.imageData}" alt="Foto tugas ${selectedTask.title}">
    `;
  } else {
    detailImageWrap.innerHTML = '<p class="detail-empty">Belum ada foto yang ditambahkan.</p>';
  }
}

function scheduleTaskReminder(task) {
  if (!task.notificationTime || !('Notification' in window)) {
    return;
  }

  if (reminderTimeouts.has(task.id)) {
    clearTimeout(reminderTimeouts.get(task.id));
  }

  const [hours, minutes] = task.notificationTime.split(':').map(Number);
  const now = new Date();
  const reminderTime = new Date();
  reminderTime.setHours(hours, minutes, 0, 0);

  if (reminderTime <= now) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }

  const delay = reminderTime.getTime() - now.getTime();
  const timeoutId = setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification('Pengingat Todo', {
        body: `Waktu tugas "${task.title}" sudah tiba.`
      });
    }
  }, delay);

  reminderTimeouts.set(task.id, timeoutId);
}

function scheduleAllReminders() {
  state.tasks.forEach((task) => {
    if (!task.completed) {
      scheduleTaskReminder(task);
    }
  });
}

function renderTasks() {
  taskList.innerHTML = '';

  if (state.tasks.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'task-item';
    emptyItem.innerHTML = '<span class="task-text">Belum ada tugas.</span>';
    taskList.appendChild(emptyItem);
    taskCount.textContent = '0 tugas';
    return;
  }

  state.tasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = `task-item ${state.selectedTaskId === task.id ? 'active' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-check';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Tandai ${task.title}`);
    checkbox.addEventListener('change', () => {
      task.completed = checkbox.checked;
      renderTasks();
      updateDetailPanel();
      saveTasksToDB();
      scheduleAllReminders();
    });

    const label = document.createElement('label');
    label.className = 'task-text';
    label.textContent = task.title;
    label.setAttribute('for', `task-${task.id}`);
    label.addEventListener('click', () => {
      state.selectedTaskId = task.id;
      renderTasks();
      updateDetailPanel();
    });

    const checkboxId = `task-${task.id}`;
    checkbox.id = checkboxId;
    label.setAttribute('for', checkboxId);

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'task-action';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => {
      state.selectedTaskId = task.id;
      taskInput.value = task.title;
      taskNotification.value = task.notificationTime || '';
      state.pendingImageData = task.imageData || '';
      taskImagePreview.src = task.imageData || '';
      taskImagePreview.classList.toggle('hidden', !task.imageData);
      taskInput.focus();
      taskForm.dataset.editingId = String(task.id);
      taskForm.querySelector('button[type="submit"]').textContent = 'Simpan tugas';
      renderTasks();
      updateDetailPanel();
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'task-action delete-btn';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      state.tasks = state.tasks.filter((item) => item.id !== task.id);
      if (state.selectedTaskId === task.id) {
        state.selectedTaskId = state.tasks[0]?.id ?? null;
      }
      renderTasks();
      updateDetailPanel();
      saveTasksToDB();
    });

    if (task.imageData) {
      const thumb = document.createElement('img');
      thumb.src = task.imageData;
      thumb.alt = `Foto ${task.title}`;
      thumb.className = 'task-thumb';
      item.appendChild(thumb);
    }

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    item.appendChild(checkbox);
    item.appendChild(label);
    item.appendChild(actions);
    taskList.appendChild(item);
  });

  taskCount.textContent = `${state.tasks.length} tugas`;
}

function resetForm() {
  taskForm.reset();
  state.pendingImageData = '';
  taskImagePreview.src = '';
  taskImagePreview.classList.add('hidden');
  delete taskForm.dataset.editingId;
  taskForm.querySelector('button[type="submit"]').textContent = 'Tambah tugas';
}

function handleImageSelection(event) {
  const file = event.target.files?.[0];
  if (!file) {
    state.pendingImageData = '';
    taskImagePreview.src = '';
    taskImagePreview.classList.add('hidden');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    state.pendingImageData = String(reader.result || '');
    taskImagePreview.src = state.pendingImageData;
    taskImagePreview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function handleSubmit(event) {
  event.preventDefault();
  const value = taskInput.value.trim();

  if (!value) {
    taskInput.focus();
    return;
  }

  requestNotificationPermission();

  const editingId = taskForm.dataset.editingId ? Number(taskForm.dataset.editingId) : null;

  if (editingId) {
    const task = state.tasks.find((item) => item.id === editingId);
    if (task) {
      task.title = value;
      task.notificationTime = taskNotification.value || '';
      task.imageData = state.pendingImageData || task.imageData || '';
      task.detail = task.detail || 'Tugas diedit dari form.';
    }
  } else {
    const newTask = {
      id: Date.now(),
      title: value,
      completed: false,
      detail: 'Tugas baru ditambahkan dari form.',
      notificationTime: taskNotification.value || '',
      imageData: state.pendingImageData || ''
    };

    state.tasks.unshift(newTask);
    state.selectedTaskId = newTask.id;
  }

  saveTasksToDB();
  resetForm();
  renderTasks();
  updateDetailPanel();
  scheduleAllReminders();
}

function toggleTheme() {
  state.darkMode = !state.darkMode;
  document.body.classList.toggle('dark-mode', state.darkMode);
  localStorage.setItem(THEME_KEY, state.darkMode ? 'dark' : 'light');
  themeToggle.textContent = state.darkMode ? '☀️ Light' : '🌙 Dark';
  themeToggle.setAttribute('aria-label', state.darkMode ? 'Switch to light mode' : 'Switch to dark mode');
}

function clearCurrentImage() {
  state.pendingImageData = '';
  taskImageInput.value = '';
  taskImagePreview.src = '';
  taskImagePreview.classList.add('hidden');
}

async function initializeApp() {
  applyThemePreference();
  await loadTasks();
  renderTasks();
  updateDetailPanel();
  scheduleAllReminders();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.warn('Service worker gagal didaftarkan:', error);
    });
  }
}

clearImageButton.addEventListener('click', clearCurrentImage);
taskImageInput.addEventListener('change', handleImageSelection);
taskForm.addEventListener('submit', handleSubmit);
themeToggle.addEventListener('click', toggleTheme);

initializeApp();
