/// <reference types="svelte" />
import type { Writable } from 'svelte/store';
export default function debounced<T>(store: Writable<T>, cooldown?: number): Writable<T>;
