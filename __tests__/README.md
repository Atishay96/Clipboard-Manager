# Test Suite

This directory contains the test suite for the Clipboard Manager application.

## Test Structure

- **Unit Tests**: Test individual components and functions in isolation
  - `electron/store/__tests__/` - Store class tests
  - `electron/ipcMessaging/__tests__/` - IPC handler tests
  - `src/Components/**/__tests__/` - React component tests
  - `src/Listeners/__tests__/` - Listener hook tests

- **Integration Tests**: Test the complete flow of features
  - `__tests__/integration/` - End-to-end feature tests

## Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

## Test Coverage

The test suite covers:

1. **Store Operations**
   - Inserting items
   - Removing items
   - Getting list of items
   - Retention policy
   - File persistence

2. **IPC Handlers**
   - Copy to clipboard
   - Delete entry
   - Request history

3. **React Components**
   - ItemList component rendering
   - User interactions (click, hover, search)
   - Delete functionality
   - Search functionality

4. **Integration**
   - Complete copy flow
   - Item movement
   - Data integrity

## Writing New Tests

When adding new features, please add corresponding tests:

1. Unit tests for new functions/classes
2. Component tests for new UI components
3. Integration tests for new user flows

Follow the existing test patterns and structure.

