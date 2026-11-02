const STORAGE_KEY = 'todo-saskara-offline-tasks-v1';
const taskForm = document.getElementById('taskForm');
const taskTitleInput = document.getElementById('taskTitle');
const taskDescriptionInput = document.getElementById('taskDescription');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const connectionStatus = document.getElementById('connectionStatus');
const saveStatus = document.getElementById('saveStatus');
const onlineAppLink = document.getElementById('onlineAppLink');

let tasks = [];

try {
  const storedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (Array.isArray(storedTasks)) {
    tasks = storedTasks.filter((task) => (
      task
      && typeof task.id === 'string'
      && typeof task.title === 'string'
      && typeof task.completed === 'boolean'
    ));
  }
} catch (error) {
  console.error('Data tugas offline tidak dapat dibaca:', error);
  saveStatus.textContent = 'Data tugas lokal tidak dapat dibaca. Penyimpanan baru mungkin tidak dapat digunakan.';
}

function persistTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    saveStatus.textContent = 'Tersimpan di perangkat ini.';
    return true;
  } catch (error) {
    console.error('Data tugas offline tidak dapat disimpan:', error);
    saveStatus.textContent = 'Gagal menyimpan tugas. Periksa ruang penyimpanan browser.';
    return false;
  }
}

function renderTasks() {
  taskList.replaceChildren();

  if (tasks.length === 0) {
    const emptyState = document.createElement('li');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'Belum ada tugas offline. Tambahkan tugas di bawah.';
    taskList.appendChild(emptyState);
  }

  tasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = `task-row${task.completed ? ' completed' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.className = 'task-toggle';
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Tandai selesai: ${task.title}`);
    checkbox.addEventListener('change', () => {
      task.completed = checkbox.checked;
      persistTasks();
      renderTasks();
    });

    if (task.editing) {
      const editForm = document.createElement('form');
      editForm.className = 'task-edit-form';

      const titleLabel = document.createElement('label');
      titleLabel.textContent = 'Nama tugas';
      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.maxLength = 160;
      titleInput.value = task.title;
      titleInput.required = true;
      titleInput.setAttribute('aria-label', 'Nama tugas');

      const descriptionLabel = document.createElement('label');
      descriptionLabel.textContent = 'Catatan';
      const descriptionInput = document.createElement('textarea');
      descriptionInput.maxLength = 1000;
      descriptionInput.rows = 2;
      descriptionInput.value = task.description || '';
      descriptionInput.setAttribute('aria-label', 'Catatan');

      const saveButton = document.createElement('button');
      saveButton.className = 'task-action';
      saveButton.type = 'submit';
      saveButton.textContent = 'Simpan';

      const cancelButton = document.createElement('button');
      cancelButton.className = 'task-action';
      cancelButton.type = 'button';
      cancelButton.textContent = 'Batal';
      cancelButton.addEventListener('click', () => {
        delete task.editing;
        renderTasks();
      });

      editForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const title = titleInput.value.trim();
        if (!title) {
          titleInput.focus();
          return;
        }

        task.title = title.slice(0, 160);
        task.description = descriptionInput.value.trim().slice(0, 1000);
        delete task.editing;
        persistTasks();
        renderTasks();
      });

      editForm.append(
        titleLabel,
        titleInput,
        descriptionLabel,
        descriptionInput,
        saveButton,
        cancelButton
      );
      item.append(checkbox, editForm);
      taskList.appendChild(item);
      titleInput.focus();
      return;
    }

    const copy = document.createElement('div');
    copy.className = 'task-copy';
    const title = document.createElement('strong');
    title.textContent = task.title;
    copy.appendChild(title);

    if (task.description) {
      const description = document.createElement('p');
      description.textContent = task.description;
      copy.appendChild(description);
    }

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editButton = document.createElement('button');
    editButton.className = 'task-action';
    editButton.type = 'button';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => {
      task.editing = true;
      renderTasks();
    });

    const deleteButton = document.createElement('button');
    deleteButton.className = 'task-action delete-task';
    deleteButton.type = 'button';
    deleteButton.textContent = 'Hapus';
    deleteButton.addEventListener('click', () => {
      if (!window.confirm(`Hapus tugas "${task.title}" dari perangkat ini?`)) {
        return;
      }

      tasks = tasks.filter((candidate) => candidate.id !== task.id);
      persistTasks();
      renderTasks();
    });

    actions.append(editButton, deleteButton);
    item.append(checkbox, copy, actions);
    taskList.appendChild(item);
  });

  taskCount.textContent = `${tasks.length} tugas`;
}

function updateConnectionStatus() {
  const isOnline = navigator.onLine;
  const isFallback = window.location.pathname.toLowerCase().endsWith('/index.php');
  connectionStatus.textContent = isFallback
    ? 'Navigasi gagal mencapai aplikasi online. Halaman fallback aktif; tugas di sini tetap hanya tersimpan di perangkat.'
    : isOnline
    ? 'Mode lokal aktif. Browser mendeteksi koneksi, tetapi tugas di halaman ini tetap hanya tersimpan di perangkat.'
    : 'Anda sedang offline. Tugas dapat ditambah, diedit, diselesaikan, dan dihapus pada perangkat ini.';
  onlineAppLink.hidden = !isOnline;
}

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = taskTitleInput.value.trim();
  if (!title) {
    taskTitleInput.focus();
    return;
  }

  const id = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  tasks.unshift({
    id,
    title: title.slice(0, 160),
    description: taskDescriptionInput.value.trim().slice(0, 1000),
    completed: false
  });

  if (persistTasks()) {
    taskForm.reset();
    renderTasks();
    taskTitleInput.focus();
  }
});

window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);
updateConnectionStatus();
renderTasks();
