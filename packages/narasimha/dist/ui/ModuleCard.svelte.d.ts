import { SvelteComponent } from "svelte";
import type { Module } from '../pantry.js';
declare const __propDef: {
    props: {
        module: Module;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        icon: {};
    };
};
export type ModuleCardProps = typeof __propDef.props;
export type ModuleCardEvents = typeof __propDef.events;
export type ModuleCardSlots = typeof __propDef.slots;
export default class ModuleCard extends SvelteComponent<ModuleCardProps, ModuleCardEvents, ModuleCardSlots> {
}
export {};
