import { SvelteComponent } from "svelte";
import type { AugmentedField, Pantry } from '../index.js';
declare const __propDef: {
    props: {
        field: AugmentedField;
        pantry: Pantry;
        kind: 'query' | 'mutation' | 'subscription' | 'field';
        typeIsEnumAndWasExpanded?: boolean | undefined;
        headingLevel: 'h3' | 'h4';
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type FieldProps = typeof __propDef.props;
export type FieldEvents = typeof __propDef.events;
export type FieldSlots = typeof __propDef.slots;
export default class Field extends SvelteComponent<FieldProps, FieldEvents, FieldSlots> {
}
export {};
