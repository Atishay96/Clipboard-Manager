const { BrowserWindow, screen } = require('electron');
const path = require('path');

const createWindow = () => {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    const window = new BrowserWindow({
        width: 500,
        height,
        x: width-500,
        y: height,
        resizable: false,
        movable: false,
        Visible: false,
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
    // window.setWindowButtonVisibility(false);
    // window.webContents.openDevTools({ mode: 'detach' });


    window.loadFile(path.join(__dirname, '../dist/index.html'));
    window.on('blur', () => {
        if (!window.webContents.isDevToolsOpened()) {
            window.hide()
        }
    });

    return window;
};

const toggleWindow = async (window) => {
    if (window.isDestroyed()) {
        await createWindow();
        window.show();
        return;
    };

    window.isVisible() ? window.hide() : window.show();
};

module.exports = {
    createWindow,
    toggleWindow,
};