const { ipcMain } = require('electron');

const { requestHistoryListenerHandler, copyToClipboardListenerHandler, deleteEntryHandler } = require('./listeners');

const initListeners = (store, window) => {
    ipcMain.on('requestHistory', requestHistoryListenerHandler(store, window));
    ipcMain.on('copyToClipboard', copyToClipboardListenerHandler(store, window));
    ipcMain.on('deleteEntry', deleteEntryHandler(store, window));
};

const sendMessage = (window, channel, data) => {
    try {
        if (!window?.mainWindow?.webContents) return;
        window.mainWindow.webContents.send(channel, data);
    } catch(error) {
        console.error('Error sending message:', error);
    }
}

module.exports = {
    initListeners,
    sendMessage,
};
