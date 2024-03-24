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

/**
 * TODO: Add repear method to remove old data
*/
class Store {
  constructor(opts = {}) {
    if (!opts.configName) opts.configName = 'clipboard-history';

    const userDataPath = (app || remote.app).getPath('userData');
    this.path = path.join(userDataPath, opts.configName);
    console.log('File stored at', userDataPath);

    this.store = this.parseStore() || [];
  }

  getLastItem() {
    return this.store?.length ? this.store[0].value : null;
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
    this.store.unshift(item);
    /**
      * Syncronous file read is intentional as we don't want to lose any data
    **/
    fs.appendFileSync(this.path, JSON.stringify(item) + os.EOL, 'utf-8');
    return item;
  }

  parseStore() {
    try {
      const store = [];
      fs.readFileSync(this.path, 'utf-8')?.split?.(/\r?\n/)?.map?.(line => {
        try {
          if (line.length) {
            store.push(JSON.parse(line));
          }
        } catch (error) {
          console.error('Error parsing store', error, line);
        }
      });
      return store.reverse();
    } catch(error) {
      console.error('Error parsing store', error);
      return null;
    }
  }
}
  
module.exports = Store;