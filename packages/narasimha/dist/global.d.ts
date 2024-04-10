/// <reference types="svelte" />
import type { SchemaClass } from './schema.js';
export declare const schema: import("svelte/store").Readable<SchemaClass>;
export declare const liveIndicatorSettings: import("svelte/store").Readable<{
    href: string;
    title: string;
}>;
