const { app, clipboard, Tray } = require('electron');
const path = require('path');

const Store = require('./store/store');
const { initListeners, sendMessage } = require('./ipcMessaging/ipc');
const { registerShortcuts } = require('./shortcuts/shortcuts');
const { createWindow, toggleWindow } = require('./window');

let window;
let tray;

const createTray = () => {
  tray = new Tray(path.join(__dirname, '../assets/clipboard-icon.png'));
  tray.on('click', (event) => {
    toggleWindow(window);
  });

  tray.setToolTip('Clipboard Mananger');
};

const connectToStore = () => {
  const store = new Store();
  return store;
};

const fetchAndUpdateClipboard = (store) => {
  return (key) => {
    const history = store.getList();
    if (history[key]) {
      clipboard.writeText(history[key].value);
      store.remove(key);

      sendMessage(window, 'entryRemoved', key);
    }
  };
}

const startListeningToClipboard = (store, window) => {
  setInterval(() => {
    const clipboardText = clipboard.readText();
    if (store.getLatestItem() !== clipboardText) {
      const entry = store.insert(clipboardText);
      if (entry) {
        sendMessage(window, 'entryAdded', entry);
      }
    }
  }, 500);
};

const init = async () => {
  const isPrimaryInstance = app.requestSingleInstanceLock('clipboard-manager');
  if (!isPrimaryInstance) process.exit(0);

  window = await createWindow();
  createTray();
  const store = connectToStore();
  await initListeners(store, window);
  registerShortcuts(window, fetchAndUpdateClipboard(store));
  await startListeningToClipboard(store, window);
}

app.whenReady().then(init);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (window === null || window.isDestroyed()) createWindow();
});
