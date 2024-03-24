import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import ItemList from './Components/ItemList/ItemList';
import { ItemList as ItemListType } from './Types/types';

const App = () => {
  const [items, setItems] = useState<ItemListType[]>([]);

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

  return (
    <>
      <ItemList items={items} />
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
