const { BrowserWindow, screen } = require('electron');
const path = require('path');

const createWindow = () => {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    const WIN_WIDTH = 500;

    const window = new BrowserWindow({
        width: WIN_WIDTH,
        height,
        x: width,
        y: height,
        resizable: false,
        movable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        autoHideMenuBar: true,
        opacity: 0.8,
        roundedCorners: true,
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
    });
    window.webContents.openDevTools();
    window.hide();

    window.loadFile(path.join(__dirname, '../dist/index.html'));
    window.on('blur', () => {
        if (!window.webContents.isDevToolsOpened()) {
            window.hide()
        }
    });

    window.on('show', () => {
        window.setPosition(width - WIN_WIDTH, 0, true);
    });

    window.on('hide', () => {
        window.setPosition(width - WIN_WIDTH, 0, true);
    });

    return window;
};

const showWindow = (window) => {
    window.show();
};

const hideWindow = (window) => {
    window.hide();
};

const toggleWindow = async (window) => {
    if (window.isDestroyed()) {
        await createWindow();
        showWindow(window);
        return;
    };

    window.isVisible() ? hideWindow(window) : showWindow(window);
};

module.exports = {
    createWindow,
    toggleWindow,
};