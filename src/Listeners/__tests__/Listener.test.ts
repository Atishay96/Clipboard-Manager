import useListenerHook from '../Listener';

describe('useListenerHook', () => {
  let mockCallback: jest.Mock;
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    mockCallback = jest.fn();
    // Mock document.addEventListener and removeEventListener
    document.addEventListener = jest.fn();
    document.removeEventListener = jest.fn();
  });

  afterEach(() => {
    if (cleanup) {
      cleanup();
    }
  });

  test('should register keydown event listener', () => {
    cleanup = useListenerHook(mockCallback);
    
    expect(document.addEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );
  });

  test('should call callback with correct index for Cmd+1', () => {
    cleanup = useListenerHook(mockCallback);
    
    const handler = (document.addEventListener as jest.Mock).mock.calls.find(
      call => call[0] === 'keydown'
    )?.[1];
    
    if (handler) {
      const event = new KeyboardEvent('keydown', {
        key: '1',
        metaKey: true,
      } as any);
      handler(event);
      
      expect(mockCallback).toHaveBeenCalledWith(0); // Cmd+1 -> index 0
    }
  });

  test('should call callback with correct index for Cmd+5', () => {
    cleanup = useListenerHook(mockCallback);
    
    const handler = (document.addEventListener as jest.Mock).mock.calls.find(
      call => call[0] === 'keydown'
    )?.[1];
    
    if (handler) {
      const event = new KeyboardEvent('keydown', {
        key: '5',
        metaKey: true,
      } as any);
      handler(event);
      
      expect(mockCallback).toHaveBeenCalledWith(4); // Cmd+5 -> index 4
    }
  });

  test('should not call callback for non-meta/ctrl key presses', () => {
    cleanup = useListenerHook(mockCallback);
    
    const handler = (document.addEventListener as jest.Mock).mock.calls.find(
      call => call[0] === 'keydown'
    )?.[1];
    
    if (handler) {
      const event = new KeyboardEvent('keydown', {
        key: '1',
        metaKey: false,
        ctrlKey: false,
      } as any);
      handler(event);
      
      expect(mockCallback).not.toHaveBeenCalled();
    }
  });

  test('should call callback with correct index for Ctrl+1 (Windows/Linux)', () => {
    cleanup = useListenerHook(mockCallback);
    
    const handler = (document.addEventListener as jest.Mock).mock.calls.find(
      call => call[0] === 'keydown'
    )?.[1];
    
    if (handler) {
      const event = new KeyboardEvent('keydown', {
        key: '1',
        metaKey: false,
        ctrlKey: true,
      } as any);
      handler(event);
      
      expect(mockCallback).toHaveBeenCalledWith(0); // Ctrl+1 -> index 0
    }
  });

  test('should call callback with correct index for Ctrl+9 (Windows/Linux)', () => {
    cleanup = useListenerHook(mockCallback);
    
    const handler = (document.addEventListener as jest.Mock).mock.calls.find(
      call => call[0] === 'keydown'
    )?.[1];
    
    if (handler) {
      const event = new KeyboardEvent('keydown', {
        key: '9',
        metaKey: false,
        ctrlKey: true,
      } as any);
      handler(event);
      
      expect(mockCallback).toHaveBeenCalledWith(8); // Ctrl+9 -> index 8
    }
  });

  test('should not call callback for invalid keys', () => {
    cleanup = useListenerHook(mockCallback);
    
    const handler = (document.addEventListener as jest.Mock).mock.calls.find(
      call => call[0] === 'keydown'
    )?.[1];
    
    if (handler) {
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        metaKey: true,
      } as any);
      handler(event);
      
      expect(mockCallback).not.toHaveBeenCalled();
    }
  });

  test('should cleanup event listener on unmount', () => {
    cleanup = useListenerHook(mockCallback);
    
    expect(document.addEventListener).toHaveBeenCalled();
    
    if (cleanup) {
      cleanup();
      
      expect(document.removeEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    }
  });
});

