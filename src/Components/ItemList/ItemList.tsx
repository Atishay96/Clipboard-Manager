import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

import Search from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

import useListenerHook from '../../Listeners/Listener';
import { ItemList as ItemListType } from '../../Types/types';

interface OwnProps {
    items: ItemListType[];
    showCopiedMessageHandler: () => void;
    deleteEntryMessageHandler: () => void;
    resetToOriginal: () => void;
    filterItems: (value: string) => void;
}

const ItemList = (props: OwnProps) => {
    const [isButtonExpanded, setIsButtonExpanded] = React.useState(false);

    useListenerHook((index: number) => {
        if (index >= props.items.length) return;
        copyToClipboard(props.items[index], index);
    });

    const copyToClipboard = (item: ItemList, i: number) => {
        window.api.copyToClipboard(item, i);
        props.showCopiedMessageHandler();
    };

    const handleOnKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsButtonExpanded(false);
            props.resetToOriginal();
        }
    }

    const searchBarEl = (
        <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <Box ml="auto" mr="0px">
                <TextField
                    onChange={(e) => {props.filterItems(e.target.value)}}
                    onKeyDown={(e) => {handleOnKeyDown(e)}}
                    label="Search" variant="standard" autoFocus
                />
                <Button
                    onClick={() => {
                        setIsButtonExpanded(false);
                        props.resetToOriginal();
                    }}
                >
                    <CloseIcon sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
                </Button>
            </Box>
        </Box>
    );

    const searchIconEl = (
        <Box display="inline-flex" mt="5px" position="absolute" right="10px">
            <Button onClick={() => { setIsButtonExpanded(true); }} aria-label="Search history">
                <Search />
            </Button>
        </Box>
    );

    return (
    <>
        <Box mt="15px" textAlign="center">
            <Typography gutterBottom variant="h6" display="inline-flex">
                Clipboard Manager
                {!isButtonExpanded && searchIconEl}
            </Typography>
        </Box>
        {isButtonExpanded && searchBarEl}
        {props.items.map((item, i) => (
            <List sx={{
                width: '100%',
                bgcolor: 'background.paper',
                py: 0,
            }}>
                <ListItem alignItems="flex-start">
                    <Card sx={{
                        width: '100%',
                        cursor: 'pointer',
                    }} key={i} onClick={(e) => {
                        copyToClipboard(item, i);
                    }}>
                        <CardContent sx={{
                            display: 'flex',
                        }}>
                            <ListItemText
                                primary={`${i+1}. ${item.value}`}
                                sx={{
                                    maxHeight: 50,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    position: 'relative',
                                    WebkitBoxOrient: 'vertical',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                }}
                            />
                            <Button onClick={(e) => {
                                e.stopPropagation();
                                window.api.deleteEntry(i);
                                props.deleteEntryMessageHandler();
                            }}>Delete</Button>
                        </CardContent>
                    </Card>
                </ListItem>
            </List>
        ))}
        {!props.items.length && (
            <Typography variant="h6" display="inline-flex">
                No history found
            </Typography>
        )}
    </>
    );
};

export default ItemList;