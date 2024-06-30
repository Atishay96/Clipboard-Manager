const { app, clipboard, Menu, Tray } = require('electron');
const path = require('path');

const Store = require('./store/store');
const { initListeners, sendMessage } = require('./ipcMessaging/ipc');
const { registerShortcuts } = require('./shortcuts/shortcuts');
const Window = require('./window');

let window;
let tray;

const createTray = () => {
  tray = new Tray(path.join(__dirname, '../assets/clipboard-icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Toggle', type: 'normal', click: () => { window?.toggleWindow() } },
    { label: 'Exit', type: 'normal', role: 'quit' },
  ])

  tray.setToolTip('Clipboard Mananger');
  tray.setContextMenu(contextMenu);
};

const connectToStore = () => {
  const store = new Store({
    lastCopiedItem: clipboard.readText(),
  });
  return store;
};

const startListeningToClipboard = (store, window) => {
  setInterval(() => {
    const clipboardText = clipboard.readText();
    if (store.getLatestItem() !== clipboardText && store.getFirstItem() !== clipboardText) {
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

  if (process.platform === 'darwin') app.dock.hide();

  window = new Window();
  window.createWindow();
  createTray(window);
  const store = connectToStore();
  await initListeners(store, window);
  registerShortcuts(window);
  await startListeningToClipboard(store, window);
}

app.whenReady().then(init);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
