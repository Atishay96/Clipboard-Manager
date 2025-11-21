const Store = require('../store');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Mock Electron app
jest.mock('electron', () => {
  const os = require('os');
  return {
    app: {
      getPath: jest.fn(() => os.tmpdir()),
    },
    remote: null,
  };
});

describe('Store', () => {
  let store;
  let testConfigPath;
  let testHistoryPath;

  beforeEach(() => {
    // Create a unique test directory for each test
    const testDir = path.join(os.tmpdir(), `clipboard-test-${Date.now()}`);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    testConfigPath = path.join(testDir, 'clipboard-config');
    testHistoryPath = path.join(testDir, 'clipboard-history');

    store = new Store({
      configName: 'clipboard-config',
      historyFileName: 'clipboard-history',
      lastCopiedItem: null,
    });
  });

  afterEach(() => {
    // Clean up test files
    try {
      if (fs.existsSync(store.path)) {
        fs.unlinkSync(store.path);
      }
      if (fs.existsSync(store.configPath)) {
        fs.unlinkSync(store.configPath);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('insert', () => {
    test('should insert a new item', () => {
      const item = store.insert('test value');
      expect(item).toBeDefined();
      expect(item.value).toBe('test value');
      expect(item.date).toBeInstanceOf(Date);
    });

    test('should not insert empty values', () => {
      expect(store.insert('')).toBeUndefined();
      expect(store.insert(null)).toBeUndefined();
      expect(store.insert(undefined)).toBeUndefined();
    });

    test('should update lastCopiedItem', () => {
      store.insert('test');
      expect(store.getLatestItem()).toBe('test');
    });

    test('should add item to the top of the list', () => {
      store.insert('first');
      store.insert('second');
      const list = store.getList();
      expect(list[0].value).toBe('second');
      expect(list[1].value).toBe('first');
    });
  });

  describe('getList', () => {
    test('should return a deep copy of items', () => {
      store.insert('test1');
      store.insert('test2');
      const list1 = store.getList();
      const list2 = store.getList();
      
      // Should be different array references
      expect(list1).not.toBe(list2);
      // But should have same content
      expect(list1.length).toBe(list2.length);
      // Items should be different object references
      expect(list1[0]).not.toBe(list2[0]);
    });

    test('should return items with proper structure', () => {
      store.insert('test');
      const list = store.getList();
      expect(list[0]).toHaveProperty('date');
      expect(list[0]).toHaveProperty('value');
      expect(list[0].value).toBe('test');
      expect(list[0].date).toBeInstanceOf(Date);
    });
  });

  describe('remove', () => {
    test('should remove item at given index', () => {
      store.insert('first');
      store.insert('second');
      store.insert('third');
      
      const initialLength = store.getList().length;
      store.remove(1, 'current');
      
      const list = store.getList();
      expect(list.length).toBe(initialLength - 1);
      expect(list[0].value).toBe('third');
      expect(list[1].value).toBe('first');
    });

    test('should update lastCopiedItem when removing index 0', () => {
      store.insert('first');
      store.insert('second');
      store.remove(0, 'new current');
      expect(store.getLatestItem()).toBe('new current');
    });

    test('should not remove if index is out of bounds', () => {
      store.insert('test');
      const initialLength = store.getList().length;
      store.remove(10, 'current');
      expect(store.getList().length).toBe(initialLength);
    });
  });

  describe('retention days', () => {
    test('should have default retention of 30 days', () => {
      expect(store.getRetentionDays()).toBe(30);
    });

    test('should allow setting retention days', () => {
      store.setRetentionDays(7);
      expect(store.getRetentionDays()).toBe(7);
    });

    test('should enforce minimum retention of 1 day', () => {
      store.setRetentionDays(0);
      expect(store.getRetentionDays()).toBe(1);
      
      store.setRetentionDays(-5);
      expect(store.getRetentionDays()).toBe(1);
    });

    test('should clean up old entries based on retention', () => {
      // Set retention to 1 day
      store.setRetentionDays(1);
      
      // Clear the store first
      store.store = [];
      
      // Insert an old item (simulate by manipulating date)
      const oldItem = {
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        value: 'old item',
      };
      store.store.push(oldItem);
      
      // Insert a recent item
      store.insert('recent item');
      
      // Get config and trigger cleanup
      let config = store.getDefaultConfig();
      config.retentionDays = 1;
      store._removeOldEntries(config);
      
      const list = store.getList();
      const values = list.map(item => item.value);
      expect(values).toContain('recent item');
      // The old item should be removed
      expect(values).not.toContain('old item');
    });
  });

  describe('parseStore', () => {
    test('should parse store from file', () => {
      // Insert items
      store.insert('item1');
      store.insert('item2');
      
      // Create new store instance to test parsing
      const newStore = new Store({
        configName: store.configPath.split(path.sep).pop(),
        historyFileName: store.path.split(path.sep).pop(),
        lastCopiedItem: null,
      });
      
      const list = newStore.getList();
      expect(list.length).toBeGreaterThan(0);
    });

    test('should handle empty file gracefully', () => {
      // Create store with non-existent file
      const emptyStore = new Store({
        configName: 'non-existent-config',
        historyFileName: 'non-existent-history',
        lastCopiedItem: null,
      });
      
      expect(emptyStore.getList()).toEqual([]);
    });
  });
});

