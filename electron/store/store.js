const { app, remote } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require("os");

/**
 * Store data format
 *  ItemList[]
 *
 *  ItemList: {
 *    id: String (unique identifier),
 *    date: Date,
 *    value: String
 *  }
 */
class Store {
  constructor(opts = {}) {
    if (!opts.configName) opts.configName = 'clipboard-config';
    if (!opts.historyFileName) opts.historyFileName = 'clipboard-history';

    const userDataPath = (app || remote.app).getPath('userData');
    console.log('File stored at', userDataPath);

    this.lastCopiedItem = opts.lastCopiedItem || null;
    this.path = path.join(userDataPath, opts.historyFileName);
    this.configPath = path.join(userDataPath, opts.configName);

    this.store = this.parseStore() || [];
    this._repearJob();
    
    // Operation queue to prevent concurrent file writes
    this._operationQueue = [];
    this._isProcessingQueue = false;
    this._isManualCopyInProgress = false;
  }

  /**
   * Cleanup job logic
   * 1. Get config with retention days setting
   * 2. Remove entries older than the configured retention period
   * 3. Update file using fs
   * 4. Update the last updated date
   * 5. Schedule the job to run after 1 day
   */
  _repearJob() {
    let configFileData;
    const ONE_DAY = 1000 * 60 * 60 * 24;
    try {
      configFileData = fs.readFileSync(this.configPath, 'utf-8');
    } catch (error) {}
    let config;
    if (!configFileData) {
      config = this.getDefaultConfig();
    } else {
      config = JSON.parse(configFileData);
    }

    // Always run cleanup on startup and then schedule next run
    this._removeOldEntries(config);

    // Schedule next cleanup job to run after 1 day
    setTimeout(() => {
      this._repearJob();
    }, ONE_DAY);
  }

