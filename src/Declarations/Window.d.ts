interface ItemList {
    id: string;
    date: Date;
    value: string;
}

interface Window {
    api: {
        async requestHistory(): ItemList[];
        async copyToClipboard(historyItem: ItemList, id: string): void;
        deleteEntry(id: string): void;
        entryAdded(callback: Function): void;
        entryRemoved(callback: Function): void;
        updatedHistory(callback: Function): void;
        showCopiedText(callback: Function): void;
        notifyReady(): void;
    };
}
