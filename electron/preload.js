const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
    requestHistory: () => {
        return new Promise((resolve, reject) => {
            ipcRenderer.send('requestHistory')
            ipcRenderer.once('updatedHistory', (e, data) => resolve(data));
        });
    },
    entryAdded: (callback) => {
        ipcRenderer.on('entryAdded', (e, data) => callback(data));
    },
    copyToClipboard: (data) => {
        ipcRenderer.send('copyToClipboard', data);
    },
});
