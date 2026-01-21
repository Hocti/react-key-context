import React, { createContext, useContext, useMemo, useRef, useEffect, useSyncExternalStore } from "react";

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
	keyName: string;
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
