const { app, remote } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require("os");

/**
 * Store data format
 *  ItemList[]
 *
 *  ItemList: {
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
  }

  /**
   * Repear logic
   * 1. Get last updated date from config
   * 2. If difference is more than 1 day, execute the job
   * 3. Remove entries older than the last updated date from the store
   * 4. Update file using fs
   * 5. Update the last updated date
   * 6. Schedule the job to run after 1 day
   */
  _repearJob() {
    let configFileData;
    const ONE_DAY = 1000;
    try {
      configFileData = fs.readFileSync(this.configPath, 'utf-8');
    } catch (error) {}
    let config;
    if (!configFileData) {
      config = this.getDefaultConfig();
    } else {
      config = JSON.parse(configFileData);
    }

    const lastUpdatedAt = new Date(config.lastUpdatedAt);
    if ((new Date()).getTime() - lastUpdatedAt.getTime() <= ONE_DAY) {
      this._removeOldEntries(config, lastUpdatedAt);
      setTimeout(() => {
        this._repearJob();
      }, ONE_DAY);
    }
  }

  _removeOldEntries(config, lastUpdatedAt) {
    const store = this.store.filter((item) => new Date(item.date) > lastUpdatedAt);
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
    return this.store;
  }

  insert(value) {
    if (value === '' || value === undefined || value === null) return;
    const item = {
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

  remove(index = 0, currentClipboardText) {
    if (index >= this.store.length) return;
    if (index === 0) {
      this.lastCopiedItem = currentClipboardText;
    }
    this.store.splice(index, 1);

    // TODO: Consider using truncate instead of rewriting the file
    this._parseAndRewriteFile();
  }

  parseStore() {
    try {
      const store = [];
      fs.readFileSync(this.path, 'utf-8')?.split?.(/\r?\n/)?.map?.(line => {
        if (line.length) {
          store.push(JSON.parse(line));
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
    };
  }
}
  
module.exports = Store;