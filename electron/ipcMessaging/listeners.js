const { clipboard } = require('electron');
const requestHistoryListenerHandler = (store, window) => {
    return async (event) => {
        // getList already returns a deep copy, so this is safe
        const history = store.getList();
        // Double-check: serialize and deserialize to ensure clean data
        const cleanHistory = JSON.parse(JSON.stringify(history));
        window.mainWindow.webContents.send('updatedHistory', cleanHistory);
    };
};

const copyToClipboardListenerHandler = (store, window) => {
    return async (event, data, index) => {
        // Validate index
        if (index < 0 || index >= store.store.length) {
            console.error(`Invalid index ${index} for store length ${store.store.length}`);
            return;
        }
        
        // Get the item directly from the store to avoid any data corruption issues
        // Don't trust the data sent from UI - use the store as source of truth
        const storeItem = store.store[index];
        if (!storeItem) {
            console.error(`No item found at index ${index}`);
            return;
        }
        
        // Get the value - handle both string and object formats
        let valueToCopy;
        if (typeof storeItem.value === 'string') {
            valueToCopy = storeItem.value;
        } else if (storeItem.value && typeof storeItem.value === 'object') {
            // If value is an object, try to stringify it
            valueToCopy = JSON.stringify(storeItem.value);
        } else {
            valueToCopy = String(storeItem.value || '');
        }
        
        // Ensure it's a non-empty string
        if (!valueToCopy || valueToCopy.trim() === '') {
            console.error(`Empty value at index ${index}`);
            return;
        }
        
        // Update lastCopiedItem BEFORE writing to clipboard to prevent
        // clipboard monitoring from re-adding it as a new entry
        // Use a small delay to ensure the flag is set before clipboard write
        store.lastCopiedItem = valueToCopy;
        
        // Write to clipboard FIRST before any store modifications
        // This ensures the clipboard has the correct value immediately
        // Use synchronous write to ensure it completes
        try {
            clipboard.writeText(valueToCopy);
            // Verify the write was successful
            const writtenText = clipboard.readText();
            if (writtenText !== valueToCopy) {
                console.error(`Clipboard write failed. Expected: "${valueToCopy}", Got: "${writtenText}"`);
                // Retry once
                clipboard.writeText(valueToCopy);
            }
        } catch (error) {
            console.error('Error writing to clipboard:', error);
            return;
        }
        
        if (index === 0) {
            // Item is already at the top, just update its date to now
            storeItem.date = new Date();
            store._parseAndRewriteFile();
        } else {
            // Move item to the top: remove from current position
            store.store.splice(index, 1);
            
            // Create a completely new item object to avoid any reference issues
            const movedItem = {
                date: new Date(),
                value: valueToCopy, // Use the already-extracted string value
            };
            store.store.unshift(movedItem);
            
            // Rewrite the file with updated order
            store._parseAndRewriteFile();
            
            // Send updated full list to ensure UI is in sync
            // This is more reliable than sending remove + add messages
            const updatedHistory = store.getList();
            // Serialize and deserialize to ensure clean data with no shared references
            const cleanHistory = JSON.parse(JSON.stringify(updatedHistory));
            window.mainWindow.webContents.send('updatedHistory', cleanHistory);
        }
    };
};

const deleteEntryHandler = (store, window) => {
    return async (event, index) => {
        // Validate index
        if (index < 0 || index >= store.store.length) {
            console.error(`Invalid index ${index} for store length ${store.store.length}`);
            return;
        }
        store.remove(index, clipboard.readText());
        // Send updated full list to ensure UI is in sync
        const updatedHistory = store.getList();
        // Serialize and deserialize to ensure clean data with no shared references
        const cleanHistory = JSON.parse(JSON.stringify(updatedHistory));
        window.mainWindow.webContents.send('updatedHistory', cleanHistory);
    };
}

module.exports = {
    requestHistoryListenerHandler,
    copyToClipboardListenerHandler,
    deleteEntryHandler,
};
