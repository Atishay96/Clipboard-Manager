import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Fade, Slide, Box } from '@mui/material';

interface OwnProps {
    message: string;
}

const PopoverAlert = (props: OwnProps) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Trigger animation after mount
        const showTimer = setTimeout(() => setShow(true), 10);
        return () => clearTimeout(showTimer);
    }, []);

    return (
        <Box
            sx={{
                position: 'fixed',
                top: { xs: '20px', sm: '30px' },
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                width: { xs: '90%', sm: 'auto' },
                maxWidth: '400px',
            }}
        >
            <Slide direction="down" in={show} timeout={300} mountOnEnter>
                <Box>
                    <Fade in={show} timeout={300}>
                        <Card
                            sx={{
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                                backdropFilter: 'blur(10px)',
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: 2,
                                px: { xs: 2, sm: 3 },
                                py: { xs: 1.5, sm: 2 },
                            }}
                        >
                            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        fontSize: { xs: '1rem', sm: '1.25rem' },
                                        color: 'primary.main',
                                    }}
                                >
                                    {props.message}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Fade>
                </Box>
            </Slide>
        </Box>
    );
};

export default PopoverAlert;