  _removeOldEntries(config) {
    // Get retention days from config, default to 30 days
    const retentionDays = config.retentionDays || 30;
    const deleteEntriesBeforeDate = new Date();
    deleteEntriesBeforeDate.setDate(deleteEntriesBeforeDate.getDate() - retentionDays);
    
    const currentStoreLength = this.store.length;
    
    // Filter out items older than retention period
    // Ensure date is properly parsed (handle both Date objects and date strings)
    const store = this.store.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate > deleteEntriesBeforeDate;
    });

    // If no changes, don't update anything
    if (currentStoreLength === store.length) {
      // Still update lastUpdatedAt to track when cleanup last ran
      config.lastUpdatedAt = new Date();
      fs.writeFileSync(this.configPath, JSON.stringify(config), 'utf-8');
      return;
    }

    console.log(`Cleaned up ${currentStoreLength - store.length} old entries (older than ${retentionDays} days)`);
    this.store = store;
    this._parseAndRewriteFile();
    config.lastUpdatedAt = new Date();
    fs.writeFileSync(this.configPath, JSON.stringify(config), 'utf-8');
  }

  getLatestItem() {
    return this.lastCopiedItem;
  }

  getFirstItem() {
    return this.store.length && this.store[0].value || null;
  }

  getList() {
    // Return a deep copy using JSON serialization to ensure complete isolation
    // This prevents any reference sharing issues
    return JSON.parse(JSON.stringify(this.store)).map(item => ({
      id: item.id || this._generateId(), // Ensure ID exists for backward compatibility
      date: new Date(item.date),
      value: String(item.value) // Ensure value is a string
    }));
  }

  _generateId() {
    // Generate a unique ID using timestamp and random number
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  insert(value) {
    if (value === '' || value === undefined || value === null) return;
    
    // If manual copy is in progress, don't insert (prevents clipboard monitoring interference)
    if (this._isManualCopyInProgress) {
      return null;
    }
    
    const item = {
      id: this._generateId(),
      date: new Date(),
      value,
    };
    this.lastCopiedItem = value;
    this.store.unshift(item);
    /**
      * Syncronous file read is intentional as we don't want to lose any data
    **/
    fs.appendFileSync(this.path, JSON.stringify(item) + os.EOL, 'utf-8');
    return item;
  }

  _parseAndRewriteFile() {
    const fileData = this.store.map((v) => JSON.stringify(v) + os.EOL);
    fs.writeFileSync(this.path, fileData.reverse().join(''), 'utf-8');
  }

  // Queue operations to prevent concurrent file writes
  async _queueOperation(operation) {
    return new Promise((resolve, reject) => {
      this._operationQueue.push({ operation, resolve, reject });
      this._processQueue();
    });
  }

  async _processQueue() {
    if (this._isProcessingQueue || this._operationQueue.length === 0) {
      return;
    }

    this._isProcessingQueue = true;

    while (this._operationQueue.length > 0) {
      const { operation, resolve, reject } = this._operationQueue.shift();
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this._isProcessingQueue = false;
  }

  setManualCopyInProgress(flag) {
    this._isManualCopyInProgress = flag;
  }

  isManualCopyInProgress() {
    return this._isManualCopyInProgress;
  }

  remove(index = 0, currentClipboardText) {
    if (index >= this.store.length) return;
    if (index === 0) {
      this.lastCopiedItem = currentClipboardText;
    }
    this.store.splice(index, 1);

    // TODO: Consider using truncate instead of rewriting the file
    this._parseAndRewriteFile();
  }

  async removeById(id, currentClipboardText) {
    return this._queueOperation(async () => {
      const index = this.store.findIndex(item => item.id === id);
      if (index === -1) return false;
      if (index === 0) {
        this.lastCopiedItem = currentClipboardText;
      }
      this.store.splice(index, 1);
      this._parseAndRewriteFile();
      return true;
    });
  }

  findById(id) {
    return this.store.find(item => item.id === id);
  }

  findIndexById(id) {
    return this.store.findIndex(item => item.id === id);
  }

  parseStore() {
    try {
      const store = [];
      const fileContent = fs.readFileSync(this.path, 'utf-8');
      if (!fileContent) return [];
      
      fileContent.split(/\r?\n/).forEach(line => {
        if (line.trim().length) {
          try {
            const item = JSON.parse(line);
            // Ensure backward compatibility: add ID if missing
            if (!item.id) {
              item.id = this._generateId();
            }
            store.push(item);
          } catch (parseError) {
            console.error('Error parsing line in store:', line, parseError);
            // Skip malformed lines instead of crashing
          }
        }
      });
      return store.reverse();
    } catch(error) {
      console.error('Error parsing store', error);
      return null;
    }
  }

  getDefaultConfig() {
    return {
      lastUpdatedAt: new Date(),
      retentionDays: 30, // Default: delete items older than 30 days
    };
  }

  /**
   * Set the retention period in days
   * @param {number} days - Number of days to keep items (default: 30)
   */
  setRetentionDays(days) {
    let configFileData;
    try {
      configFileData = fs.readFileSync(this.configPath, 'utf-8');
    } catch (error) {}
    let config;
    if (!configFileData) {
      config = this.getDefaultConfig();
    } else {
      config = JSON.parse(configFileData);
    }
    config.retentionDays = Math.max(1, Math.floor(days)); // Ensure at least 1 day
    fs.writeFileSync(this.configPath, JSON.stringify(config), 'utf-8');
    // Trigger immediate cleanup with new retention period
    this._removeOldEntries(config);
  }

  /**
   * Get the current retention period in days
   * @returns {number} Number of days items are kept
   */
  getRetentionDays() {
    let configFileData;
    try {
      configFileData = fs.readFileSync(this.configPath, 'utf-8');
    } catch (error) {}
    let config;
    if (!configFileData) {
      config = this.getDefaultConfig();
    } else {
      config = JSON.parse(configFileData);
    }
    return config.retentionDays || 30;
  }
}
  
module.exports = Store;