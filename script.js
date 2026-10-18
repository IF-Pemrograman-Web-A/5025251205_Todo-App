const THEME_KEY = 'todo-saskara-theme';
const themeToggle = document.getElementById('themeToggle');
const notificationsToggle = document.getElementById('enableNotifications');
const imageInput = document.getElementById('taskImage');
const imagePreview = document.getElementById('taskImagePreview');

function applyTheme(isDark) {
  document.body.classList.toggle('dark-mode', isDark);
  themeToggle.textContent = isDark ? '☀️' : '🌙';
  themeToggle.setAttribute('aria-label', isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap');
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
}

applyTheme(localStorage.getItem(THEME_KEY) === 'dark');
themeToggle.addEventListener('click', () => {
  applyTheme(!document.body.classList.contains('dark-mode'));
});

function scheduleReminders() {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  document.querySelectorAll('.task-item[data-reminder-time]').forEach((taskItem) => {
    const [hours, minutes] = taskItem.dataset.reminderTime.split(':').map(Number);
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);
    if (reminderTime <= new Date()) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const taskTitle = taskItem.dataset.taskTitle;
    window.setTimeout(() => {
      new Notification('Pengingat Todo', {
        body: `Waktu tugas "${taskTitle}" sudah tiba.`
      });
    }, reminderTime.getTime() - Date.now());
  });
}

if (!('Notification' in window)) {
  notificationsToggle.hidden = true;
} else if (Notification.permission === 'granted') {
  notificationsToggle.hidden = true;
  scheduleReminders();
} else if (Notification.permission === 'denied') {
  notificationsToggle.textContent = 'Notifikasi diblokir';
  notificationsToggle.disabled = true;
}

notificationsToggle.addEventListener('click', async () => {
  notificationsToggle.disabled = true;
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    notificationsToggle.hidden = true;
    scheduleReminders();
  } else if (permission === 'denied') {
    notificationsToggle.textContent = 'Notifikasi diblokir';
  } else {
    notificationsToggle.disabled = false;
  }
});

imageInput.addEventListener('change', () => {
  const file = imageInput.files?.[0];
  if (!file) {
    imagePreview.removeAttribute('src');
    imagePreview.classList.add('hidden');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    imageInput.value = '';
    imagePreview.removeAttribute('src');
    imagePreview.classList.add('hidden');
    window.alert('Ukuran foto maksimal 5 MB.');
    return;
  }

  imagePreview.src = URL.createObjectURL(file);
  imagePreview.classList.remove('hidden');
});

document.querySelectorAll('form[data-confirm]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    if (!window.confirm(form.dataset.confirm)) {
      event.preventDefault();
    }
  });
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch((error) => {
    console.error('Service worker gagal didaftarkan:', error);
  });
}
