import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import PopoverAlert from '../PopoverAlert';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('PopoverAlert', () => {
  test('should render the message', async () => {
    renderWithTheme(<PopoverAlert message="Test message" />);
    
    // Wait for the component to render (it has a small delay for animation)
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  test('should be positioned as a toast notification', () => {
    const { container } = renderWithTheme(<PopoverAlert message="Test" />);
    
    const alertBox = container.firstChild as HTMLElement;
    expect(alertBox).toHaveStyle({ position: 'fixed' });
  });

  test('should display different messages correctly', async () => {
    const { rerender } = renderWithTheme(<PopoverAlert message="Text Copied!" />);
    await waitFor(() => {
      expect(screen.getByText('Text Copied!')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    rerender(
      <ThemeProvider theme={theme}>
        <PopoverAlert message="Entry Deleted!" />
      </ThemeProvider>
    );
    await waitFor(() => {
      expect(screen.getByText('Entry Deleted!')).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});

