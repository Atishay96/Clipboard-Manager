const { clipboard } = require('electron');
const requestHistoryListenerHandler = (store, window) => {
    return async (event) => {
        const history = await store.getList(); 
        window.webContents.send('updatedHistory', history);
    };
};

const copyToClipboardListenerHandler = (store, window) => {
    return async (event, data) => {
        clipboard.writeText(data);
    };
}

module.exports = {
    requestHistoryListenerHandler,
    copyToClipboardListenerHandler,
};
