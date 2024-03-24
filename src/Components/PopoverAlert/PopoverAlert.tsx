import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

interface OwnProps {
    message: string;
}

const PopoverAlert = (props: OwnProps) => {
    return (
        <Card sx={{
            position: 'fixed',
            width: '100%',
            height: '100%',
            zIndex: 1,
            display: 'flex',
        }}>
            <CardContent sx={{
                margin: 'auto',
            }}>
                <Typography variant="h4">
                    {props.message}
                </Typography>
            </CardContent>
        </Card>
    )
}

export default PopoverAlert;