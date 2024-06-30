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
    const keyDownHandler = (e: KeyboardEvent) => {
        let { key, metaKey, shiftKey } = e;

        if (metaKey && copyKeys[key]) {
            copyToClipboardCallback(parseInt(key) - 1);
        }

        if (metaKey && shiftKey && key === 'F') {
            console.log('CALLED');
        }
    };

    document.addEventListener('keydown', keyDownHandler);
    return () => {
        document.removeEventListener("keydown", keyDownHandler);
    };
}

export default useListenerHook;