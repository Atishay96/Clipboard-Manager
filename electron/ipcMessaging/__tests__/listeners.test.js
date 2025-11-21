// Mock Electron clipboard first
jest.mock('electron', () => {
  const mockClipboardValue = { value: '' };
  return {
    clipboard: {
      readText: jest.fn(() => mockClipboardValue.value),
      writeText: jest.fn((text) => {
        mockClipboardValue.value = text;
      }),
    },
  };
});

const { copyToClipboardListenerHandler, deleteEntryHandler, requestHistoryListenerHandler } = require('../listeners');
const { clipboard } = require('electron');

describe('IPC Listeners', () => {
  let mockStore;
  let mockWindow;
  let mockEvent;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    clipboard.readText.mockReturnValue('');
    clipboard.writeText.mockImplementation((text) => {
      clipboard.readText.mockReturnValue(text);
    });

    // Mock store
    mockStore = {
      store: [
        { date: new Date(), value: 'item1' },
        { date: new Date(), value: 'item2' },
        { date: new Date(), value: 'item3' },
      ],
      lastCopiedItem: null,
      getList: jest.fn(() => [
        { date: new Date(), value: 'item1' },
        { date: new Date(), value: 'item2' },
        { date: new Date(), value: 'item3' },
      ]),
      _parseAndRewriteFile: jest.fn(),
    };

    // Mock window
    mockWindow = {
      mainWindow: {
        webContents: {
          send: jest.fn(),
        },
      },
    };

    // Mock event
    mockEvent = {};
  });

  describe('copyToClipboardListenerHandler', () => {
    test('should copy item at index 0 without moving', () => {
      const handler = copyToClipboardListenerHandler(mockStore, mockWindow);
      const data = { value: 'item1' };
      
      handler(mockEvent, data, 0);
      
      expect(clipboard.writeText).toHaveBeenCalledWith('item1');
      expect(mockStore.lastCopiedItem).toBe('item1');
      expect(mockStore.store.length).toBe(3); // Should not remove item
    });

    test('should move item from middle to top and copy', () => {
      const handler = copyToClipboardListenerHandler(mockStore, mockWindow);
      const data = { value: 'item2' };
      
      handler(mockEvent, data, 1);
      
      expect(clipboard.writeText).toHaveBeenCalledWith('item2');
      expect(mockStore.lastCopiedItem).toBe('item2');
      expect(mockStore.store[0].value).toBe('item2');
      expect(mockStore.store.length).toBe(3);
      expect(mockStore._parseAndRewriteFile).toHaveBeenCalled();
      expect(mockWindow.mainWindow.webContents.send).toHaveBeenCalledWith('updatedHistory', expect.any(Array));
    });

    test('should handle invalid index gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const handler = copyToClipboardListenerHandler(mockStore, mockWindow);
      const data = { value: 'test' };
      
      handler(mockEvent, data, 10); // Invalid index
      
      expect(clipboard.writeText).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('should handle empty value gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStore.store[0].value = '';
      const handler = copyToClipboardListenerHandler(mockStore, mockWindow);
      const data = { value: '' };
      
      handler(mockEvent, data, 0);
      
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('should verify clipboard write was successful', () => {
      const handler = copyToClipboardListenerHandler(mockStore, mockWindow);
      const data = { value: 'item1' };
      
      handler(mockEvent, data, 0);
      
      // After writeText is called, readText should return the written value
      clipboard.readText.mockReturnValue('item1');
      expect(clipboard.readText).toHaveBeenCalled();
      expect(clipboard.writeText).toHaveBeenCalledWith('item1');
    });
  });

  describe('deleteEntryHandler', () => {
    test('should delete item at given index', () => {
      mockStore.remove = jest.fn();
      const handler = deleteEntryHandler(mockStore, mockWindow);
      
      handler(mockEvent, 1);
      
      expect(mockStore.remove).toHaveBeenCalledWith(1, '');
      expect(mockWindow.mainWindow.webContents.send).toHaveBeenCalledWith('updatedHistory', expect.any(Array));
    });

    test('should handle invalid index gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStore.remove = jest.fn();
      const handler = deleteEntryHandler(mockStore, mockWindow);
      
      handler(mockEvent, 10); // Invalid index
      
      expect(mockStore.remove).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('requestHistoryListenerHandler', () => {
    test('should send history to renderer', async () => {
      const handler = requestHistoryListenerHandler(mockStore, mockWindow);
      
      await handler(mockEvent);
      
      expect(mockStore.getList).toHaveBeenCalled();
      expect(mockWindow.mainWindow.webContents.send).toHaveBeenCalledWith('updatedHistory', expect.any(Array));
    });
  });
});

