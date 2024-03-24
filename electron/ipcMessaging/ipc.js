const { ipcMain } = require('electron');

const { requestHistoryListenerHandler, copyToClipboardListenerHandler, deleteEntryHandler } = require('./listeners');

const initListeners = (store, window) => {
    ipcMain.on('requestHistory', requestHistoryListenerHandler(store, window));
    ipcMain.on('copyToClipboard', copyToClipboardListenerHandler(store, window));
    ipcMain.on('deleteEntry', deleteEntryHandler(store, window));
};

const sendMessage = (window, channel, data) => {
    window.mainWindow.webContents.send(channel, data);
}

module.exports = {
    initListeners,
    sendMessage,
};
