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
      if (!itemsOriginalList.current) {
        itemsOriginalList.current = [];
      }
      itemsOriginalList.current.unshift(data);
      setItems([...itemsOriginalList.current]);
    };

    window.api.entryAdded(entryAddedListenerHandler);
    
    // Notify main process that React is ready to receive messages
    window.api.notifyReady();
  }, []);

  useEffect(() => {
    const entryRemovedListenerHandler = (index: number) => {
      removeItem(index);
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
