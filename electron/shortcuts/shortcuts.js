const { globalShortcut } = require('electron');
const keys = require('./keys');
const { toggleWindow } = require('../window');

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
    window.on('show', () => {
        registerCopySelectedItemShortcut(fetchAndUpdateClipboard);
    });

    window.on('hide', () => {
        unregisterCopySelectedItemShortcut();
    });
};

const registerToggleAppVisibilityShortcut = (window) => {
    if (globalShortcut.isRegistered(keys.toggleAppVisibility)) {
        console.error(`Error: ${keys.toggleAppVisibility} is already registered.`);
        return;
    }

    globalShortcut.register(keys.toggleAppVisibility, () => {
        toggleWindow(window);
    });
};

const registerCopySelectedItemShortcut = (fetchAndUpdateClipboard) => {
    copyKeys.forEach((key, index) => {
        globalShortcut.register(key, () => {
            fetchAndUpdateClipboard(index);
        });
    });
}

const unregisterCopySelectedItemShortcut = () => {
    copyKeys.forEach(key => {
        globalShortcut.unregister(key);
    });
}

module.exports = {
    registerShortcuts,
};
