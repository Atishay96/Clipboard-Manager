import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Fade from '@mui/material/Fade';
import Grow from '@mui/material/Grow';
import Collapse from '@mui/material/Collapse';
import Slide from '@mui/material/Slide';

import Search from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';

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
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
    const [removingIndex, setRemovingIndex] = React.useState<number | null>(null);
    const [searchValue, setSearchValue] = React.useState('');
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    useListenerHook((index: number) => {
        if (index >= props.items.length) return;
        copyToClipboard(props.items[index]);
    });

    // Close search when window loses focus or goes to background
    React.useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && isButtonExpanded) {
                setIsButtonExpanded(false);
                setSearchValue('');
                props.resetToOriginal();
            }
        };

        const handleBlur = () => {
            // Small delay to check if window is actually hidden
            setTimeout(() => {
                if (isButtonExpanded) {
                    setIsButtonExpanded(false);
                    setSearchValue('');
                    props.resetToOriginal();
                }
            }, 100);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, [isButtonExpanded, props]);

    // Focus search input when search is expanded
    React.useEffect(() => {
        if (isButtonExpanded && searchInputRef.current) {
            // Small delay to ensure the Collapse animation has started
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [isButtonExpanded]);

    const copyToClipboard = (item: ItemList) => {
        window.api.copyToClipboard(item, item.id);
        props.showCopiedMessageHandler();
        
        // Clear and close search input after copying
        if (searchValue || isButtonExpanded) {
            setSearchValue('');
            setIsButtonExpanded(false);
            props.resetToOriginal();
        }
    };

    const handleOnKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsButtonExpanded(false);
            setSearchValue('');
            props.resetToOriginal();
        }
    }

    const handleDelete = (e: React.MouseEvent, item: ItemList, index: number) => {
        e.stopPropagation();
        setRemovingIndex(index);
        // Wait for collapse animation to complete before removing from DOM
        setTimeout(() => {
            window.api.deleteEntry(item.id);
            props.deleteEntryMessageHandler();
            setRemovingIndex(null);
        }, 400); // Match Collapse animation duration
    };

    const handleSearchChange = (value: string) => {
        setSearchValue(value);
        props.filterItems(value);
    };

    const searchBarEl = (
        <Box 
            sx={{ 
                display: 'flex', 
                alignItems: 'flex-end',
                px: { xs: 2, sm: 3 },
                pb: 2,
                width: '100%',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                <TextField
                    inputRef={searchInputRef}
                    value={searchValue}
                    onChange={(e) => {handleSearchChange(e.target.value)}}
                    onKeyDown={(e) => {handleOnKeyDown(e)}}
                    label="Search" 
                    variant="outlined" 
                    autoFocus
                    fullWidth
                    size="small"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            transition: 'all 0.3s ease',
                        },
                    }}
                />
                <IconButton
                    onClick={() => {
                        setIsButtonExpanded(false);
                        setSearchValue('');
                        props.resetToOriginal();
                    }}
                    aria-label="Close search"
                    sx={{
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                            transform: 'rotate(90deg)',
                        },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </Box>
        </Box>
    );

    const searchIconEl = (
        <Box 
            sx={{ 
                display: 'inline-flex', 
                mt: '5px', 
                position: 'absolute', 
                right: { xs: '10px', sm: '15px' },
            }}
        >
            <IconButton 
                onClick={() => { setIsButtonExpanded(true); }} 
                aria-label="Search history"
                sx={{
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                        transform: 'scale(1.1)',
                    },
                }}
            >
                <Search />
            </IconButton>
        </Box>
    );

    return (
    <>
        <Box 
            sx={{ 
                mt: { xs: 2, sm: 3 },
                mb: 1,
                textAlign: 'center',
                position: 'relative',
                px: { xs: 2, sm: 3 },
            }}
        >
            <Typography 
                gutterBottom 
                variant="h6" 
                sx={{
                    display: 'inline-flex',
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                }}
            >
                Clipboard Manager
                {!isButtonExpanded && searchIconEl}
            </Typography>
        </Box>
        <Collapse in={isButtonExpanded} timeout={300}>
            {searchBarEl}
        </Collapse>
        <Box sx={{ px: { xs: 1, sm: 2 }, pb: 2 }}>
            {props.items.map((item, i) => {
                const isRemoving = removingIndex === i;
                const isHovered = hoveredIndex === i;
                const animationDelay = i * 30; // Staggered delay (reduced for smoother effect)

                return (
                    <Collapse
                        in={!isRemoving}
                        timeout={400}
                        key={`item-${i}`}
                        sx={{
                            mb: { xs: 1, sm: 1.5 },
                        }}
                    >
                        <Fade
                            in={!isRemoving}
                            timeout={400}
                            style={{ transitionDelay: isRemoving ? '0ms' : `${animationDelay}ms` }}
                        >
                            <List 
                                sx={{
                                    width: '100%',
                                    bgcolor: 'background.paper',
                                    py: 0,
                                }}
                            >
                                <ListItem 
                                    alignItems="flex-start"
                                    sx={{ px: 0 }}
                                >
                                    <Card 
                                        elevation={isHovered ? 4 : 1}
                                        sx={{
                                            width: '100%',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                                            opacity: isRemoving ? 0.5 : 1,
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                            },
                                        }} 
                                        onClick={(e) => {
                                            if (!isRemoving) {
                                                copyToClipboard(item);
                                            }
                                        }}
                                        onMouseEnter={() => !isRemoving && setHoveredIndex(i)}
                                        onMouseLeave={() => setHoveredIndex(null)}
                                    >
                                        <CardContent 
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                py: { xs: 1.5, sm: 2 },
                                                px: { xs: 1.5, sm: 2 },
                                                '&:last-child': { pb: { xs: 1.5, sm: 2 } },
                                            }}
                                        >
                                            <ListItemText
                                                primary={`${i+1}. ${item.value}`}
                                                sx={{
                                                    flex: 1,
                                                    minWidth: 0,
                                                    mr: 1,
                                                    '& .MuiListItemText-primary': {
                                                        fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                                                        maxHeight: { xs: 40, sm: 50 },
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        wordBreak: 'break-word',
                                                    },
                                                }}
                                            />
                                            <Box
                                                sx={{
                                                    opacity: isHovered && !isRemoving ? 1 : 0,
                                                    transition: 'opacity 0.2s ease-in-out',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <IconButton
                                                    onClick={(e) => handleDelete(e, item, i)}
                                                    aria-label="Delete entry"
                                                    size="small"
                                                    disabled={isRemoving}
                                                    sx={{
                                                        color: 'error.main',
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': {
                                                            backgroundColor: 'error.light',
                                                            transform: 'scale(1.1)',
                                                        },
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </ListItem>
                            </List>
                        </Fade>
                    </Collapse>
                );
            })}
        </Box>
        {!props.items.length && (
            <Box 
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    minHeight: '200px',
                    px: { xs: 2, sm: 3 },
                }}
            >
                <Grow in={true} timeout={500}>
                    <Typography 
                        variant="h6" 
                        sx={{
                            color: 'text.secondary',
                            fontSize: { xs: '1rem', sm: '1.25rem' },
                            textAlign: 'center',
                        }}
                    >
                        No history found
                    </Typography>
                </Grow>
            </Box>
        )}
    </>
    );
};

export default ItemList;