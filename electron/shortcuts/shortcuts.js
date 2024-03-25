const { globalShortcut } = require('electron');
const keys = require('./keys');

const copyKeys = [
    keys.option1,
    keys.option2,
    keys.option3,
    keys.option4,
    keys.option5,
    keys.option6,
    keys.option7,
    keys.option8,
    keys.option9,
];

const registerShortcuts = (window, fetchAndUpdateClipboard) => {
    registerToggleAppVisibilityShortcut(window);
    window.mainWindow.on('show', () => {
        registerCopySelectedItemShortcut(fetchAndUpdateClipboard);
        registerEscapeShortcut(window);
    });

    window.mainWindow.on('hide', () => {
        unregisterCopySelectedItemShortcut();
        unregisterEscapeShortcut(window);
    });

    window.mainWindow.on('close', () => {
        unregisterCopySelectedItemShortcut();
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

const registerCopySelectedItemShortcut = (fetchAndUpdateClipboard) => {
    let isBlocked = false;
    copyKeys.forEach((key, index) => {
        globalShortcut.register(key, () => {
            if (isBlocked) {
                return;
            }
            isBlocked = true;
            fetchAndUpdateClipboard(index);
            setTimeout(() => {
                isBlocked = false;
            }, 1000);
        });
    });
};

const unregisterCopySelectedItemShortcut = () => {
    copyKeys.forEach(key => {
        try {
            globalShortcut.unregister(key);
        } catch(error) {
            console.error('Error while unregistering shortcut:', error);
        }
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
