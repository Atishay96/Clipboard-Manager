const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
    requestHistory: () => {
        return new Promise((resolve, reject) => {
            ipcRenderer.send('requestHistory');
            ipcRenderer.once('updatedHistory', (e, data) => resolve(data));
        });
    },
    entryAdded: (callback) => {
        ipcRenderer.on('entryAdded', (e, data) => callback(data));
    },
    entryRemoved: (callback) => {
        ipcRenderer.on('entryRemoved', (e, data) => callback(data));
    },
    updatedHistory: (callback) => {
        ipcRenderer.on('updatedHistory', (e, data) => callback(data));
    },
    deleteEntry: (index) => {
        ipcRenderer.send('deleteEntry', index);
    },
    copyToClipboard: (historyItem, index) => {
        ipcRenderer.send('copyToClipboard', historyItem, index);
    },
    showCopiedText: (callback) => {
        ipcRenderer.on('showCopiedText', () => callback());
    },
    notifyReady: () => {
        ipcRenderer.send('reactReady');
    }
});
