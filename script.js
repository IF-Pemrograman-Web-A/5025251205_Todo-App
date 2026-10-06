const initialTasks = [
  {
    id: 1,
    title: 'Menyelesaikan tugas Pemrograman Web',
    completed: false,
    detail: 'Menyusun halaman Todo List dengan HTML semantic dan CSS eksternal.'
  },
  {
    id: 2,
    title: 'Merapikan catatan perkuliahan',
    completed: true,
    detail: 'Menata catatan agar lebih mudah dipelajari sebelum ujian.'
  },
  {
    id: 3,
    title: 'Membaca materi untuk besok',
    completed: false,
    detail: 'Membaca modul dan rangkuman materi agar siap di kelas berikutnya.'
  }
];

const state = {
  tasks: [...initialTasks],
  selectedTaskId: 1,
  darkMode: false
};

const taskList = document.getElementById('taskList');
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskCount = document.getElementById('taskCount');
const detailTitle = document.getElementById('detailTitle');
const detailStatus = document.getElementById('detailStatus');
const detailDue = document.getElementById('detailDue');
const detailDescription = document.getElementById('detailDescription');
const themeToggle = document.getElementById('themeToggle');

function resetTasks() {
  state.tasks = initialTasks.map(task => ({ ...task }));
  state.selectedTaskId = state.tasks[0]?.id ?? null;
}

function updateDetailPanel() {
  const selectedTask = state.tasks.find(task => task.id === state.selectedTaskId) || state.tasks[0];

  if (!selectedTask) {
    detailTitle.textContent = 'Belum ada tugas';
    detailStatus.textContent = 'Tidak ada';
    detailDue.textContent = 'Belum ditentukan';
    detailDescription.textContent = 'Mulai tambahkan tugas baru di form di samping.';
    return;
  }

  detailTitle.textContent = selectedTask.title;
  detailStatus.textContent = selectedTask.completed ? 'Completed' : 'In progress';
  detailDue.textContent = selectedTask.completed ? 'Done' : 'Today';
  detailDescription.textContent = selectedTask.detail || 'Tidak ada deskripsi tambahan.';
}

function saveTasks() {
  // Data tetap di memory saat aplikasi berjalan dan kembali ke default saat halaman di-refresh.
}

function loadTasks() {
  resetTasks();
}

function renderTasks() {
  taskList.innerHTML = '';

  state.tasks.forEach(task => {
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
      state.tasks = state.tasks.filter(item => item.id !== task.id);
      if (state.selectedTaskId === task.id) {
        state.selectedTaskId = state.tasks[0]?.id ?? null;
      }
      renderTasks();
      updateDetailPanel();
    });

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
  delete taskForm.dataset.editingId;
  taskForm.querySelector('button[type="submit"]').textContent = 'Tambah tugas';
}

function handleSubmit(event) {
  event.preventDefault();
  const value = taskInput.value.trim();

  if (!value) {
    taskInput.focus();
    return;
  }

  const editingId = taskForm.dataset.editingId ? Number(taskForm.dataset.editingId) : null;

  if (editingId) {
    const task = state.tasks.find(item => item.id === editingId);
    if (task) {
      task.title = value;
      task.detail = `Edited task: ${value}`;
    }
  } else {
    const newTask = {
      id: Date.now(),
      title: value,
      completed: false,
      detail: 'Tugas baru ditambahkan dari form.'
    };

    state.tasks.unshift(newTask);
    state.selectedTaskId = newTask.id;
  }

  resetForm();
  renderTasks();
  updateDetailPanel();
}

function toggleTheme() {
  state.darkMode = !state.darkMode;
  document.body.classList.toggle('dark-mode', state.darkMode);
  themeToggle.textContent = state.darkMode ? '☀️ Light' : '🌙 Dark';
  themeToggle.setAttribute('aria-label', state.darkMode ? 'Switch to light mode' : 'Switch to dark mode');
}

loadTasks();
renderTasks();
updateDetailPanel();

taskForm.addEventListener('submit', handleSubmit);
themeToggle.addEventListener('click', toggleTheme);
