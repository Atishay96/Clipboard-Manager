const { clipboard } = require('electron');
const requestHistoryListenerHandler = (store, window) => {
    return async (event) => {
        const history = await store.getList(); 
        window.webContents.send('updatedHistory', history);
    };
};

const copyToClipboardListenerHandler = (store, window) => {
    return async (event, data, index) => {
        store.remove(index);
        window.webContents.send('entryRemoved', index);
        clipboard.writeText(data.value);
    };
};

const deleteEntryHandeler = (store, window) => {
    return async (event, index) => {
        store.remove(index);
        window.webContents.send('entryRemoved', index);
    };
}

module.exports = {
    requestHistoryListenerHandler,
    copyToClipboardListenerHandler,
    deleteEntryHandeler,
};
