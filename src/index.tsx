import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import ItemList from './Components/ItemList/ItemList';
import PopoverAlert from './Components/PopoverAlert/PopoverAlert';
import { ItemList as ItemListType } from './Types/types';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    h6: {
      fontSize: '1.25rem',
      fontWeight: 500,
      '@media (max-width:600px)': {
        fontSize: '1.1rem',
      },
    },
    body1: {
      fontSize: '0.875rem',
      '@media (max-width:600px)': {
        fontSize: '0.8rem',
      },
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          transition: 'all 0.2s ease-in-out',
        },
      },
    },
  },
});

const App = () => {
  const [items, setItems] = useState<ItemListType[]>([]);
  const itemsOriginalList = useRef<ItemListType[]>();
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
          // Create a deep copy to ensure each item has its own reference
          const historyCopy = history.map(item => ({
            date: new Date(item.date),
            value: item.value
          }));
          setItems(historyCopy);
          itemsOriginalList.current = historyCopy;
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
      if (!itemsOriginalList.current) {
        itemsOriginalList.current = [];
      }
      // Create a copy of the new item to avoid reference issues
      const newItem = {
        date: new Date(data.date),
        value: data.value
      };
      itemsOriginalList.current.unshift(newItem);
      // Update displayed items based on current search state
      setItems([...itemsOriginalList.current]);
    };

    // Handler for when the full history is updated (e.g., after moving an item)
    // This ensures the UI is always in sync with the store
    const updatedHistoryHandler = (history: ItemListType[]) => {
      // Use JSON serialization to ensure complete isolation and no shared references
      const historyString = JSON.stringify(history);
      const historyCopy = JSON.parse(historyString).map((item: any) => ({
        date: new Date(item.date),
        value: String(item.value) // Ensure value is a string
      }));
      itemsOriginalList.current = historyCopy;
      // Always update displayed items to match the store
      // If user is searching, they'll need to search again, but at least data is consistent
      setItems([...historyCopy]); // Use spread to create new array reference
    };

    window.api.entryAdded(entryAddedListenerHandler);
    window.api.updatedHistory(updatedHistoryHandler);
    
    // Notify main process that React is ready to receive messages
    window.api.notifyReady();
  }, []);

  useEffect(() => {
    const entryRemovedListenerHandler = (index: number) => {
      // Update both the displayed items and the original list
      setItems((prevItems) => {
        const newItems = [...prevItems];
        if (index >= 0 && index < newItems.length) {
          newItems.splice(index, 1);
        }
        return newItems;
      });
      
      // Also update the original list reference
      if (itemsOriginalList.current && index >= 0 && index < itemsOriginalList.current.length) {
        itemsOriginalList.current.splice(index, 1);
      }
    }
    window.api.entryRemoved(entryRemovedListenerHandler);
  }, []);

  const showCopiedMessageHandler = () => {
    setShowCopiedMessage(true);
    setTimeout(() => {
      setShowCopiedMessage(false);
    }, 2000); // Increased to allow animation to complete
  };

  const deleteEntryMessageHandler = () => {
    setShowDeletedMessage(true);
    setTimeout(() => {
      setShowDeletedMessage(false);
    }, 2000); // Increased to allow animation to complete
  };

  const filterItems = (searchText: string) => {
    const text = searchText.trim();
    if (!text) {
      setItems(itemsOriginalList.current as ItemListType[]);
      return;
    }
    if (!itemsOriginalList.current) return;
    setItems(itemsOriginalList.current.filter((item) => item.value.toLowerCase().includes(text.toLowerCase())));
  };

  useEffect(() => {
    window.api.showCopiedText(showCopiedMessageHandler);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {showCopiedMessage && <PopoverAlert message='Text Copied!' />}
      {showDeletedMessage && <PopoverAlert message='Entry Deleted!' />}
      <ItemList
        items={items}
        showCopiedMessageHandler={showCopiedMessageHandler}
        deleteEntryMessageHandler={deleteEntryMessageHandler}
        filterItems={filterItems}
        resetToOriginal={() => setItems(itemsOriginalList.current as ItemListType[])}
      />
    </ThemeProvider>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
