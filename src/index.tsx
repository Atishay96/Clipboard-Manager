import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import ItemList from './Components/ItemList/ItemList';
import { ItemList as ItemListType } from './Types/types';

const App = () => {
  const [items, setItems] = useState<ItemListType[]>([]);

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
    window.api.entryRemoved(removeItem);
  }, []);

  return (
    <>
      <ItemList items={items} />
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
