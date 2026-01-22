import React, { createContext, useContext, useMemo, useRef, useEffect, useSyncExternalStore } from "react";

/**
 * A simple observable store for individual context values.
 */
type Listener = () => void;

interface Store {
	/** Returns the current value held by the store. */
	getValue: () => any;
	/** Subscribes a listener to value changes. Returns an unsubscribe function. */
	subscribe: (listener: Listener) => () => void;
	/** Manually triggers all subscribed listeners. */
	notify: () => void;
}

/**
 * A scope represents a collection of stores mapped by keys.
 * It follows a prototype chain to allow hierarchical key resolution.
 */
type Scope = Record<string, Store>;

/**
 * Creates a store with an initial value and subscription logic.
 */
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

const KeyContext = createContext<Scope | null>(null);

/**
 * Props for the KeyContextProvider.
 */
export interface KeyContextProviderProps {
	/** The unique key name for this context value. */
	keyName: string;
	/** The value to provide for the specified key. */
	value: any;
	/** React children components. */
	children: React.ReactNode;
}

/**
 * Provides a value for a specific key in the context.
 * Providers can be nested; inner providers for the same key will override outer ones,
 * while providers for different keys will complement each other.
 */
export const KeyContextProvider = ({ keyName, value, children }: KeyContextProviderProps) => {
	const parentScope = useContext(KeyContext);

	// Maintain a stable store instance for this provider
	const storeRef = useRef<ReturnType<typeof createStore> | null>(null);

	if (!storeRef.current) {
		storeRef.current = createStore(value);
	}

	// Update the store's value when the prop changes
	useEffect(() => {
		storeRef.current?.setValue(value);
	}, [value]);

	// Create a new scope that inherits from the parent scope using prototype inheritance.
	// This ensures that lookups for keys not present in this provider will fall back to the parent.
	const scope = useMemo(() => {
		if (!keyName) return parentScope;

		const newScope = Object.create(parentScope || null);
		newScope[keyName] = storeRef.current;

		return newScope;
	}, [parentScope, keyName]);

	return <KeyContext.Provider value={scope}>{children}</KeyContext.Provider>;
};

/**
 * Accesses a value from the key-based context.
 * It automatically subscribes to changes of the value associated with the given keyName.
 * 
 * @param keyName - The key to look up in the context hierarchy.
 * @returns The value associated with the key, or undefined if not found.
 */
export function useKeyContext<T = any>(keyName: string): T | undefined {
	const scope = useContext(KeyContext);

	const getSnapshot = () => {
		if (!scope) return undefined;
		const store = scope[keyName]; // Lookup via prototype chain
		return store ? store.getValue() : undefined;
	};

	const subscribe = (onStoreChange: () => void) => {
		if (!scope) return () => {};
		const store = scope[keyName];
		if (!store) {
			// If the store is missing, we can't subscribe. 
			// If a provider for this key is added higher up later, 
			// the 'scope' change will trigger a re-subscription in this hook.
			return () => {};
		}
		return store.subscribe(onStoreChange);
	};

	return useSyncExternalStore(subscribe, getSnapshot);
}
