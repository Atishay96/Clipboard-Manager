const { BrowserWindow, screen } = require('electron');
const path = require('path');

class Window {
    mainWindow = null;
    createWindow(hideWindow = true) {
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
            frame: false,
            opacity: 0.8,
            roundedCorners: true,
            titleBarStyle: 'hidden',
            webPreferences: {
                nodeIntegration: true,
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
            },
        });
        // window.webContents.openDevTools();
        if (hideWindow) {
            window.hide();
        }
    
        window.loadFile(path.join(__dirname, '../dist/index.html'));
        window.on('blur', () => {
            window.hide()
        });
    
        window.on('show', () => {
            window.setPosition(width - WIN_WIDTH, 0, true);
        });
    
        window.on('hide', () => {
            window.setPosition(width - WIN_WIDTH, 0, true);
        });

        window.on('close', (event) => {
            if (this.mainWindow.isDestroyed()) {
                this.createWindow(false);
                event.preventDefault();
                return;
            }
        });
    
        this.mainWindow = window;
    };
    
    showWindow() {
        this.mainWindow.show();
    };
    
    hideWindow() {
        this.mainWindow.hide();
    };
    
    toggleWindow() {
        if (this.mainWindow.isDestroyed()) {
            this.createWindow(false);
            return;
        }
        this.mainWindow.isVisible() ? this.hideWindow() : this.showWindow();
    };
}

module.exports = Window;
