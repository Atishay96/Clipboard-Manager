const { BrowserWindow, screen, app } = require('electron');
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
            minimizable: false,
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
            if (process.platform === 'darwin') {
                app.hide();
            } else {
                window.hide();
            }
        }
    
        window.loadFile(path.join(__dirname, '../dist/index.html'));
        window.on('blur', () => {
            if (process.platform === 'darwin') {
                app.hide();
            } else {
                window.hide();
            }
        });
    
        window.on('show', () => {
            window.setPosition(width - WIN_WIDTH, 0, true);
        });
    
        window.on('hide', () => {
            window.setPosition(width - WIN_WIDTH, 0, true);
        });

        window.on('close', (event) => {
            try {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    // Window is still valid, allow normal close
                    return;
                }
            } catch (error) {
                // Window might already be destroyed, recreate it
            }
            // Window is destroyed or invalid, recreate it
            this.createWindow(false);
            event.preventDefault();
        });
    
        this.mainWindow = window;
    };
    
    showWindow() {
        if (process.platform === 'darwin') {
            app.show();
        } else {
            this.mainWindow.show();
        }
    };
    
    hideWindow() {
        if (process.platform === 'darwin') {
            app.hide();
        } else {
            this.mainWindow.hide();
        }
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
