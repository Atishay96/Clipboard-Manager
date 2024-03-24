const { app, BrowserWindow, clipboard, remote, screen, Tray } = require('electron');
const path = require('path');

const Store = require('./store/store');
const { initListeners, sendMessage } = require('./ipcMessaging/ipc');

let window;
let tray;

const createWindow = () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  window = new BrowserWindow({
    width: 500,
    height,
    x: width-500,
    y: height,
    resizable: false,
    movable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    autoHideMenuBar: true,
    opacity: 0.8,
    hiddenInMissionControl: true,
    roundedCorners: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  window.setWindowButtonVisibility(false);
  window.webContents.openDevTools({ mode: 'detach' });


  window.loadFile(path.join(__dirname, '../dist/index.html'));
  window.on('blur', () => {
    if (!window.webContents.isDevToolsOpened()) {
      window.hide()
    }
  });
};

const toggleWindow = async () => {
  if (window.isDestroyed()) {
    await createWindow();
    window.show();
    return;
  };

  window.isVisible() ? window.hide() : window.show();
};

const createTray = () => {
  tray = new Tray(path.join(__dirname, '../assets/clipboard-icon.png'));
  tray.on('click', (event) => {
    toggleWindow(tray);
  });

  tray.setToolTip('Clipboard Mananger');
};

const connectToStore = () => {
  const store = new Store();
  return store;
};

const startListeningToClipboard = (store) => {
  setInterval(() => {
      const clipboardText = clipboard.readText();
      if (store.getLastItem() !== clipboardText) {
        const entry = store.insert(clipboardText);
        if (entry) {
          sendMessage(window, 'entryAdded', entry);
        }
      }
    }, 500);
};

const init = async () => {
  await createWindow();
  createTray();
  const store = connectToStore();
  await initListeners(store, window);
  await startListeningToClipboard(store);
}

app.whenReady().then(init);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (window === null || window.isDestroyed()) createWindow();
});
