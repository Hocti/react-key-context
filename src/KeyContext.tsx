import React, { createContext, useContext, useMemo, useRef, useEffect, useSyncExternalStore } from 'react';

// --- Types ---

type Listener = () => void;

interface Store {
  getValue: () => any;
  subscribe: (listener: Listener) => () => void;
  notify: () => void;
}

// The Context Value is a prototype chain of stores.
// We use 'any' here as the record value because the keys are dynamic.
// Type safety is enforced at the hook level.
type Scope = Record<string, Store>;

// --- Internal Utilities ---

function createStore(initialValue: any): Store & { setValue: (v: any) => void } {
  let value = initialValue;
  const listeners: Set<Listener> = new Set();

  return {
    getValue: () => value,
    setValue: (newValue: any) => {
      if (Object.is(value, newValue)) return;
      value = newValue;
      listeners.forEach((l) => l());
    },
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    notify: () => listeners.forEach((l) => l()),
  };
}

// --- Context ---

const KeyContext = createContext<Scope | null>(null);

// --- Provider ---

export interface KeyContextProviderProps {
  keyName: string; // 'key' is a reserved prop in React, so we use keyName. 
                   // Wait, usage req: <KeyContextProvider key="myKey" ...> 
                   // You cannot use 'key' as a prop. It's properly swallowed by React.
                   // The user request said: <KeyContextProvider key="myKey" value={123} >
                   // This is technically impossible in standard React instructions if they mean the special 'key' prop.
                   // However, if they mean a prop named 'key', it will be undefined in props.
                   // I must warn or use a different prop. 
                   // actually, let's look at the request: `key="myKey"`. 
                   // React DOES NOT deliver `key` to components.
                   // I will implement it as `prop key` first, but I know it won't work.
                   // I should probably use an alias or check if I can access it.
                   // Actually, I'll use `_key` or `k` or just tell the user `key` is reserved.
                   // BUT, maybe the user implies they WANT to use `key`. 
                   // If I write: const { key, value, children } = props; key will be undefined.
                   // Let's use `keyName` in implementation and I'll add a note.
                   // OR, maybe the user made a mistake in the request prompt? "just like this: <KeyContextProvider key=..."
                   // I will Support `id` or `name` or `contextKey`.
                   // Let's stick to the prompt's *intent* but maybe fix the syntax. 
                   // actually, I can't fix the user's syntax request if they insist.
                   // Let's try to see if I can use `key` from `...props`? No, React strips it.
                   // I will implement a prop called `id` but also `keyName`?
                   // No, I'll implement `k` or `name`. 
                   // Let's look at standard patterns. `id` is common.
                   // Wait, I'll try to just define `key` in types, maybe in React 19 or some versions it *might* be accessible? No.
                   // I will assume the user meant a prop that *acts* like a key. I'll call it `propKey` alias?
                   // Let's use `name` and update docs to say "Use 'name' (React reserves 'key')".
                   // Update: The prompt explicitly wrote `key="myKey"`. I should probably write a check. 
                   // If I cannot access `key`, I will fail.
                   // Let's try to be smart. I will use `id` as the primary prop, and maybe `name`.
                   // I will output a prop named `ctxKey`?
                   // Let's write the code to create the provider, and I will use `keyName` as the internal logic
                   // and expose it as `keyName` in props. 
                   // Re-reading prompt: "KeyContextProvider key="myKey"".
                   // I will strictly follow, but if I can't, I will use `keyName` and mention it in README.
                   // Actually, simpler: I'll use `keyName` in the code, but the user example used `key`. 
                   // I will define the prop as `keyName` in the interface.
                   // If the user tries `<Provider key="..." />`, `props.keyName` will be undefined.
                   // I'll add a runtime check? No, types will catch it.
                   // I'll just use `keyName` for now.
  value: any;
  children: React.ReactNode;
}

// Re-defining props to allow 'key' if possible? No.
// I will use `name` as the prop for the context key.
// But to match the user request as closely as possible, I will add a comment.

export const KeyContextProvider = ({ keyName, value, children }: KeyContextProviderProps) => {
  const parentScope = useContext(KeyContext);
  
  // We use a ref to hold the store so it's stable across renders
  // We only recreate it if we *really* need to (which we shouldn't if we design it right).
  // Actually, we want a stable Store object for a given component instance.
  const storeRef = useRef<ReturnType<typeof createStore> | null>(null);

  if (!storeRef.current) {
    storeRef.current = createStore(value);
  }

  // Update store value when prop value changes
  useEffect(() => {
    storeRef.current?.setValue(value);
  }, [value]);

  // Create the new scope using prototype inheritance
  // We use useMemo to ensure the scope object reference is stable
  // unless the parent scope changes or OUR key changes.
  const scope = useMemo(() => {
    if (!keyName) return parentScope; // Should we throw?
    
    // Create a new object inheriting from parentScope (or null)
    const newScope = Object.create(parentScope || null);
    
    // Assign our store to our key
    newScope[keyName] = storeRef.current;
    
    return newScope;
  }, [parentScope, keyName]); // storeRef is stable

  return <KeyContext.Provider value={scope}>{children}</KeyContext.Provider>;
};

// --- Hook ---

export function useKeyContext<T = any>(keyName: string): T | undefined {
  const scope = useContext(KeyContext);

  const getSnapshot = () => {
    if (!scope) return undefined;
    const store = scope[keyName]; // This looks up the prototype chain
    return store ? store.getValue() : undefined;
  };

  const subscribe = (onStoreChange: () => void) => {
    if (!scope) return () => {};
    const store = scope[keyName];
    if (!store) {
        // If no store exists for this key, we can't really subscribe to *it*.
        // But what if it appears later? (e.g. dynamic parent injection?)
        // React Context propagation handles the "parent injected" case 
        // because 'scope' itself will change (referentially) if a parent adds a provider,
        // triggering this hook to re-run and re-subscribe.
        // So we just return a no-op unsubscribe.
        return () => {};
    }
    return store.subscribe(onStoreChange);
  };

  // Optimization: 
  // If the 'scope' changes but the specific 'keyName' still resolves to the SAME store,
  // we don't necessarily need to trigger a React update, but useSyncExternalStore handles
  // the 'subscribe' change.
  // The crucial part is that `store` reference inside `subscribe` logic needs to be consistent.
  
  return useSyncExternalStore(subscribe, getSnapshot);
}
