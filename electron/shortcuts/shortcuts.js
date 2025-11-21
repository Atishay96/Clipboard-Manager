const { globalShortcut } = require('electron');
const keys = require('./keys');

const registerShortcuts = (window) => {
    registerToggleAppVisibilityShortcut(window);
    window.mainWindow.on('show', () => {
        registerEscapeShortcut(window);
    });

    window.mainWindow.on('hide', () => {
        unregisterEscapeShortcut(window);
    });

    window.mainWindow.on('close', () => {
        unregisterEscapeShortcut();
    });
};

const registerToggleAppVisibilityShortcut = (window) => {
    if (globalShortcut.isRegistered(keys.toggleAppVisibility)) {
        console.error(`Error: ${keys.toggleAppVisibility} is already registered.`);
        return;
    }

    globalShortcut.register(keys.toggleAppVisibility, () => {
        window.toggleWindow();
    });
};

const registerEscapeShortcut = (window) => {
    globalShortcut.register(keys.escape, () => {
        if (window?.mainWindow && !window.mainWindow.isDestroyed()) {
            window.hideWindow();
        }
    });
};

const unregisterEscapeShortcut = () => {
    try {
        globalShortcut.unregister(keys.escape);
    } catch(error) {
        console.error('Error while unregistering shortcut:', error);
    }
};

module.exports = {
    registerShortcuts,
};
