interface ItemList {
    date: Date;
    value: string;
}

interface Window {
    api: {
        async requestHistory(): ItemList[];
        async copyToClipboard(text: string): void;
        entryAdded(callback: Function): void;
    };
}
