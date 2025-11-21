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
    test('should copy item by ID without moving when at top', () => {
      const handler = copyToClipboardListenerHandler(mockStore, mockWindow);
      const data = { id: 'id1', value: 'item1' };
      
      // Mock findById and findIndexById
      mockStore.findById.mockReturnValue(mockStore.store[0]);
      mockStore.findIndexById.mockReturnValue(0);
      
      handler(mockEvent, data, 'id1');
      
      expect(mockStore.findById).toHaveBeenCalledWith('id1');
      expect(clipboard.writeText).toHaveBeenCalledWith('item1');
      expect(mockStore.lastCopiedItem).toBe('item1');
      expect(mockStore.store.length).toBe(3); // Should not remove item
      expect(mockStore._parseAndRewriteFile).toHaveBeenCalled();
    });

    test('should move item from middle to top and copy by ID', () => {
      const handler = copyToClipboardListenerHandler(mockStore, mockWindow);
      const data = { id: 'id2', value: 'item2' };
      
      // Mock findById and findIndexById
      mockStore.findById.mockReturnValue(mockStore.store[1]);
      mockStore.findIndexById.mockReturnValue(1);
      
      handler(mockEvent, data, 'id2');
      
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
    test('should delete item by ID', () => {
      mockStore.removeById = jest.fn(() => true);
      const handler = deleteEntryHandler(mockStore, mockWindow);
      
      handler(mockEvent, 'id2');
      
      expect(mockStore.removeById).toHaveBeenCalledWith('id2', '');
      expect(mockWindow.mainWindow.webContents.send).toHaveBeenCalledWith('updatedHistory', expect.any(Array));
    });

    test('should handle non-existent ID gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStore.removeById = jest.fn(() => false);
      const handler = deleteEntryHandler(mockStore, mockWindow);
      
      handler(mockEvent, 'non-existent-id');
      
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
});

