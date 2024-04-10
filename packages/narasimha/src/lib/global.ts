import type { SchemaClass } from './schema.js';
import { readable } from 'svelte/store';

export const schema = readable(undefined as undefined | SchemaClass);

export const liveIndicatorSettings = readable({
	href: '/websockets',
	title: 'Websockets'
});
