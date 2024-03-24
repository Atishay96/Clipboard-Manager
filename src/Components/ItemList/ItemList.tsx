import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';

import { ItemList as ItemListType } from '../../Types/types';

interface OwnProps {
    items: ItemListType[];
    showCopiedMessageHandler: () => void;
    deleteEntryMessageHandler: () => void;
}

const ItemList = (props: OwnProps) => {
    const handleOnClick = (item: ItemList, i: number) => {
        window.api.copyToClipboard(item, i);
        props.showCopiedMessageHandler();
    };

    return (
    <>
        <Typography gutterBottom variant="h6" sx={{
            top: 10,
            textAlign: 'center',
        }}>
            Clipboard Manager
        </Typography>
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
                        handleOnClick(item, i);
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
    </>
    );
};

export default ItemList;