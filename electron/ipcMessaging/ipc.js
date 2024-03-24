const { ipcMain } = require('electron');

const { requestHistoryListenerHandler, copyToClipboardListenerHandler } = require('./listeners');

const initListeners = (store, window) => {
    ipcMain.on('requestHistory', requestHistoryListenerHandler(store, window));
    ipcMain.on('copyToClipboard', copyToClipboardListenerHandler(store, window));
};

const sendMessage = (window, channel, data) => {
    window.webContents.send(channel, data);
}

module.exports = {
    initListeners,
    sendMessage,
};
