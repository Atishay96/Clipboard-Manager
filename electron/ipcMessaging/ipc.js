const { ipcMain } = require('electron');

const { requestHistoryListenerHandler, copyToClipboardListenerHandler, deleteEntryHandeler } = require('./listeners');

const initListeners = (store, window) => {
    ipcMain.on('requestHistory', requestHistoryListenerHandler(store, window));
    ipcMain.on('copyToClipboard', copyToClipboardListenerHandler(store, window));
    ipcMain.on('deleteEntry', deleteEntryHandeler(store, window));
};

const sendMessage = (window, channel, data) => {
    window.webContents.send(channel, data);
}

module.exports = {
    initListeners,
    sendMessage,
};
