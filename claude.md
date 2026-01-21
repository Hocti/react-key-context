# react-key-context Usage

A lightweight context management library using string keys.

## Components

### `KeyContextProvider`

Provides a value for a specific key to the component tree.

- `keyName`: string identifier (use `keyName` instead of `key`).
- `value`: any value to be provided.

## Hooks

### `useKeyContext<T>(key: string): T | undefined`

Retrieves the value for the given key from the closest parent provider.

- `key`: string identifier.
- Returns `value` if found, or `undefined`.
- Supports generics for type safety: `useKeyContext<string>("theme")`.

## Implementation Details

- Uses a subscription model to minimize re-renders.
- Only components consuming a specific key will re-render when that key's value changes.
- Shadowing is supported: nested providers for the same key will override parent providers for that key's children.
