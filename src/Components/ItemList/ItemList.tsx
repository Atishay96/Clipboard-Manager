import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

import { ItemList as ItemListType } from '../../Types/types';

interface OwnProps {
    items: ItemListType[];
}
{/* <Card key={i} onClick={(e) => {
    e.preventDefault();
    window.api.copyToClipboard(item.value);
}}>
    <CardContent>
        {item.value}
    </CardContent>
</Card> */}

const ItemList = (props: OwnProps) => {
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
                        e.preventDefault();
                        window.api.copyToClipboard(item.value);
                    }}>
                        <CardContent>
                            <ListItemText
                                primary={item.value}
                            />
                        </CardContent>
                    </Card>
                </ListItem>
            </List>
        ))}
    </>
    );
};

export default ItemList;