import { SvelteComponent } from "svelte";
import { Kind } from '../index.js';
declare const __propDef: {
    props: {
        kind: Kind;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type TypeKindIndicatorProps = typeof __propDef.props;
export type TypeKindIndicatorEvents = typeof __propDef.events;
export type TypeKindIndicatorSlots = typeof __propDef.slots;
export default class TypeKindIndicator extends SvelteComponent<TypeKindIndicatorProps, TypeKindIndicatorEvents, TypeKindIndicatorSlots> {
}
export {};
