const { clipboard } = require('electron');
const requestHistoryListenerHandler = (store, window) => {
    return async (event) => {
        const history = await store.getList(); 
        window.mainWindow.webContents.send('updatedHistory', history);
    };
};

const copyToClipboardListenerHandler = (store, window) => {
    return async (event, data, index) => {
        if (index === 0) {
            clipboard.writeText(data.value);
            return;
        }
        store.remove(index);
        window.mainWindow.webContents.send('entryRemoved', index);
        clipboard.writeText(data.value);
    };
};

const deleteEntryHandler = (store, window) => {
    return async (event, index) => {
        store.remove(index, clipboard.readText());
        window.mainWindow.webContents.send('entryRemoved', index);
    };
}

module.exports = {
    requestHistoryListenerHandler,
    copyToClipboardListenerHandler,
    deleteEntryHandler,
};
