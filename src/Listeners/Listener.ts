const copyKeys: { [key: string]: boolean } = {
    '1': true,
    '2': true,
    '3': true,
    '4': true,
    '5': true,
    '6': true,
    '7': true,
    '8': true,
    '9': true,
};

const useListenerHook = (copyToClipboardCallback: (index: number) => void) => {
    // Debounce map to track last call time per key
    const lastCallTime: { [key: string]: number } = {};
    const DEBOUNCE_MS = 150; // Prevent rapid duplicate calls
    
    const keyDownHandler = (e: KeyboardEvent) => {
        let { key, metaKey, ctrlKey } = e;

        // Support both Cmd (Mac) and Ctrl (Windows/Linux)
        if ((metaKey || ctrlKey) && copyKeys[key]) {
            const now = Date.now();
            const lastCall = lastCallTime[key] || 0;
            
            // Debounce: ignore if called too soon after last call
            if (now - lastCall < DEBOUNCE_MS) {
                e.preventDefault();
                return;
            }
            
            lastCallTime[key] = now;
            copyToClipboardCallback(parseInt(key) - 1);
        }
    };

    document.addEventListener('keydown', keyDownHandler);
    return () => {
        document.removeEventListener("keydown", keyDownHandler);
    };
}

export default useListenerHook;