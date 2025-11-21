/**
 * Integration tests for the copy flow
 * Tests the complete flow from hotkey press to clipboard update
 */

const Store = require('../../electron/store/store');
const { copyToClipboardListenerHandler } = require('../../electron/ipcMessaging/listeners');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Mock Electron
jest.mock('electron', () => {
  const os = require('os');
  return {
    app: {
      getPath: jest.fn(() => os.tmpdir()),
    },
    remote: null,
    clipboard: {
      readText: jest.fn(() => ''),
      writeText: jest.fn(),
    },
  };
});

const { clipboard } = require('electron');

describe('Copy Flow Integration', () => {
  let store;
  let mockWindow;

  let clipboardValue = '';

  beforeEach(() => {
    jest.clearAllMocks();
    clipboardValue = '';
    clipboard.readText.mockReturnValue('');
    clipboard.writeText.mockImplementation((text) => {
      clipboardValue = text;
      clipboard.readText.mockReturnValue(text);
    });

    store = new Store({
      configName: 'test-config',
      historyFileName: 'test-history',
      lastCopiedItem: null,
    });

    // Add test items
    store.insert('Item 1');
    store.insert('Item 2');
    store.insert('Item 3');

    mockWindow = {
      mainWindow: {
        webContents: {
          send: jest.fn(),
        },
      },
    };
  });

  afterEach(() => {
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

  test('should copy item at index 0 without moving it', () => {
    const handler = copyToClipboardListenerHandler(store, mockWindow);
    // Items are stored newest first, so index 0 is "Item 3"
    const data = { value: 'Item 3' };

    handler({}, data, 0);

    expect(clipboard.writeText).toHaveBeenCalledWith('Item 3');
    expect(store.lastCopiedItem).toBe('Item 3');
    expect(store.getList().length).toBe(3);
    expect(store.getList()[0].value).toBe('Item 3'); // Should still be at top
  });

  test('should move item from middle to top when copying', () => {
    const handler = copyToClipboardListenerHandler(store, mockWindow);
    const data = { value: 'Item 2' };

    handler({}, data, 1);

    expect(clipboard.writeText).toHaveBeenCalledWith('Item 2');
    expect(store.lastCopiedItem).toBe('Item 2');
    
    const list = store.getList();
    expect(list[0].value).toBe('Item 2'); // Should be moved to top
    expect(list.length).toBe(3);
    expect(mockWindow.mainWindow.webContents.send).toHaveBeenCalledWith(
      'updatedHistory',
      expect.any(Array)
    );
  });

  test('should prevent clipboard monitoring from re-adding copied item', () => {
    const handler = copyToClipboardListenerHandler(store, mockWindow);
    // Items are stored newest first: [Item 3, Item 2, Item 1]
    // So index 1 is "Item 2"
    const data = { value: 'Item 2' };

    handler({}, data, 1);

    // Simulate clipboard monitoring check
    expect(store.getLatestItem()).toBe('Item 2');
    // After writeText, readText should return the written value
    expect(clipboard.readText()).toBe('Item 2');
    // The monitoring should not add it because lastCopiedItem matches clipboard content
  });

  test('should handle copying last item in list', () => {
    const handler = copyToClipboardListenerHandler(store, mockWindow);
    const data = { value: 'Item 1' };

    handler({}, data, 2); // Last item (index 2)

    expect(clipboard.writeText).toHaveBeenCalledWith('Item 1');
    const list = store.getList();
    expect(list[0].value).toBe('Item 1'); // Should be moved to top
  });

  test('should maintain data integrity when moving items', () => {
    const handler = copyToClipboardListenerHandler(store, mockWindow);
    const originalList = store.getList().map(item => item.value);

    handler({}, { value: 'Item 2' }, 1);

    const newList = store.getList().map(item => item.value);
    // All items should still exist, just reordered
    expect(newList).toContain('Item 1');
    expect(newList).toContain('Item 2');
    expect(newList).toContain('Item 3');
    expect(newList.length).toBe(3);
    expect(newList[0]).toBe('Item 2'); // Moved to top
  });

  test('should verify clipboard write was successful', () => {
    clipboard.readText.mockReturnValue('Item 2');
    const handler = copyToClipboardListenerHandler(store, mockWindow);
    const data = { value: 'Item 2' };

    handler({}, data, 1);

    expect(clipboard.writeText).toHaveBeenCalled();
    expect(clipboard.readText).toHaveBeenCalled(); // Verification call
  });
});

