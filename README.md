# react-key-context

A lightweight, type-safe React library for setting and retrieving context values using string keys. This eliminates the need for exporting and importing multiple Context objects and Providers, offering a dynamic key-value store that respects the component tree topology.

## Features

- **String-based Keys**: value injection without `createContext`.
- **Closest Parent Resolution**: Automatically finds the nearest provider for a specific key (Shadowing).
- **Zero Boilerplate**: No need to create/export context objects.
- **Type Safety**: Full TypeScript support with generics.
- **Performance Optimized**: Uses fine-grained subscriptions; consumers only re-render when their specific key changes.
- **Dynamic Updates**: Supports moving providers and children around freely.

## Installation

```bash
npm install react-key-context
# or
pnpm add react-key-context
# or
yarn add react-key-context
```

## Usage

### 1. Setting a Value

Wrap your components with `KeyContextProvider`. You must provide a `keyName` (identifier) and a `value`.

> **Note**: The prop is named `keyName` because `key` is a reserved prop in React.

```tsx
import { KeyContextProvider } from "react-key-context";

function App() {
  return (
    <KeyContextProvider keyName="theme" value="dark">
      <MainContent />
    </KeyContextProvider>
  );
}
```

### 2. Nesting & Shadowing

You can nest providers. If the same key is used nested, the child will see the closest provider's value (shadowing), while other keys pass through transparency.

```tsx
<KeyContextProvider keyName="theme" value="dark">
  {/* theme is dark */}
  <KeyContextProvider keyName="user" value="Alice">
    {/* theme is dark, user is Alice */}
    <KeyContextProvider keyName="theme" value="light">
      {/* theme is light (shadowed), user is Alice (inherited) */}
    </KeyContextProvider>
  </KeyContextProvider>
</KeyContextProvider>
```

### 3. Consuming a Value

Use the `useKeyContext` hook. passing the key string. You can specify the expected type via generics.

```tsx
import { useKeyContext } from "react-key-context";

function ThemeButton() {
  // Specify type <string> for type safety
  const theme = useKeyContext<string>("theme");

  if (theme === undefined) {
    return null; // Handle missing context
  }

  return <button className={theme}>Click Me</button>;
}
```

### Type Safety Tips

For better type safety across your project, consider creating a typed wrapper:

```tsx
// hooks/useTheme.ts
export const useTheme = () => useKeyContext<"light" | "dark">("theme");
```

## API Reference

### `<KeyContextProvider />`

| Prop       | Type        | Description                                          |
| ---------- | ----------- | ---------------------------------------------------- |
| `keyName`  | `string`    | **Required**. The unique key to identify this value. |
| `value`    | `any`       | **Required**. The value to store.                    |
| `children` | `Reactnode` | The content to render.                               |

### `useKeyContext<T>(key: string): T | undefined`

Returns the current value for `key` found in the nearest parent provider. Returns `undefined` if no provider for that key is found in the ancestry.

- **Generics**: `<T>` - The expected type of the value.
- **Arguments**: `key` - The string key to look up.

## AI Agent Integration

If you are an AI assistant using this library to generate code:

1.  Always import `{ KeyContextProvider, useKeyContext }`.
2.  Use `keyName` prop on `KeyContextProvider` (NOT `key`).
3.  Always check for `undefined` when consuming if the provider is not guaranteed.
4.  Use generics `useKeyContext<Type>("key")` to ensure type correctness in the generated code.

## License

MIT
