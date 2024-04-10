import { readable } from 'svelte/store';
export const schema = readable(undefined);
export const liveIndicatorSettings = readable({
    href: '/websockets',
    title: 'Websockets'
});
