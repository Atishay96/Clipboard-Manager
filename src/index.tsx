import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import ItemList from './Components/ItemList/ItemList';
import PopoverAlert from './Components/PopoverAlert/PopoverAlert';
import { ItemList as ItemListType } from './Types/types';

const App = () => {
  const [items, setItems] = useState<ItemListType[]>([]);
  const itemsOriginalList = useRef<ItemList[]>();
  const [showCopiedMessage, setShowCopiedMessage] = React.useState(false);
  const [showDeletedMessage, setShowDeletedMessage] = React.useState(false);

  const removeItem = (index: number) => {
    setItems((prevItems) => {
      const newItems = [...prevItems];
      newItems.splice(index, 1);
      return newItems;
    });
  };

  useEffect(() => {
    try {
      const fetchData = async () => {
        try {
          const history = await window.api.requestHistory();
          setItems(history);
          itemsOriginalList.current = history;
        } catch (error) {
          console.error('Error while fetching data', error);
        }
      };
      fetchData();
    } catch (error) {
      console.error("Error while fetching data", error);
    }
  }, [])

  useEffect(() => {
    const entryAddedListenerHandler = (data: ItemListType) => {
      setItems((prevItems) => [data, ...prevItems]);
    };

    window.api.entryAdded(entryAddedListenerHandler);
  }, []);

  useEffect(() => {
    const entryRemovedListenerHandler = (index: number) => {
      removeItem(index);
    }
    window.api.entryRemoved(entryRemovedListenerHandler);
  }, []);

  const showCopiedMessageHandler = () => {
    setTimeout(() => {
      setShowCopiedMessage(false);
    }, 1000);
    setShowCopiedMessage(true);
  };

  const deleteEntryMessageHandler = () => {
    setShowDeletedMessage(true);
    setTimeout(() => {
      setShowDeletedMessage(false);
    }, 1000);
  };

  const filterItems = (searchText: string) => {
    const text = searchText.trim();
    if (!text) {
      setItems(itemsOriginalList.current as ItemList[]);
      return;
    }
    if (!itemsOriginalList.current) return;
    setItems(itemsOriginalList.current.filter((item) => item.value.toLowerCase().includes(text.toLowerCase())));
  };

  useEffect(() => {
    window.api.showCopiedText(showCopiedMessageHandler);
  }, []);

  return (
    <>
      {showCopiedMessage && <PopoverAlert message='Text Copied!' />}
      {showDeletedMessage && <PopoverAlert message='Entry Deleted!' />}
      <ItemList
        items={items}
        showCopiedMessageHandler={showCopiedMessageHandler}
        deleteEntryMessageHandler={deleteEntryMessageHandler}
        filterItems={filterItems}
        resetToOriginal={() => setItems(itemsOriginalList.current as ItemList[])}
      />
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
