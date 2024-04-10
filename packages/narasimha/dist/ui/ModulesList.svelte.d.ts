import { SvelteComponent } from "svelte";
import type { Module } from '../pantry.js';
declare const __propDef: {
    props: {
        modules: Module[];
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type ModulesListProps = typeof __propDef.props;
export type ModulesListEvents = typeof __propDef.events;
export type ModulesListSlots = typeof __propDef.slots;
export default class ModulesList extends SvelteComponent<ModulesListProps, ModulesListEvents, ModulesListSlots> {
}
export {};
