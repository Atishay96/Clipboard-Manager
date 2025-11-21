const { app, clipboard, Menu, Tray, ipcMain } = require('electron');
const path = require('path');

const Store = require('./store/store');
const { initListeners, sendMessage } = require('./ipcMessaging/ipc');
const { registerShortcuts } = require('./shortcuts/shortcuts');
const Window = require('./window');

let window;
let tray;
let store;
let clipboardMonitoringStarted = false;
let clipboardInterval = null;

const createTray = () => {
  tray = new Tray(path.join(__dirname, '../assets/clipboard-icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Toggle', type: 'normal', click: () => { window?.toggleWindow() } },
    { label: 'Exit', type: 'normal', role: 'quit' },
  ])

  tray.setToolTip('Clipboard Manager');
  tray.setContextMenu(contextMenu);
};

const connectToStore = () => {
  const store = new Store({
    lastCopiedItem: clipboard.readText(),
  });
  return store;
};

const startListeningToClipboard = (store, window) => {
  // Clear any existing interval
  if (clipboardInterval) {
    clearInterval(clipboardInterval);
  }
  clipboardInterval = setInterval(() => {
    const clipboardText = clipboard.readText();
    if (store.getLatestItem() !== clipboardText) {
      const entry = store.insert(clipboardText);
      if (entry) {
        sendMessage(window, 'entryAdded', entry);
      }
    }
  }, 500);
};

const startClipboardMonitoringWhenReady = () => {
  if (!clipboardMonitoringStarted && store && window) {
    startListeningToClipboard(store, window);
    clipboardMonitoringStarted = true;
  }
};

const init = async () => {
  const isPrimaryInstance = app.requestSingleInstanceLock('clipboard-manager');
  if (!isPrimaryInstance) process.exit(0);

  if (process.platform === 'darwin') app.dock.hide();

  window = new Window();
  window.createWindow();
  createTray(window);
  store = connectToStore();
  await initListeners(store, window);
  registerShortcuts(window);
  
  // Listen for React ready signal (use 'on' instead of 'once' to handle window recreation)
  ipcMain.on('reactReady', () => {
    startClipboardMonitoringWhenReady();
  });
  
  // Fallback: start after page loads if React doesn't send ready signal
  window.mainWindow.webContents.once('did-finish-load', () => {
    setTimeout(() => {
      startClipboardMonitoringWhenReady();
    }, 1500);
  });
}

app.whenReady().then(init);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
