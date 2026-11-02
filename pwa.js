const installButton = document.getElementById('installApp');
let installPrompt = null;

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener('click', async () => {
  if (!installPrompt) {
    return;
  }

  try {
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installButton.hidden = true;
  } catch (error) {
    console.error('Instalasi aplikasi gagal dimulai:', error);
  }
});

window.addEventListener('appinstalled', () => {
  installPrompt = null;
  installButton.hidden = true;
});

window.addEventListener('offline', () => {
  if (!window.location.pathname.toLowerCase().endsWith('/offline.html')) {
    window.location.replace('./offline.html');
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch((error) => {
    console.error('Service worker gagal didaftarkan:', error);
  });
}
