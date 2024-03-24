interface ItemList {
    date: Date;
    value: string;
}

interface Window {
    api: {
        async requestHistory(): ItemList[];
        async copyToClipboard(historyItem: ItemList, index: number): void;
        deleteEntry(index: number): void;
        entryAdded(callback: Function): void;
        entryRemoved(callback: Function): void;
        showCopiedText(callback: Function): void;
    };
}
