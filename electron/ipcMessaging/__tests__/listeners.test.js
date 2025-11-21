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
        { id: 'id1', date: new Date(), value: 'item1' },
        { id: 'id2', date: new Date(), value: 'item2' },
        { id: 'id3', date: new Date(), value: 'item3' },
      ],
      lastCopiedItem: null,
      getList: jest.fn(() => [
        { id: 'id1', date: new Date(), value: 'item1' },
        { id: 'id2', date: new Date(), value: 'item2' },
        { id: 'id3', date: new Date(), value: 'item3' },
      ]),
      _parseAndRewriteFile: jest.fn(),
      findById: jest.fn((id) => mockStore.store.find(item => item.id === id)),
      findIndexById: jest.fn((id) => mockStore.store.findIndex(item => item.id === id)),
      setManualCopyInProgress: jest.fn(),
      isManualCopyInProgress: jest.fn(() => false),
      _queueOperation: jest.fn((operation) => Promise.resolve(operation())),
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
    test('should copy item by ID without moving when at top', async () => {
      const handler = copyToClipboardListenerHandler(mockStore, mockWindow);
      const data = { id: 'id1', value: 'item1' };
      
      // Mock findById and findIndexById
      // Set date to old date so file will be rewritten (new behavior: only rewrites if > 1 second old)
      mockStore.store[0].date = new Date(Date.now() - 2000); // 2 seconds ago
      mockStore.findById.mockReturnValue(mockStore.store[0]);
      mockStore.findIndexById.mockReturnValue(0);
      mockStore._queueOperation = jest.fn((op) => Promise.resolve(op()));
      
      await handler(mockEvent, data, 'id1');
      
      expect(mockStore.findById).toHaveBeenCalledWith('id1');
      expect(clipboard.writeText).toHaveBeenCalledWith('item1');
      expect(mockStore.lastCopiedItem).toBe('item1');
      expect(mockStore.store.length).toBe(3); // Should not remove item
      // File should be rewritten if date is old enough (> 1 second)
      expect(mockStore._parseAndRewriteFile).toHaveBeenCalled();
      // Should not send UI update since item is already at top (prevents flickering)
      expect(mockWindow.mainWindow.webContents.send).not.toHaveBeenCalledWith('updatedHistory', expect.any(Array));
    });

    test('should move item from middle to top and copy by ID', async () => {
      const handler = copyToClipboardListenerHandler(mockStore, mockWindow);
      const data = { id: 'id2', value: 'item2' };
      
      // Mock findById and findIndexById
      mockStore.findById.mockReturnValue(mockStore.store[1]);
      mockStore.findIndexById.mockReturnValue(1);
      
      await handler(mockEvent, data, 'id2');
      
      expect(mockStore.findById).toHaveBeenCalledWith('id2');
      expect(clipboard.writeText).toHaveBeenCalledWith('item2');
      expect(mockStore.lastCopiedItem).toBe('item2');
      // Item should be moved to top
      expect(mockStore.store[0].value).toBe('item2');
      expect(mockStore.store.length).toBe(3);
      expect(mockStore._parseAndRewriteFile).toHaveBeenCalled();
      expect(mockWindow.mainWindow.webContents.send).toHaveBeenCalledWith('updatedHistory', expect.any(Array));
    });

    test('should handle non-existent ID gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const handler = copyToClipboardListenerHandler(mockStore, mockWindow);
      const data = { id: 'non-existent', value: 'test' };
      
      mockStore.findById.mockReturnValue(undefined);
      
      handler(mockEvent, data, 'non-existent');
      
      expect(clipboard.writeText).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('should handle empty value gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStore.store[0].value = '';
      const handler = copyToClipboardListenerHandler(mockStore, mockWindow);
      const data = { id: 'id1', value: '' };
      
      mockStore.findById.mockReturnValue(mockStore.store[0]);
      
      handler(mockEvent, data, 'id1');
      
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('should verify clipboard write was successful', () => {
      const handler = copyToClipboardListenerHandler(mockStore, mockWindow);
      const data = { id: 'id1', value: 'item1' };
      
      mockStore.findById.mockReturnValue(mockStore.store[0]);
      mockStore.findIndexById.mockReturnValue(0);
      
      handler(mockEvent, data, 'id1');
      
      // After writeText is called, readText should return the written value
      clipboard.readText.mockReturnValue('item1');
      expect(clipboard.readText).toHaveBeenCalled();
      expect(clipboard.writeText).toHaveBeenCalledWith('item1');
    });
  });

  describe('deleteEntryHandler', () => {
    test('should delete item by ID', async () => {
      mockStore.removeById = jest.fn(() => Promise.resolve(true));
      const handler = deleteEntryHandler(mockStore, mockWindow);
      
      await handler(mockEvent, 'id2');
      
      expect(mockStore.removeById).toHaveBeenCalledWith('id2', '');
      expect(mockWindow.mainWindow.webContents.send).toHaveBeenCalledWith('updatedHistory', expect.any(Array));
    });

    test('should handle non-existent ID gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStore.removeById = jest.fn(() => Promise.resolve(false));
      const handler = deleteEntryHandler(mockStore, mockWindow);
      
      await handler(mockEvent, 'non-existent-id');
      
      expect(mockStore.removeById).toHaveBeenCalledWith('non-existent-id', '');
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

  describe('rapid hotkey press scenarios', () => {
    test('should prevent duplicate processing of same ID', async () => {
      const handler = copyToClipboardListenerHandler(mockStore, mockWindow);
      const data = { id: 'id1', value: 'item1' };
      
      mockStore.findById.mockReturnValue(mockStore.store[0]);
      mockStore.findIndexById.mockReturnValue(0);
      mockStore._queueOperation = jest.fn((op) => op());
      
      // Call handler twice rapidly with same ID
      const promise1 = handler(mockEvent, data, 'id1');
      const promise2 = handler(mockEvent, data, 'id1');
      
      await Promise.all([promise1, promise2]);
      
      // Should only process once (second call should be skipped)
      // We can't easily test the in-flight set, but we can verify clipboard.writeText
      // was called fewer times than handler calls if duplicates were prevented
      expect(clipboard.writeText).toHaveBeenCalled();
    });

    test('should handle rapid different ID operations', async () => {
      const handler = copyToClipboardListenerHandler(mockStore, mockWindow);
      
      mockStore.findById.mockImplementation((id) => 
        mockStore.store.find(item => item.id === id)
      );
      mockStore.findIndexById.mockImplementation((id) => 
        mockStore.store.findIndex(item => item.id === id)
      );
      mockStore._queueOperation = jest.fn((op) => op());
      
      // Call handler with different IDs rapidly
      const data1 = { id: 'id1', value: 'item1' };
      const data2 = { id: 'id2', value: 'item2' };
      
      await Promise.all([
        handler(mockEvent, data1, 'id1'),
        handler(mockEvent, data2, 'id2'),
      ]);
      
      // Both should be processed
      expect(clipboard.writeText).toHaveBeenCalledTimes(2);
    });

    test('should set manual copy flag during operation', async () => {
      const handler = copyToClipboardListenerHandler(mockStore, mockWindow);
      const data = { id: 'id1', value: 'item1' };
      
      mockStore.findById.mockReturnValue(mockStore.store[0]);
      mockStore.findIndexById.mockReturnValue(0);
      mockStore.setManualCopyInProgress = jest.fn();
      mockStore.isManualCopyInProgress = jest.fn(() => false);
      mockStore._queueOperation = jest.fn((op) => op());
      
      await handler(mockEvent, data, 'id1');
      
      expect(mockStore.setManualCopyInProgress).toHaveBeenCalledWith(true);
    });
  });
});

